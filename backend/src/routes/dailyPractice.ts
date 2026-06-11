import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getTodayPractice, submitPractice, getUserPracticeHistory, resetTodayPractice, SubmitAnswer, getPracticeResult, PracticeOptions } from '../services/dailyPracticeService';

const router = express.Router();

/** 从请求中解析练习选项 */
function parsePracticeOptions(req: express.Request): PracticeOptions | undefined {
  const options: PracticeOptions = {};
  if (req.query.questionCount || req.body.questionCount) {
    options.questionCount = parseInt((req.query.questionCount || req.body.questionCount) as string);
  }
  if (req.query.category || req.body.category) {
    options.category = (req.query.category || req.body.category) as string;
  }
  const tagsRaw = req.query.infectionTags || req.body.infectionTags;
  if (tagsRaw) {
    options.infectionTags = Array.isArray(tagsRaw)
      ? tagsRaw as string[]
      : (tagsRaw as string).split(',');
  }
  return Object.keys(options).length > 0 ? options : undefined;
}

router.get('/today', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || 0;
    const options = parsePracticeOptions(req);
    const practice = await getTodayPractice(userId, options);
    
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
  } catch (err: any) {
    console.error('提交练习失败:', err?.message || err);
    console.error('错误详情:', err?.stack?.split('\n').slice(0, 3).join('\n'));
    res.status(500).json({
      success: false,
      message: '提交练习失败：' + (err?.message || '服务器错误'),
    });
  }
});

router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || 0;
    const options = parsePracticeOptions(req);
    console.log('重置今日练习 - 用户ID:', userId, '选项:', options);
    
    const practice = await resetTodayPractice(userId, options);
    
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
      message: '获取练习详情失败',
    });
  }
});

export default router;
