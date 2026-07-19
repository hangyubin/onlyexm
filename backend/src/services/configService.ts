import prisma from '../lib/prisma';
import { getJsonCache, setJsonCache, deleteCache, getCache, setCache } from '../utils/redis';

export interface InfectionConfig {
  monthlyRequiredCount: number;
  passRateThreshold: number;
  lockEnabled: boolean;
  weakPointThreshold: number;
  unlockAccuracy: number;
  unlockCompletedCount: number;
}

// ============================================================
// 院感标签集合（字典驱动，替代各服务中的硬编码数组）
// 从 SystemDict 的 INFECTION_TAG 分类读取，Redis 缓存 10 分钟
// 字典 CRUD 时由 system 路由主动清缓存（见 clearInfectionTagCache）
// ============================================================
const INFECTION_TAG_CACHE_KEY = 'infection_tags';
const INFECTION_TAG_CACHE_TTL = 600; // 10 分钟

// 本地进程内缓存，避免同一实例内高频请求穿透到 Redis
let inProcessTagCache: { codes: Set<string>; timestamp: number } | null = null;
const IN_PROCESS_TAG_CACHE_TTL = 60 * 1000; // 60 秒

// 字典未初始化时的兜底标签（保证系统在字典为空时仍可运行）
const FALLBACK_INFECTION_TAGS = [
  'HAND_HYGIENE', 'MEDICAL_WASTE', 'DISINFECTION', 'EXPOSURE',
  'ISOLATION', 'STERILIZATION', 'MDRO', 'AIR_QUALITY',
];

/**
 * 获取院感标签 Set，用于判断题目是否属于院感题。
 * 三级缓存：进程内存 → Redis → DB，DB 为空时用兜底集合。
 */
export async function getInfectionTagSet(): Promise<Set<string>> {
  // 1. 进程内存缓存（60s）
  const now = Date.now();
  if (inProcessTagCache && now - inProcessTagCache.timestamp < IN_PROCESS_TAG_CACHE_TTL) {
    return inProcessTagCache.codes;
  }

  // 2. Redis 缓存（10min）
  const redisCached = await getCache(INFECTION_TAG_CACHE_KEY);
  if (redisCached) {
    try {
      const codes = new Set<string>(JSON.parse(redisCached));
      inProcessTagCache = { codes, timestamp: now };
      return codes;
    } catch {
      // JSON 解析失败，继续走 DB
    }
  }

  // 3. 数据库查询
  const items = await prisma.systemDict.findMany({
    where: { category: 'INFECTION_TAG', isActive: true },
    select: { code: true },
  });

  const codes = new Set<string>(
    items.length > 0
      ? items.map(i => i.code)
      : FALLBACK_INFECTION_TAGS,
  );

  // 回填 Redis（兜底场景也缓存，避免频繁查空表）
  await setCache(INFECTION_TAG_CACHE_KEY, JSON.stringify([...codes]), INFECTION_TAG_CACHE_TTL);
  inProcessTagCache = { codes, timestamp: now };
  return codes;
}

/**
 * 判断题目的院感标签是否属于院感题（封装常用判断逻辑）。
 */
export async function isInfectionQuestion(
  infectionTag: string | null | undefined,
  subCategory: string | null | undefined,
): Promise<boolean> {
  const tags = await getInfectionTagSet();
  return (infectionTag != null && tags.has(infectionTag)) ||
         (subCategory != null && tags.has(subCategory));
}

/**
 * 字典变更时清除院感标签缓存（供 system 路由调用）。
 */
export function clearInfectionTagCache(): void {
  inProcessTagCache = null;
  // Redis 缓存异步删除，不等待
  deleteCache(INFECTION_TAG_CACHE_KEY).catch(() => { /* 忽略删除失败 */ });
}

const DEFAULT_CONFIG: InfectionConfig = {
  monthlyRequiredCount: 20,
  passRateThreshold: 70,
  lockEnabled: true,
  weakPointThreshold: 60,
  unlockAccuracy: 70,
  unlockCompletedCount: 20,
};

