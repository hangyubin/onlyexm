import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import {
  getInfectionConfig,
  updateInfectionConfig,
  getConfigLogs,
  type InfectionConfig,
} from '../services/configService';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/infection', authMiddleware, async (req, res) => {
  try {
    const config = await getInfectionConfig();
    res.json({ code: 0, data: config });
  } catch (err) {
    console.error('Get infection config error:', err);
    res.status(500).json({ code: -1, message: '获取配置失败' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configMap: Record<string, any> = {};
    configs.forEach(c => {
      try {
        configMap[c.configKey] = JSON.parse(c.configValue);
      } catch {
        configMap[c.configKey] = c.configValue;
      }
    });
    res.json(configMap);
  } catch (err) {
    console.error('Get system config error:', err);
    res.status(500).json({ error: '获取配置失败' });
  }
});

router.post('/', authMiddleware, roleGuard(['ADMIN']), async (req, res) => {
  try {
    const userId = req.user?.userId;
    const configData = req.body;

    for (const [key, value] of Object.entries(configData)) {
      const configValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await prisma.systemConfig.upsert({
        where: { configKey: key },
        update: { configValue },
        create: { configKey: key, configValue, description: key },
      });

      if (userId) {
        // 读取旧值用于日志记录
        const existing = await prisma.systemConfig.findUnique({ where: { configKey: key } });
        await prisma.configLog.create({
          data: {
            userId,
            configKey: key,
            oldValue: existing?.configValue || '',
            newValue: configValue,
            action: 'UPDATE',
            description: `更新配置: ${key}`,
          },
        });
      }
    }

    res.json({ success: true, message: '配置保存成功' });
  } catch (err) {
    console.error('Save system config error:', err);
    res.status(500).json({ error: '保存配置失败' });
  }
});

router.put('/', authMiddleware, roleGuard(['ADMIN']), async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ code: -1, message: '未授权' });
    }
    
    const updates = req.body as Partial<InfectionConfig>;

    const errors: string[] = [];
    
    if (updates.monthlyRequiredCount !== undefined) {
      if (!Number.isInteger(updates.monthlyRequiredCount) || updates.monthlyRequiredCount < 1 || updates.monthlyRequiredCount > 100) {
        errors.push('每月院感题目要求数必须是1-100之间的整数');
      }
    }

    if (updates.passRateThreshold !== undefined) {
      if (!Number.isInteger(updates.passRateThreshold) || updates.passRateThreshold < 0 || updates.passRateThreshold > 100) {
        errors.push('院感及格线必须是0-100之间的整数');
      }
    }

    if (updates.weakPointThreshold !== undefined) {
      if (!Number.isInteger(updates.weakPointThreshold) || updates.weakPointThreshold < 0 || updates.weakPointThreshold > 100) {
        errors.push('薄弱知识点阈值必须是0-100之间的整数');
      }
    }

    if (updates.unlockAccuracy !== undefined) {
      if (!Number.isInteger(updates.unlockAccuracy) || updates.unlockAccuracy < 0 || updates.unlockAccuracy > 100) {
        errors.push('自动解锁正确率要求必须是0-100之间的整数');
      }
    }

    if (updates.unlockCompletedCount !== undefined) {
      if (!Number.isInteger(updates.unlockCompletedCount) || updates.unlockCompletedCount < 1 || updates.unlockCompletedCount > 100) {
        errors.push('自动解锁完成数要求必须是1-100之间的整数');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ code: -1, message: '参数校验失败', errors });
    }

    const config = await updateInfectionConfig(updates, userId);
    res.json({ code: 0, data: config, message: '配置更新成功' });
  } catch (err) {
    console.error('Update config error:', err);
    res.status(500).json({ code: -1, message: '更新配置失败' });
  }
});

router.get('/logs', authMiddleware, roleGuard(['ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const result = await getConfigLogs(page, pageSize);
    res.json({ code: 0, data: result });
  } catch (err) {
    console.error('Get config logs error:', err);
    res.status(500).json({ code: -1, message: '获取日志失败' });
  }
});

export default router;