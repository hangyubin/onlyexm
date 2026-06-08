import prisma from '../lib/prisma';
import { getJsonCache, setJsonCache, deleteCache } from '../utils/redis';

export interface InfectionConfig {
  monthlyRequiredCount: number;
  passRateThreshold: number;
  lockEnabled: boolean;
  weakPointThreshold: number;
  unlockAccuracy: number;
  unlockCompletedCount: number;
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
    include: { user: true },
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