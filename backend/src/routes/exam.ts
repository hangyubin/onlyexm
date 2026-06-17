import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { infectionGuard } from '../middleware/infectionGuard';
import { submitExam, startExam, saveAnswer, autoSubmitExam } from '../services/examService';
import prisma from '../lib/prisma';
import { getDictItems } from '../utils/dictCache';
import { success, error, paginate } from '../utils/response';
import { htmlToPdf } from '../utils/pdf';

async function getDepartmentName(code: string): Promise<string> {
  if (!code) return '';
  const items = await getDictItems('DEPARTMENT');
  const hit = items.find(i => i.code === code || i.code.toUpperCase() === code.toUpperCase());
  return hit ? hit.name : code;
}

const router = express.Router();

router.get('/records/stats', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
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
  } catch (err) {
    console.error('Get exam stats error:', err);
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
    // 所有权校验：非管理员只能查看自己的考试记录
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'INFECTION_OFFICER' && examRecord.userId !== req.user?.userId) {
      return error(res, 403, '无权查看他人的考试记录');
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
  } catch (err) {
    console.error('Get exam record detail error:', err);
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
    // 非管理员只能查看自己的考试记录
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'INFECTION_OFFICER') {
      where.userId = req.user?.userId;
    }
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
  } catch (err) {
    console.error('Get exam records error:', err);
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
  } catch (err) {
    console.error('Start exam error:', err);
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
  } catch (err) {
    console.error('Save answer error:', err);
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

      // 保存 suspiciousLog 和状态更新在一个事务中
      if (result.code === 0) {
        await prisma.$transaction(async (tx) => {
          await tx.examRecord.update({
            where: { id: examRecordId },
            data: {
              suspiciousLog: suspiciousLog && suspiciousLog.length > 0 ? JSON.stringify(suspiciousLog) : null,
            },
          });
          await tx.examRecord.update({
            where: { id: examRecordId },
            data: { status: 'AUTO_SUBMIT' as any },
          });
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
  } catch (err) {
    console.error('Submit exam error:', err);
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
  } catch (err) {
    console.error('Get monitor detail error:', err);
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

    // 更新已有的答案详情的得分（使用事务保证一致性）
    await prisma.$transaction(async (tx) => {
      for (const pa of processedAnswers) {
        await tx.answerDetail.updateMany({
          where: { examRecordId: pa.examRecordId, questionId: pa.questionId },
          data: { isCorrect: pa.isCorrect, scoreObtained: pa.scoreObtained },
        });
      }

      await tx.examRecord.update({
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
    });

    success(res, { examRecordId, score: totalScore, isPassed, status: 'FORCE_SUBMIT' }, '强制交卷成功');
  } catch (err) {
    console.error('Force submit exam error:', err);
    error(res, 500, '强制交卷失败');
  }
});

// 打印考生答题试卷（带答案）
router.get('/records/:id/print', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return error(res, 400, '无效的考试记录ID');

    const examRecord = await prisma.examRecord.findUnique({
      where: { id },
      include: {
        paper: { include: { paperQuestions: { include: { question: { include: { options: true } } } } } },
        answerDetails: true,
        user: { select: { realName: true, department: true, hospital: { select: { name: true } } } },
      },
    });

    if (!examRecord) return error(res, 404, '考试记录不存在');
    // 所有权校验：非管理员只能打印自己的考试记录
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'INFECTION_OFFICER' && examRecord.userId !== req.user?.userId) {
      return error(res, 403, '无权打印他人的考试记录');
    }
    if (!examRecord.paper) return error(res, 404, '试卷不存在或已删除');

    // 构建题目和答案映射
    const questionMap = new Map<number, any>();
    for (const pq of examRecord.paper.paperQuestions) {
      questionMap.set(pq.question.id, { question: pq.question, score: pq.score });
    }
    const answerMap = new Map<number, any>();
    for (const ad of examRecord.answerDetails) {
      const existing = answerMap.get(ad.questionId);
      if (!existing || ad.isCorrect) answerMap.set(ad.questionId, ad);
    }

    const typeOrder = ['SINGLE', 'MULTIPLE', 'JUDGE', 'CASE'];
    const typeNames: Record<string, string> = { SINGLE: '单项选择题', MULTIPLE: '多项选择题', JUDGE: '是非判断题', CASE: '案例分析题' };
    const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八'];

    // 按题型分组
    const grouped = new Map<string, any[]>();
    for (const [qid, { question, score }] of questionMap) {
      const type = question.type;
      if (!grouped.has(type)) grouped.set(type, []);
      const ans = answerMap.get(qid);
      let userAnswer = '';
      if (ans) {
        try {
          const parsed = JSON.parse(ans.userAnswer);
          userAnswer = Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
        } catch { userAnswer = ans.userAnswer || ''; }
      }
      const correctOptions = question.options.filter((o: any) => o.isCorrect);
      const correctAnswer = correctOptions.map((o: any) => o.optionKey).join(', ');
      grouped.get(type)!.push({ question, score, userAnswer, correctAnswer, isCorrect: ans?.isCorrect ?? false, earnedScore: ans?.scoreObtained ?? 0 });
    }

    // 构建 HTML
    let bodyHtml = '';
    let typeIndex = 0;
    let globalNum = 1;

    for (const type of typeOrder) {
      const questions = grouped.get(type);
      if (!questions || questions.length === 0) continue;
      const typeTotal = questions.reduce((s, q) => s + q.score, 0);
      bodyHtml += `<h3 style="font-size:15px;margin:18px 0 8px;font-weight:bold;">${chineseNumbers[typeIndex]}、${typeNames[type] || type}（共${questions.length}题，${typeTotal}分）</h3>`;

      for (const q of questions) {
        const hasOptions = q.question.options && q.question.options.length > 0;
        const isCorrect = q.isCorrect;
        const borderColor = isCorrect ? '#4ade80' : '#f87171';
        const bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';

        bodyHtml += `<div style="border:1px solid ${borderColor};background:${bgColor};padding:8px;margin-bottom:8px;border-radius:4px;">`;
        bodyHtml += `<p style="font-size:14px;margin:0 0 4px;"><b>${globalNum}.</b> ${escapeHtml(q.question.content)} <span style="font-size:12px;color:#888;">（${q.score}分）</span></p>`;
        globalNum++;

        if (hasOptions && type !== 'JUDGE') {
          bodyHtml += '<div style="padding-left:20px;font-size:13px;">';
          const options = q.question.options;
          for (let i = 0; i < options.length; i += 2) {
            const o1 = options[i];
            const o2 = options[i + 1];
            const isO1Correct = o1.isCorrect;
            const isO2Correct = o2?.isCorrect;
            bodyHtml += `<div style="display:flex;gap:40px;margin-bottom:2px;">`;
            bodyHtml += `<span style="font-weight:${isO1Correct ? 'bold' : 'normal'};color:${isO1Correct ? '#16a34a' : '#333'};">${o1.optionKey}. ${escapeHtml(o1.content)}</span>`;
            if (o2) bodyHtml += `<span style="font-weight:${isO2Correct ? 'bold' : 'normal'};color:${isO2Correct ? '#16a34a' : '#333'};">${o2.optionKey}. ${escapeHtml(o2.content)}</span>`;
            bodyHtml += `</div>`;
          }
          bodyHtml += '</div>';
        }

        bodyHtml += `<p style="font-size:12px;margin:4px 0 0;padding:0 20px;">`;
        bodyHtml += `<span style="color:#666;">考生答案：</span><span style="color:${isCorrect ? '#16a34a' : '#dc2626'};font-weight:bold;">${escapeHtml(q.userAnswer || '未作答')}</span>`;
        bodyHtml += `&emsp;<span style="color:#666;">正确答案：</span><span style="color:#16a34a;font-weight:bold;">${escapeHtml(q.correctAnswer)}</span>`;
        bodyHtml += `&emsp;<span style="color:#666;">得分：</span><span style="color:#2563eb;font-weight:bold;">${q.earnedScore}</span>`;
        bodyHtml += `</p></div>`;
      }
      typeIndex++;
    }

    const deptName = await getDepartmentName(examRecord.user.department || '');
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8">
<style>
  @page { margin: 15mm; }
  body { font-family: 'SimHei', 'Microsoft YaHei', 'PingFang SC', sans-serif; color: #222; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 2px; }
  .subtitle { text-align: center; font-size: 13px; color: #555; margin-bottom: 12px; }
</style>
</head>
<body>
<h1>${escapeHtml(examRecord.paper.name)}</h1>
<p class="subtitle">${(examRecord.user as any).hospital?.name || ''} | 姓名：${escapeHtml(examRecord.user.realName || '')} | 科室：${escapeHtml(deptName)} | 得分：<b>${examRecord.score}</b> / ${examRecord.paper.totalScore} | ${examRecord.isPassed ? '合格' : '不合格'}</p>
${bodyHtml}
</body></html>`;

    const pdfBuffer = await htmlToPdf(html);
    const filename = `${examRecord.paper.name}_${examRecord.user.realName}_答题卡.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Print exam record error:', err);
    error(res, 500, '生成答题卡PDF失败');
  }
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default router;
