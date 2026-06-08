import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { syncPracticeRecords } from '../services/syncService';

const router = express.Router();

router.post('/practice', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: -1, message: '未授权' });
    }
    const { records } = req.body;
    const result = await syncPracticeRecords(userId, records);
    
    res.json({
      code: 0,
      data: result,
    });
  } catch (err) {
    console.error('Sync practice error:', err);
    res.status(500).json({
      code: -1,
      message: '同步失败',
    });
  }
});

export default router;
