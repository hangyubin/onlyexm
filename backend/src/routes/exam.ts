import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { infectionGuard } from '../middleware/infectionGuard';
import { submitExam, startExam, saveAnswer, autoSubmitExam } from '../services/examService';
import prisma from '../lib/prisma';
import { getDictItems } from '../utils/dictCache';
import { success, error, paginate } from '../utils/response';

async function getDepartmentName(code: string): Promise<string> {
  if (!code) return '';
  const items = await getDictItems('DEPARTMENT');
  const hit = items.find(i => i.code === code || i.code.toUpperCase() === code.toUpperCase());
  return hit ? hit.name : code;
}

const router = express.Router();

router.get('/records/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [inProgressCount, todayCompletedCount, abnormalSwitchCount] = await Promise.all([
      prisma.examRecord.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.examRecord.count({
        where: {
          status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
          endTime: { gte: today, lt: tomorrow },
        },
      }),
      prisma.examRecord.count({
        where: {
          tabSwitchCount: { gt: 3 },
          status: { in: ['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
        },
      }),
    ]);

    const paperStats = await prisma.examRecord.groupBy({
      by: ['paperId'],
      where: {
        status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
      },
      _count: { id: true },
      _avg: { score: true },
    });

    const paperIds = paperStats.map((s) => s.paperId);
    const papers = await prisma.paper.findMany({
      where: { id: { in: paperIds } },
      select: { id: true, name: true, passingScore: true },
    });
    const paperMap = new Map(papers.map((p) => [p.id, p]));

    const passCountByPaper = await prisma.examRecord.groupBy({
      by: ['paperId'],
      where: {
        status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
        isPassed: true,
      },
      _count: { id: true },
    });
    const passCountMap = new Map(passCountByPaper.map((p) => [p.paperId, p._count.id]));

    const paperDetails = paperStats.map((stat) => {
      const paper = paperMap.get(stat.paperId);
      const total = stat._count.id;
      const passCount = passCountMap.get(stat.paperId) || 0;
      return {
        paperId: stat.paperId,
        paperName: paper?.name || '未知试卷',
        participantCount: total,
        averageScore: stat._avg.score ? Math.round(stat._avg.score * 10) / 10 : 0,
        passRate: total > 0 ? Math.round((passCount / total) * 1000) / 10 : 0,
      };
    });

    const hourlyData = await prisma.examRecord.findMany({
      where: { startTime: { gte: today, lt: tomorrow } },
      select: { startTime: true },
    });

    const hourCounts: Record<number, number> = {};
    for (let h = 8; h <= 18; h++) {
      hourCounts[h] = 0;
    }
    for (const record of hourlyData) {
      const hour = new Date(record.startTime).getHours();
      if (hour >= 8 && hour <= 18) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    const trendLabels = Object.keys(hourCounts).map((h) => `${h.padStart(2, '0')}:00`);
    const trendData = Object.values(hourCounts);

    success(res, {
      inProgressCount,
      todayCompletedCount,
      abnormalSwitchCount,
      paperDetails,
      trend: { labels: trendLabels, data: trendData },
    });
  } catch (error) {
    console.error('Get exam stats error:', error);
    error(res, 500, '获取考试统计失败');
  }
});

