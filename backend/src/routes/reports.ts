import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import {
  generateExamSummaryReport,
  generateUnqualifiedStaffReport,
  generateDeptRankingReport,
  generateQuestionErrorRateReport,
  generateActivityReport,
} from '../services/reportService';

const router = express.Router();

const MAX_REPORT_LIMIT = 5000;

// ============ JSON 数据接口（前端表格展示） ============

// 考试成绩汇总
router.post('/exam-summary/data', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.body;
    const where: any = { status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] } };
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') };
    }
    if (department) {
      where.user = { department };
    }

    // 获取科室字典
    const deptDict = await prisma.systemDict.findMany({
      where: { category: 'DEPARTMENT', isActive: true },
      select: { code: true, name: true },
    });
    const deptNameMap = new Map<string, string>();
    deptDict.forEach(d => deptNameMap.set(d.code, d.name));

    const records = await prisma.examRecord.findMany({
      where,
      include: { user: { select: { realName: true, department: true } }, paper: { select: { name: true, totalScore: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const items = records.map((r) => ({
      id: r.id,
      realName: r.user.realName || '',
      department: deptNameMap.get(r.user.department) || r.user.department || '未分配',
      examName: r.paper?.name || '已删除试卷',
      score: r.score || 0,
      totalScore: r.paper?.totalScore ?? 0,
      status: r.isPassed ? 'PASS' : 'FAIL',
      examTime: r.createdAt.toISOString().slice(0, 16),
    }));

    const passCount = items.filter((i) => i.status === 'PASS').length;
    const totalScore = items.reduce((s, i) => s + i.score, 0);

    res.json({
      items,
      passCount,
      failCount: items.length - passCount,
      passRate: items.length > 0 ? Math.round((passCount / items.length) * 100) : 0,
      averageScore: items.length > 0 ? Math.round(totalScore / items.length) : 0,
    });
  } catch (err) {
    console.error('Get exam summary data error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

// 联系记录
router.post('/practice-records/data', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const where: any = {};
    if (startDate && endDate) {
      where.syncTime = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') };
    }

    const records = await prisma.practiceSyncRecord.findMany({
      where,
      include: { user: { select: { realName: true, department: true } } },
      orderBy: { syncTime: 'desc' },
      take: MAX_REPORT_LIMIT,
    });

    // 按用户聚合
    const userMap = new Map<number, { realName: string; department: string; correct: number; total: number; lastTime: string }>();
    for (const r of records) {
      const existing = userMap.get(r.userId);
      if (existing) {
        existing.total += 1;
        if (r.isCorrect) existing.correct += 1;
      } else {
        userMap.set(r.userId, {
          realName: r.user.realName || '',
          department: r.user.department || '',
          correct: r.isCorrect ? 1 : 0,
          total: 1,
          lastTime: r.syncTime?.toISOString().slice(0, 16) || '',
        });
      }
    }

    const items = Array.from(userMap.entries()).map(([userId, data], idx) => ({
      id: idx + 1,
      realName: data.realName,
      department: data.department,
      practiceName: '每日练习',
      score: data.correct,
      totalScore: data.total,
      practiceTime: data.lastTime,
      duration: 0,
    }));

    res.json({ items });
  } catch (err) {
    console.error('Get practice records error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

// 院感达标
router.post('/infection-compliance/data', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const reqs = await prisma.infectionRequirement.findMany({
      where: { month: currentMonth },
      include: { user: { select: { realName: true, department: true } } },
      orderBy: [{ accuracyRate: 'asc' }],
    });

    const items = reqs.map((r, idx) => ({
      id: r.id || idx + 1,
      realName: r.user.realName || '',
      department: r.user.department || '',
      requirementType: '月度院感考核',
      isCompliant: r.completedCount >= r.requiredCount && Number(r.accuracyRate || 0) >= 70,
      lastExamDate: '',
      nextExamDate: '',
      score: Number(r.accuracyRate || 0),
    }));

    res.json({ items });
  } catch (err) {
    console.error('Get infection compliance error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

// 用户学习情况
router.post('/user-study/data', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, realName: true, department: true },
    });

    const userIds = users.map((u) => u.id);
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 批量查询所有用户的相关数据，避免 N+1 问题
    const [examCounts, practiceCounts, wrongCounts, learningRecords, requirements] = await Promise.all([
      prisma.examRecord.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { id: true },
      }),
      prisma.practiceSyncRecord.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { id: true },
      }),
      prisma.wrongQuestion.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, status: 'ACTIVE' },
        _count: { id: true },
      }),
      prisma.learningRecord.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, studyDurationSeconds: true },
      }),
      prisma.infectionRequirement.findMany({
        where: { userId: { in: userIds }, month: currentMonth },
        select: { userId: true, completedCount: true, requiredCount: true },
      }),
    ]);

    // 构建映射
    const examCountMap = new Map(examCounts.map((r) => [r.userId, r._count.id]));
    const practiceCountMap = new Map(practiceCounts.map((r) => [r.userId, r._count.id]));
    const wrongCountMap = new Map(wrongCounts.map((r) => [r.userId, r._count.id]));

    const studyMinutesMap = new Map<number, number>();
    for (const r of learningRecords) {
      studyMinutesMap.set(r.userId, (studyMinutesMap.get(r.userId) || 0) + r.studyDurationSeconds);
    }

    const reqMap = new Map(requirements.map((r) => [r.userId, r]));

    // 在内存中组装结果
    const items = users.map((user) => {
      const req = reqMap.get(user.id);
      const complianceProgress = req
        ? Math.min(100, Math.round((req.completedCount / req.requiredCount) * 100))
        : 0;

      return {
        id: user.id,
        realName: user.realName || '',
        department: user.department || '',
        totalStudyMinutes: Math.round((studyMinutesMap.get(user.id) || 0) / 60),
        practiceCount: practiceCountMap.get(user.id) || 0,
        wrongQuestionCount: wrongCountMap.get(user.id) || 0,
        complianceProgress,
      };
    });

    res.json({ items });
  } catch (err) {
    console.error('Get user study error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

// ============ Excel 导出接口 ============

router.post(
  '/exam-summary',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const buffer = await generateExamSummaryReport(startDate, endDate);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=exam_summary_${startDate}_${endDate}.xlsx`);
      res.send(buffer);
    } catch (err) {
      console.error('Generate exam summary report error:', err);
      res.status(500).json({ code: -1, message: '生成报表失败' });
    }
  }
);

router.post(
  '/unqualified-staff',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const buffer = await generateUnqualifiedStaffReport();

      const currentDate = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=unqualified_staff_${currentDate}.xlsx`);
      res.send(buffer);
    } catch (err) {
      console.error('Generate unqualified staff report error:', err);
      res.status(500).json({ code: -1, message: '生成报表失败' });
    }
  }
);

router.post(
  '/dept-ranking',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const buffer = await generateDeptRankingReport(startDate, endDate);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=dept_ranking_${startDate}_${endDate}.xlsx`);
      res.send(buffer);
    } catch (err) {
      console.error('Generate dept ranking report error:', err);
      res.status(500).json({ code: -1, message: '生成报表失败' });
    }
  }
);

router.post(
  '/question-error-rate',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const buffer = await generateQuestionErrorRateReport();

      const currentDate = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=question_error_rate_${currentDate}.xlsx`);
      res.send(buffer);
    } catch (err) {
      console.error('Generate question error rate report error:', err);
      res.status(500).json({ code: -1, message: '生成报表失败' });
    }
  }
);

router.post(
  '/activity',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const buffer = await generateActivityReport(startDate, endDate);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=activity_report_${startDate}_${endDate}.xlsx`);
      res.send(buffer);
    } catch (err) {
      console.error('Generate activity report error:', err);
      res.status(500).json({ code: -1, message: '生成报表失败' });
    }
  }
);

export default router;