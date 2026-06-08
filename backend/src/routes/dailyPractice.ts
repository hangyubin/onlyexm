import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getTodayPractice, submitPractice, getUserPracticeHistory, resetTodayPractice, SubmitAnswer, getPracticeResult } from '../services/dailyPracticeService';

const router = express.Router();

router.get('/today', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || 0;
    const questionCount = req.query.questionCount ? parseInt(req.query.questionCount as string) : undefined;
    const practice = await getTodayPractice(userId, questionCount);
    
    res.json({
      success: true,
      ...practice,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取今日练习失败',
    });
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { practiceId, answers } = req.body as { practiceId: number; answers: SubmitAnswer[] };
    const userId = req.user?.userId || 0;
    console.log('提交练习 - 用户ID:', userId, '练习ID:', practiceId, '答案数量:', answers?.length);
    
    const result = await submitPractice(practiceId, answers);
    console.log('提交结果:', result.success, result.message);
    
    res.json(result);
  } catch (err) {
    console.error('提交练习失败:', err);
    res.status(500).json({
      success: false,
      message: '提交练习失败',
    });
  }
});

router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || 0;
    const questionCount = req.body.questionCount ? parseInt(req.body.questionCount as string) : undefined;
    console.log('重置今日练习 - 用户ID:', userId, '题目数量:', questionCount || 10);
    
    const practice = await resetTodayPractice(userId, questionCount);
    
    res.json({
      success: true,
      ...practice,
    });
  } catch (err) {
    console.error('重置练习失败:', err);
    res.status(500).json({
      success: false,
      message: '重置练习失败',
    });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || 0;
    const history = await getUserPracticeHistory(userId, 3);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取练习历史失败',
    });
  }
});

router.get('/result/:practiceId', authMiddleware, async (req, res) => {
  try {
    const practiceId = parseInt(req.params.practiceId);
    console.log('获取练习详情 - ID:', practiceId);
    
    const result = await getPracticeResult(practiceId);
    
    res.json(result);
  } catch (err) {
    console.error('获取练习详情失败:', err);
    res.status(500).json({
      success: false,
      score: 0,
      totalQuestions: 0,
      correctCount: 0,
      accuracy: 0,
      earnedBonus: false,
      message: '获取练习详情失败',
      results: [],
    });
  }
});

export default router;