// 获取单条考试记录详情（用户端查看结果）
router.get('/records/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return error(res, 400, '无效的考试记录ID');
    }

    const examRecord = await prisma.examRecord.findUnique({
      where: { id },
      include: {
        paper: {
          include: {
            paperQuestions: {
              include: {
                question: {
                  include: { options: true },
                },
              },
            },
          },
        },
        answerDetails: true,
        user: {
          select: { id: true, realName: true, department: true, hospital: { select: { name: true } } },
        },
      },
    });

    if (!examRecord) {
      return error(res, 404, '考试记录不存在');
    }
    if (!examRecord.paper) {
      return error(res, 404, '试卷不存在或已删除');
    }

    // 构建题目Map
    const questionMap = new Map<number, any>();
    for (const pq of examRecord.paper.paperQuestions) {
      questionMap.set(pq.question.id, { question: pq.question, score: pq.score });
    }

    // 构建答案Map（同一题可能有多条记录，取isCorrect不为false或最后一条）
    const answerMap = new Map<number, any>();
    for (const ad of examRecord.answerDetails) {
      const existing = answerMap.get(ad.questionId);
      if (!existing || ad.isCorrect || ad.scoreObtained > 0) {
        answerMap.set(ad.questionId, ad);
      }
    }

    // 生成题目结果
    const questionResults = Array.from(questionMap.entries()).map(([questionId, { question, score }]) => {
      const answerDetail = answerMap.get(questionId);
      const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
      const correctAnswer = correctOptions.map((opt: any) => opt.optionKey).sort();

      let userAnswer: string | string[] = [];
      if (answerDetail) {
        try {
          const parsed = JSON.parse(answerDetail.userAnswer);
          userAnswer = Array.isArray(parsed) ? parsed.sort() : parsed;
        } catch {
          userAnswer = answerDetail.userAnswer;
        }
      }

      const normalizedUserAnswer = Array.isArray(userAnswer) ? userAnswer.sort().join(',') : String(userAnswer);
      const normalizedCorrectAnswer = correctAnswer.join(',');
      const isCorrect = answerDetail ? answerDetail.isCorrect : false;
      const earnedScore = answerDetail ? answerDetail.scoreObtained : 0;

      return {
        questionId,
        content: question.content,
        type: question.type,
        options: question.type !== 'JUDGE' ? question.options.map((opt: any) => ({
          optionKey: opt.optionKey,
          content: opt.content,
          isCorrect: opt.isCorrect,
        })) : [],
        userAnswer,
        correctAnswer: correctAnswer.length > 1 ? correctAnswer : correctAnswer[0] || '',
        isCorrect,
        score,
        earnedScore,
      };
    });

    const durationMinutes = examRecord.durationSeconds
      ? Math.round(examRecord.durationSeconds / 60)
      : 0;

    success(res, {
        id: examRecord.id,
        paperName: examRecord.paper?.name || '已删除试卷',
        totalScore: examRecord.paper?.totalScore ?? 0,
        earnedScore: examRecord.score,
        passed: examRecord.isPassed,
        passScore: examRecord.paper?.passingScore ?? 60,
        duration: durationMinutes,
        submittedAt: examRecord.endTime || examRecord.startTime,
        questionResults,
        userName: examRecord.user.realName || '',
        department: await getDepartmentName(examRecord.user.department || ''),
        hospitalName: (examRecord.user as any).hospital?.name || '',
    });
  } catch (error) {
    console.error('Get exam record detail error:', error);
    error(res, 500, '获取考试结果失败');
  }
});