const CACHE_KEY = 'infection_config';

export async function getInfectionConfig(): Promise<InfectionConfig> {
  const cached = await getJsonCache<InfectionConfig>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const configs = await prisma.systemConfig.findMany({
    where: {
      configKey: {
        in: Object.keys(DEFAULT_CONFIG),
      },
    },
  });

  const result: InfectionConfig = { ...DEFAULT_CONFIG };

  configs.forEach(config => {
    const key = config.configKey as keyof InfectionConfig;
    const value = config.configValue;
    const defaultVal = DEFAULT_CONFIG[key];
    const resultRecord = result as unknown as Record<string, unknown>;
    
    if (typeof defaultVal === 'boolean') {
      resultRecord[key] = value === 'true';
    } else if (typeof defaultVal === 'number') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        resultRecord[key] = numValue;
      }
    }
  });

  await setJsonCache(CACHE_KEY, result);
  return result;
}

export async function updateInfectionConfig(
  updates: Partial<InfectionConfig>,
  userId: number
): Promise<InfectionConfig> {
  // 输入验证
  const validationRules: Record<string, { min: number; max: number; label: string }> = {
    monthlyRequiredCount: { min: 1, max: 100, label: '每月要求题数' },
    passRateThreshold: { min: 0, max: 100, label: '及格线' },
    weakPointThreshold: { min: 0, max: 100, label: '薄弱知识点阈值' },
    unlockAccuracy: { min: 0, max: 100, label: '解锁正确率' },
    unlockCompletedCount: { min: 1, max: 100, label: '解锁完成数' },
  };

  for (const [key, value] of Object.entries(updates)) {
    const rule = validationRules[key];
    if (rule && typeof value === 'number') {
      if (value < rule.min || value > rule.max) {
        throw new Error(`${rule.label}必须在 ${rule.min} 到 ${rule.max} 之间`);
      }
    }
  }

  const currentConfig = await getInfectionConfig();

  await prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(updates)) {
      const stringValue = typeof value === 'boolean' ? String(value) : String(value);
      
      const existing = await tx.systemConfig.findUnique({
        where: { configKey: key },
      });

      if (existing) {
        await tx.configLog.create({
          data: {
            userId,
            configKey: key,
            oldValue: existing.configValue,
            newValue: stringValue,
            action: 'UPDATE',
            description: `修改配置 ${key}`,
          },
        });

        await tx.systemConfig.update({
          where: { configKey: key },
          data: { configValue: stringValue },
        });
      } else {
        await tx.systemConfig.create({
          data: {
            configKey: key,
            configValue: stringValue,
            description: getConfigDescription(key as keyof InfectionConfig),
          },
        });

        await tx.configLog.create({
          data: {
            userId,
            configKey: key,
            oldValue: null,
            newValue: stringValue,
            action: 'CREATE',
            description: `创建配置 ${key}`,
          },
        });
      }
    }
  });

  await deleteCache(CACHE_KEY);
  return getInfectionConfig();
}

function getConfigDescription(key: keyof InfectionConfig): string {
  const descriptions: Record<keyof InfectionConfig, string> = {
    monthlyRequiredCount: '每月院感题目要求数',
    passRateThreshold: '院感及格线(%)',
    lockEnabled: '院感锁定开关',
    weakPointThreshold: '薄弱知识点阈值(%)',
    unlockAccuracy: '自动解锁正确率要求(%)',
    unlockCompletedCount: '自动解锁完成数要求',
  };
  return descriptions[key];
}

export async function getConfigLogs(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  
  const logs = await prisma.configLog.findMany({
    skip,
    take: pageSize,
    include: { user: { select: { realName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.configLog.count();

  return {
    data: logs.map(log => ({
      id: log.id,
      operator: log.user.realName,
      configKey: log.configKey,
      oldValue: log.oldValue,
      newValue: log.newValue,
      action: log.action,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}