router.get('/records', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const paperId = req.query.paperId ? parseInt(req.query.paperId as string) : undefined;
    const keyword = (req.query.keyword as string)?.trim() || '';
    const status = req.query.status as string;

    const where: any = {};
    if (paperId && !isNaN(paperId)) {
      where.paperId = paperId;
    }
    if (status && ['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'].includes(status)) {
      where.status = status;
    }
    if (keyword) {
      where.user = {
        OR: [
          { realName: { contains: keyword } },
          { username: { contains: keyword } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.examRecord.findMany({
        where,
        include: {
          user: { select: { id: true, realName: true, username: true, department: true } },
          paper: { select: { id: true, name: true, durationMinutes: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.examRecord.count({ where }),
    ]);

    const statusMap: Record<string, string> = {
      IN_PROGRESS: '进行中',
      SUBMITTED: '已提交',
      AUTO_SUBMIT: '自动提交',
      FORCE_SUBMIT: '强制提交',
    };

    const records = items.map((item) => {
      const durationSeconds = item.durationSeconds
        ?? (item.status === 'IN_PROGRESS'
          ? Math.floor((Date.now() - new Date(item.startTime).getTime()) / 1000)
          : null);

      const minutes = durationSeconds != null ? Math.floor(durationSeconds / 60) : 0;
      const seconds = durationSeconds != null ? durationSeconds % 60 : 0;
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      return {
        id: item.id,
        userId: item.userId,
        userName: item.user.realName || item.user.username,
        department: item.user.department,
        paperId: item.paperId,
        paperName: item.paper?.name || '已删除试卷',
        startTime: item.startTime,
        endTime: item.endTime,
        durationSeconds,
        time: timeStr,
        score: item.score,
        isPassed: item.isPassed,
        tabSwitchCount: item.tabSwitchCount,
        status: item.status,
        statusLabel: statusMap[item.status] || item.status,
        clientIp: item.clientIp || '',
        suspiciousLogCount: (() => { try { return item.suspiciousLog ? JSON.parse(item.suspiciousLog).length : 0; } catch { return 0; } })(),
      };
    });

    paginate(res, records, total, page, pageSize);
  } catch (error) {
    console.error('Get exam records error:', error);
    error(res, 500, '获取考试记录失败');
  }
});

router.get('/start/:paperId', authMiddleware, infectionGuard, async (req, res) => {
  try {
    const paperId = parseInt(req.params.paperId, 10);
    const userId = req.user?.userId;

    if (isNaN(paperId)) {
      return error(res, 400, '无效的试卷ID');
    }

    if (!userId) {
      return error(res, 401, '未授权');
    }

    // 获取客户端IP
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.headers['x-real-ip'] as string
      || req.socket.remoteAddress
      || '';

    const result = await startExam(paperId, userId, clientIp);

    if (result.error) {
      return error(res, 400, result.error);
    }

    success(res, result);
  } catch (error) {
    console.error('Start exam error:', error);
    error(res, 500, '服务器内部错误');
  }
});

router.post('/save-answer', authMiddleware, async (req, res) => {
  try {
    const { examRecordId, questionId, answer } = req.body;

    if (!examRecordId || !questionId || answer === undefined) {
      return error(res, 400, '缺少必填字段');
    }

    const record = await prisma.examRecord.findUnique({ where: { id: examRecordId } });
    if (!record || record.userId !== req.user?.userId) {
      return error(res, 403, '无权操作此考试记录');
    }

    const successResult = await saveAnswer(examRecordId, questionId, answer);

    success(res, { success: successResult });
  } catch (error) {
    console.error('Save answer error:', error);
    error(res, 500, '服务器内部错误');
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { examRecordId, answers, tabSwitchCount, suspiciousLog } = req.body;

    if (!examRecordId || !answers || !Array.isArray(answers)) {
      return error(res, 400, '缺少必填字段');
    }

    // 检查考试是否已超时
    const examRecord = await prisma.examRecord.findUnique({
      where: { id: examRecordId },
      include: { paper: true },
    });

    if (!examRecord) {
      return error(res, 404, '考试记录不存在');
    }
    if (examRecord.userId !== req.user?.userId) {
      return error(res, 403, '无权操作此考试记录');
    }
    if (!examRecord.paper) {
      return error(res, 404, '试卷不存在或已删除');
    }

    // 服务端校验是否超时
    const elapsedSeconds = Math.floor((Date.now() - new Date(examRecord.startTime).getTime()) / 1000);
    const totalAllowedSeconds = examRecord.paper.durationMinutes * 60;
    if (elapsedSeconds >= totalAllowedSeconds) {
      // 超时，自动交卷
      // 使用 submitExam 逻辑处理答案
      const result = await submitExam({
        examRecordId,
        answers,
        tabSwitchCount: tabSwitchCount || 0,
        suspiciousLog: suspiciousLog || [],
      });

      // 保存 suspiciousLog
      if (result.code === 0) {
        await prisma.examRecord.update({
          where: { id: examRecordId },
          data: {
            suspiciousLog: suspiciousLog && suspiciousLog.length > 0 ? JSON.stringify(suspiciousLog) : null,
          },
        });
      }

      // 更新状态为 AUTO_SUBMIT
      if (result.code === 0) {
        await prisma.examRecord.update({
          where: { id: examRecordId },
          data: { status: 'AUTO_SUBMIT' as any },
        });
      }
      return success(res, { ...result.data, autoSubmitted: true });
    }

    const result = await submitExam({
      examRecordId,
      answers,
      tabSwitchCount: tabSwitchCount || 0,
      suspiciousLog: suspiciousLog || [],
    });

    if (result.code === 0) {
      // 保存 suspiciousLog
      await prisma.examRecord.update({
        where: { id: examRecordId },
        data: {
          suspiciousLog: suspiciousLog && suspiciousLog.length > 0 ? JSON.stringify(suspiciousLog) : null,
        },
      });

      success(res, result.data);
    } else {
      error(res, result.code === 404 ? 404 : 400, result.message);
    }
  } catch (error) {
    console.error('Submit exam error:', error);
    error(res, 500, '服务器内部错误');
  }
});

// 监控详情接口 - 管理端查看考生实时答题进度
router.get('/monitor/:examRecordId', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const examRecordId = parseInt(req.params.examRecordId);
    if (isNaN(examRecordId)) {
      return error(res, 400, '无效的考试记录ID');
    }

    const examRecord = await prisma.examRecord.findUnique({
      where: { id: examRecordId },
      include: {
        user: { select: { realName: true, department: true } },
        paper: {
          select: { name: true, paperQuestions: { include: { question: { select: { id: true, content: true } } } } },
        },
        answerDetails: { select: { questionId: true, userAnswer: true } },
      },
    });

    if (!examRecord) {
      return error(res, 404, '考试记录不存在');
    }
    if (!examRecord.paper) {
      return error(res, 404, '试卷不存在或已删除');
    }

    // 解析 suspiciousLog
    let suspiciousLog: any[] = [];
    try {
      suspiciousLog = examRecord.suspiciousLog ? JSON.parse(examRecord.suspiciousLog) : [];
    } catch { suspiciousLog = []; }

    // 构建答题进度
    const totalQuestions = examRecord.paper.paperQuestions.length;
    const answeredQuestions = examRecord.answerDetails.length;

    // 构建当前答案列表
    const questionIndexMap = new Map<number, number>();
    examRecord.paper.paperQuestions.forEach((pq, index) => {
      questionIndexMap.set(pq.question.id, index + 1);
    });

    const currentAnswers = examRecord.answerDetails.map((ad) => {
      const pq = examRecord.paper.paperQuestions.find((p) => p.question.id === ad.questionId);
      let displayAnswer = ad.userAnswer;
      try {
        const parsed = JSON.parse(ad.userAnswer);
        if (Array.isArray(parsed)) displayAnswer = parsed.join(',');
      } catch { /* use as-is */ }
      return {
        questionId: ad.questionId,
        questionIndex: questionIndexMap.get(ad.questionId) || 0,
        content: pq?.question.content || '',
        userAnswer: displayAnswer,
      };
    });

    success(res, {
      id: examRecord.id,
      userName: examRecord.user.realName || '',
      department: await getDepartmentName(examRecord.user.department || ''),
      paperName: examRecord.paper?.name || '已删除试卷',
      status: examRecord.status,
      score: examRecord.score,
      tabSwitchCount: examRecord.tabSwitchCount,
      clientIp: examRecord.clientIp || '',
      suspiciousLog,
      answerProgress: {
        answered: answeredQuestions,
        total: totalQuestions,
        percent: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      },
      currentAnswers,
    });
  } catch (error) {
    console.error('Get monitor detail error:', error);
    error(res, 500, '获取监控详情失败');
  }
});

// 强制交卷接口
router.post('/:examRecordId/force-submit', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const examRecordId = parseInt(req.params.examRecordId);
    if (isNaN(examRecordId)) {
      return error(res, 400, '无效的考试记录ID');
    }

    const examRecord = await prisma.examRecord.findUnique({
      where: { id: examRecordId },
      include: {
        paper: {
          include: {
            paperQuestions: {
              include: {
                question: {
                  include: { options: true },
                },
              },
            },
          },
        },
      },
    });

    if (!examRecord) {
      return error(res, 404, '考试记录不存在');
    }
    if (!examRecord.paper) {
      return error(res, 404, '试卷不存在或已删除');
    }

    if (examRecord.status !== 'IN_PROGRESS') {
      return error(res, 400, '该考试已结束，无法强制交卷');
    }

    // 收集已保存的答案
    const answerDetails = await prisma.answerDetail.findMany({
      where: { examRecordId },
    });

    const questionMap = new Map<number, any>();
    for (const pq of examRecord.paper.paperQuestions) {
      questionMap.set(pq.question.id, { question: pq.question, score: pq.score });
    }

    let totalScore = 0;
    let infectionScore = 0;
    let infectionTotal = 0;
    const processedAnswers: any[] = [];

    for (const detail of answerDetails) {
      const qInfo = questionMap.get(detail.questionId);
      if (!qInfo) continue;

      const { question, score: questionScore } = qInfo;
      const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
      const correctAnswer = correctOptions.map((opt: any) => opt.optionKey).sort().join(',');
      const userAnswer = detail.userAnswer;
      let normalizedUserAnswer = userAnswer;
      try {
        const parsed = JSON.parse(userAnswer);
        if (Array.isArray(parsed)) {
          normalizedUserAnswer = parsed.sort().join(',');
        }
      } catch { /* not JSON array, use as-is */ }

      const isCorrect = normalizedUserAnswer === correctAnswer;
      const obtainedScore = isCorrect ? questionScore : 0;

      totalScore += obtainedScore;
      if (question.infectionTag) {
        infectionScore += obtainedScore;
        infectionTotal += questionScore;
      }

      processedAnswers.push({
        examRecordId,
        questionId: question.id,
        userAnswer,
        isCorrect,
        scoreObtained: obtainedScore,
      });
    }

    const durationSeconds = Math.floor(
      (new Date().getTime() - new Date(examRecord.startTime).getTime()) / 1000
    );
    const isPassed = totalScore >= (examRecord.paper?.passingScore ?? 60);

    // 更新已有的答案详情的得分
    for (const pa of processedAnswers) {
      await prisma.answerDetail.updateMany({
        where: { examRecordId: pa.examRecordId, questionId: pa.questionId },
        data: { isCorrect: pa.isCorrect, scoreObtained: pa.scoreObtained },
      });
    }

    await prisma.examRecord.update({
      where: { id: examRecordId },
      data: {
        endTime: new Date(),
        durationSeconds,
        score: totalScore,
        infectionScore,
        isPassed,
        status: 'FORCE_SUBMIT' as any,
      },
    });

    success(res, { examRecordId, score: totalScore, isPassed, status: 'FORCE_SUBMIT' }, '强制交卷成功');
  } catch (error) {
    console.error('Force submit exam error:', error);
    error(res, 500, '强制交卷失败');
  }
});

export default router;
