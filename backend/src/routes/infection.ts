import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { htmlToPdf } from '../utils/pdf';

const router = express.Router();

router.get('/status', authMiddleware, async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const requirement = await prisma.infectionRequirement.findFirst({
      where: {
        userId: user.userId,
        month: currentMonth,
      },
    });

    if (!requirement) {
      return res.json({
        isLocked: false,
        needCount: 20,
        currentAccuracy: 0,
        requiredCount: 20,
        completedCount: 0,
      });
    }

    const { requiredCount, completedCount, accuracyRate, isLocked } = requirement;
    const needCount = requiredCount - completedCount;
    const currentAccuracy = accuracyRate ? Number(accuracyRate) : 0;

    res.json({
      isLocked,
      needCount: needCount > 0 ? needCount : 0,
      currentAccuracy,
      requiredCount,
      completedCount,
    });
  } catch (err) {
    console.error('Get infection status error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/check-unlock', authMiddleware, async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  if (user.role !== 'DOCTOR') {
    return res.status(403).json({ error: '权限不足' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const requirement = await prisma.infectionRequirement.findFirst({
      where: {
        userId: user.userId,
        month: currentMonth,
      },
    });

    if (!requirement) {
      return res.json({
        success: true,
        message: '当前月份无院感学习要求',
        isLocked: false,
      });
    }

    const { requiredCount, completedCount, accuracyRate } = requirement;
    const needCount = requiredCount - completedCount;
    const currentAccuracy = accuracyRate ? Number(accuracyRate) : 0;
    const isLocked = needCount > 0 || currentAccuracy < 70;

    if (isLocked) {
      return res.json({
        success: false,
        message: `院感学习未达标，还需完成 ${needCount > 0 ? needCount : 0} 道题，当前正确率 ${currentAccuracy}%`,
        isLocked: true,
        data: {
          needCount: needCount > 0 ? needCount : 0,
          currentAccuracy,
          requiredCount,
          completedCount,
        },
      });
    }

    await prisma.$transaction([
      prisma.infectionRequirement.update({
        where: { id: requirement.id },
        data: { isLocked: false },
      }),
      prisma.user.update({
        where: { id: user.userId },
        data: { isLocked: false },
      }),
    ]);

    res.json({
      success: true,
      message: '院感学习已达标，已解锁',
      isLocked: false,
      data: {
        needCount: 0,
        currentAccuracy,
        requiredCount,
        completedCount,
      },
    });
  } catch (err) {
    console.error('Check unlock error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/scenario/record', authMiddleware, async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const { scenarioId, riskAnswers, actionAnswer, riskScore, actionScore, riskLevel } = req.body;

  if (scenarioId === undefined || !riskAnswers) {
    return res.status(400).json({ error: '缺少必填字段：场景ID和风险评估答案' });
  }

  try {
    const record = await prisma.scenarioRecord.create({
      data: {
        userId: user.userId,
        scenarioId,
        riskAnswers: JSON.stringify(riskAnswers),
        actionAnswer,
        riskScore,
        actionScore,
        riskLevel,
      },
    });

    res.json({
      success: true,
      message: '答题记录保存成功',
      record,
    });
  } catch (err) {
    console.error('Save scenario record error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/scenarios', authMiddleware, async (req, res) => {
  try {
    const scenarios = await prisma.infectionScenario.findMany({
      where: { isActive: true },
      include: {
        risks: true,
        actions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: scenarios,
    });
  } catch (err) {
    console.error('Get scenarios error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/scenarios/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const scenario = await prisma.infectionScenario.findUnique({
      where: { id: parseInt(id) },
      include: {
        risks: true,
        actions: true,
      },
    });

    if (!scenario) {
      return res.status(404).json({ error: '场景不存在' });
    }

    res.json({
      success: true,
      data: scenario,
    });
  } catch (err) {
    console.error('Get scenario error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/scenarios', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const { title, description, imageUrl, expertAdvice, risks, actions } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: '场景标题不能为空' });
  }

  try {
    const scenario = await prisma.infectionScenario.create({
      data: {
        title,
        description,
        imageUrl,
        expertAdvice,
        risks: {
          create: risks,
        },
        actions: {
          create: actions,
        },
      },
      include: {
        risks: true,
        actions: true,
      },
    });

    res.json({
      success: true,
      message: '场景创建成功',
      data: scenario,
    });
  } catch (err) {
    console.error('Create scenario error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/scenarios/:id', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const { id } = req.params;
  const { title, description, imageUrl, expertAdvice, isActive, risks, actions } = req.body;

  try {
    await prisma.$transaction([
      prisma.scenarioRisk.deleteMany({ where: { scenarioId: parseInt(id) } }),
      prisma.scenarioAction.deleteMany({ where: { scenarioId: parseInt(id) } }),
    ]);

    const scenario = await prisma.infectionScenario.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        imageUrl,
        expertAdvice,
        isActive,
        risks: {
          create: risks,
        },
        actions: {
          create: actions,
        },
      },
      include: {
        risks: true,
        actions: true,
      },
    });

    res.json({
      success: true,
      message: '场景更新成功',
      data: scenario,
    });
  } catch (err) {
    console.error('Update scenario error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/scenarios/:id', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.infectionScenario.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: '场景已停用',
    });
  } catch (err) {
    console.error('Delete scenario error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/drill/submit', authMiddleware, async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const { drillId, stepsResult, score, reportText } = req.body;

  if (!stepsResult || score === undefined || score === null) {
    return res.status(400).json({ error: '缺少必填字段：演练步骤结果和评分' });
  }

  try {
    const record = await prisma.outbreakDrillRecord.create({
      data: {
        userId: user.userId,
        drillId: drillId || 1,
        stepsResult,
        score,
        reportText,
      },
    });

    res.json({
      success: true,
      message: '演练记录保存成功',
      record,
    });
  } catch (err) {
    console.error('Save drill record error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/drill/records', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const records = await prisma.outbreakDrillRecord.findMany({
      include: {
        user: {
          select: {
            realName: true,
            department: true,
            role: true,
          },
        },
        drill: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    res.json({
      success: true,
      data: records,
    });
  } catch (err) {
    console.error('Get drill records error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/drill/unparticipated', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const participatedUserIds = await prisma.outbreakDrillRecord.findMany({
      select: { userId: true },
      distinct: ['userId'],
    }).then(records => records.map(r => r.userId));

    const unparticipatedUsers = await prisma.user.findMany({
      where: {
        id: { notIn: participatedUserIds },
        role: 'DOCTOR',
      },
      select: {
        id: true,
        realName: true,
        department: true,
        role: true,
        hospitalId: true,
      },
      orderBy: { department: 'asc' },
    });

    res.json({
      success: true,
      data: unparticipatedUsers,
    });
  } catch (err) {
    console.error('Get unparticipated users error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/drill/stats', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'DOCTOR' } });
    const participatedUsers = await prisma.outbreakDrillRecord.groupBy({ by: ['userId'] }).then(groups => groups.length);
    const totalRecords = await prisma.outbreakDrillRecord.count();
    
    const avgScore = await prisma.outbreakDrillRecord.aggregate({
      _avg: { score: true },
    });

    const scoreDistribution = await prisma.outbreakDrillRecord.groupBy({
      by: ['score'],
      _count: { id: true },
      orderBy: { score: 'asc' },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        participatedUsers,
        participationRate: totalUsers > 0 ? Math.round((participatedUsers / totalUsers) * 100) : 0,
        totalRecords,
        avgScore: avgScore._avg.score ? Math.round(avgScore._avg.score) : 0,
        scoreDistribution,
      },
    });
  } catch (err) {
    console.error('Get drill stats error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/dashboard/kpi', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);

    const avgExamScore = await prisma.examRecord.aggregate({
      _avg: { score: true },
      where: {
        status: 'SUBMITTED',
        createdAt: { gte: new Date(`${currentMonth}-01`), lt: new Date(`${nextMonthStr}-01`) },
      },
    });

    const allDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });
    
    const qualifiedDoctors = await prisma.infectionRequirement.count({
      where: {
        month: currentMonth,
        accuracyRate: { gte: 70 },
        completedCount: { gte: 20 },
      },
    });

    const lockedDoctors = await prisma.user.count({
      where: { role: 'DOCTOR', isLocked: true },
    });

    const totalPractice = await prisma.learningRecord.count({
      where: {
        completedAt: { gte: new Date(`${currentMonth}-01`), lt: new Date(`${nextMonthStr}-01`) },
      },
    });

    res.json({
      success: true,
      data: {
        avgExamScore: avgExamScore._avg?.score ? Math.round(avgExamScore._avg.score) : 0,
        qualifiedRate: allDoctors > 0 ? Math.round((qualifiedDoctors / allDoctors) * 100) : 0,
        lockedCount: lockedDoctors,
        totalPractice,
      },
    });
  } catch (err) {
    console.error('Get dashboard KPI error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/dashboard/dept-ranking', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 获取科室字典（code -> 中文名称）
    const deptDict = await prisma.systemDict.findMany({
      where: { category: 'DEPARTMENT', isActive: true },
      select: { code: true, name: true },
    });
    const deptNameMap = new Map<string, string>();
    deptDict.forEach((d) => deptNameMap.set(d.code, d.name));

    const deptStats = await prisma.infectionRequirement.groupBy({
      by: ['userId'],
      where: { month: currentMonth },
      _avg: { accuracyRate: true },
    });

    const userIds = deptStats.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, department: true },
    });

    const deptMap = new Map<string, { total: number; sumRate: number }>();
    deptStats.forEach((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      if (user) {
        const deptCode = user.department || '未分配';
        // 转换为中文名称
        const deptName = deptNameMap.get(deptCode) || deptCode;
        const current = deptMap.get(deptName) || { total: 0, sumRate: 0 };
        deptMap.set(deptName, {
          total: current.total + 1,
          sumRate: current.sumRate + (stat._avg.accuracyRate ? Number(stat._avg.accuracyRate) : 0),
        });
      }
    });

    const result = Array.from(deptMap.entries())
      .map(([name, data]) => ({
        name,
        rate: data.total > 0 ? Math.round(data.sumRate / data.total) : 0,
        count: data.total,
      }))
      .sort((a, b) => b.rate - a.rate);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Get dept ranking error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/dashboard/weak-points', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);

    const tagCount = new Map<string, number>();

    // 数据源1：考试错题（answerDetail）
    const examWrongAnswers = await prisma.answerDetail.findMany({
      where: {
        isCorrect: false,
        examRecord: { createdAt: { gte: new Date(`${currentMonth}-01`), lt: new Date(`${nextMonthStr}-01`) } },
      },
      include: { question: { select: { infectionTag: true } } },
    });

    examWrongAnswers.forEach((answer) => {
      const tag = answer.question?.infectionTag;
      if (tag) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    });

    // 数据源2：每日一练错题（wrongQuestion）
    const dailyWrongQuestions = await prisma.wrongQuestion.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: { question: { select: { infectionTag: true } } },
    });

    dailyWrongQuestions.forEach((wq) => {
      const tag = wq.question?.infectionTag;
      if (tag) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + wq.wrongCount);
      }
    });

    const total = Array.from(tagCount.values()).reduce((sum, v) => sum + v, 0);
    const tagMap: Record<string, string> = {
      HAND_HYGIENE: '手卫生',
      MEDICAL_WASTE: '医疗废物',
      DISINFECTION: '消毒隔离',
      EXPOSURE: '职业暴露',
      ISOLATION: '隔离防护',
      STERILIZATION: '无菌操作',
      MDRO: '多重耐药菌',
      AIR_QUALITY: '空气质量',
    };

    const result = Array.from(tagCount.entries())
      .map(([tag, count]) => ({
        name: tagMap[tag] || tag,
        value: Math.round((count / total) * 100),
        count,
        tag,
      }))
      .sort((a, b) => b.value - a.value);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Get weak points error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/dashboard/trend', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const months = parseInt(req.query.months as string) || 6;

  try {
    // 计算所有月份的起止时间
    const monthRanges: { month: string; start: Date; end: Date }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);
      const start = new Date(`${monthStr}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      monthRanges.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        start,
        end,
      });
    }

    const allDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });

    // 批量获取所有月份的考试平均分
    const scorePromises = monthRanges.map(({ start, end }) =>
      prisma.examRecord.aggregate({
        _avg: { score: true },
        where: {
          status: 'SUBMITTED',
          createdAt: { gte: start, lt: end },
        },
      })
    );

    // 批量获取所有月份的院感达标人数
    const monthKeys = monthRanges.map(r => r.month);
    const infectionCounts = await prisma.infectionRequirement.groupBy({
      by: ['month'],
      where: {
        month: { in: monthKeys },
        accuracyRate: { gte: 70 },
        completedCount: { gte: 20 },
      },
      _count: { id: true },
    });
    const infectionCountMap = new Map(infectionCounts.map(c => [c.month, c._count.id]));

    const scoreResults = await Promise.all(scorePromises);

    const result = monthRanges.map(({ month }, i) => ({
      month,
      avgScore: scoreResults[i]._avg?.score ? Math.round(scoreResults[i]._avg.score!) : 0,
      qualifiedRate: allDoctors > 0 ? Math.round(((infectionCountMap.get(month) || 0) / allDoctors) * 100) : 0,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Get trend error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/unqualified-staff', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  try {
    // 获取科室字典
    const deptDict = await prisma.systemDict.findMany({
      where: { category: 'DEPARTMENT', isActive: true },
      select: { code: true, name: true },
    });
    const deptNameMap = new Map<string, string>();
    deptDict.forEach((d) => deptNameMap.set(d.code, d.name));

    const requirements = await prisma.infectionRequirement.findMany({
      where: {
        month: currentMonth,
        OR: [
          { accuracyRate: { lt: 70 } },
          { completedCount: { lt: 20 } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            realName: true,
            department: true,
            isLocked: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { accuracyRate: 'asc' },
    });

    const total = await prisma.infectionRequirement.count({
      where: {
        month: currentMonth,
        OR: [
          { accuracyRate: { lt: 70 } },
          { completedCount: { lt: 20 } },
        ],
      },
    });

    const result = requirements.map((r) => ({
      userId: r.userId,
      realName: r.user.realName,
      department: deptNameMap.get(r.user.department) || r.user.department || '未分配',
      completedCount: r.completedCount,
      accuracyRate: r.accuracyRate ? Number(r.accuracyRate) : 0,
      isLocked: r.user.isLocked,
    }));

    res.json({
      success: true,
      data: result,
      total,
    });
  } catch (err) {
    console.error('Get unqualified staff error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/notify/batch', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const { ids } = req.body;

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的用户ID列表' });
    }

    // 验证用户是否存在
    const users = await prisma.user.findMany({
      where: { id: { in: ids.map((id: any) => parseInt(id)) } },
      select: { id: true, realName: true },
    });

    res.json({
      success: true,
      message: `已向 ${users.length} 位用户发送补训通知`,
      notifiedUsers: users.map((u: any) => ({ id: u.id, name: u.realName })),
    });
  } catch (err) {
    console.error('Send batch notify error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/notify/:userId', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  const { userId } = req.params;

  try {
    const uid = parseInt(userId);
    if (isNaN(uid)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, realName: true },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      message: `已向用户 ${user.realName} 发送补训通知`,
    });
  } catch (err) {
    console.error('Send notify error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============================================================
// 生成院感报告 PDF
// ============================================================
router.get('/report/pdf', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 获取科室字典
    const deptDict = await prisma.systemDict.findMany({
      where: { category: 'DEPARTMENT', isActive: true },
      select: { code: true, name: true },
    });
    const deptNameMap = new Map<string, string>();
    deptDict.forEach((d) => deptNameMap.set(d.code, d.name));

    // 1. 院感达标统计
    const totalUsers = await prisma.user.count({ where: { role: 'DOCTOR' } });
    const requirements = await prisma.infectionRequirement.findMany({
      where: { month: currentMonth },
    });
    const qualifiedCount = requirements.filter(
      (r) => (r.accuracyRate ? Number(r.accuracyRate) : 0) >= 70 && r.completedCount >= 20
    ).length;
    const complianceRate = totalUsers > 0 ? Math.round((qualifiedCount / totalUsers) * 100) : 0;

    // 2. 科室排名
    const deptStats = await prisma.infectionRequirement.groupBy({
      by: ['userId'],
      where: { month: currentMonth },
      _avg: { accuracyRate: true },
    });
    const userIds = deptStats.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, department: true },
    });
    const deptMap = new Map<string, { total: number; sumRate: number }>();
    deptStats.forEach((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      if (user) {
        const deptName = deptNameMap.get(user.department) || user.department || '未分配';
        const current = deptMap.get(deptName) || { total: 0, sumRate: 0 };
        deptMap.set(deptName, {
          total: current.total + 1,
          sumRate: current.sumRate + (stat._avg.accuracyRate ? Number(stat._avg.accuracyRate) : 0),
        });
      }
    });
    const deptRanking = Array.from(deptMap.entries())
      .map(([name, data]) => ({
        name,
        rate: data.total > 0 ? Math.round(data.sumRate / data.total) : 0,
      }))
      .sort((a, b) => b.rate - a.rate);

    // 3. 未达标人员
    const unqualified = await prisma.infectionRequirement.findMany({
      where: {
        month: currentMonth,
        OR: [{ accuracyRate: { lt: 70 } }, { completedCount: { lt: 20 } }],
      },
      include: { user: { select: { realName: true, department: true } } },
      orderBy: { accuracyRate: 'asc' },
    });

    // 生成 HTML 并转 PDF
    let deptRankingHtml = '';
    deptRanking.forEach((d, i) => {
      deptRankingHtml += `<p>  ${i + 1}. ${escapeHtml(d.name)} — ${d.rate}%</p>`;
    });

    let unqualifiedHtml = '';
    if (unqualified.length === 0) {
      unqualifiedHtml = '<p>  无未达标人员</p>';
    } else {
      unqualified.slice(0, 50).forEach((u, i) => {
        const deptName = deptNameMap.get(u.user.department) || u.user.department || '未分配';
        unqualifiedHtml += `<p>  ${i + 1}. ${escapeHtml(u.user.realName)} | ${escapeHtml(deptName)} | 完成${u.completedCount}题 | 正确率${u.accuracyRate ?? 0}%</p>`;
      });
      if (unqualified.length > 50) {
        unqualifiedHtml += `<p>  ... 共 ${unqualified.length} 人，仅显示前50条</p>`;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 15mm; }
  body { font-family: 'SimHei', 'Microsoft YaHei', 'PingFang SC', sans-serif; color: #222; font-size: 13px; line-height: 1.8; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 2px; }
  h2 { font-size: 15px; border-bottom: 1px solid #333; padding-bottom: 4px; margin: 18px 0 10px; }
  .subtitle { text-align: center; font-size: 13px; color: #555; margin-bottom: 18px; }
</style>
</head>
<body>
<h1>院感培训督查报告</h1>
<p class="subtitle">报告月份：${currentMonth} | 生成时间：${new Date().toLocaleString('zh-CN')}</p>

<h2>一、总体概况</h2>
<p>  总人数：${totalUsers} 人</p>
<p>  达标人数：${qualifiedCount} 人</p>
<p>  达标率：${complianceRate}%</p>
<p>  未达标人数：${unqualified.length} 人</p>

<h2>二、各科室院感正确率排名</h2>
${deptRankingHtml}

<h2>三、未达标人员名单</h2>
${unqualifiedHtml}

<p style="margin-top:24px;border-top:1px solid #ccc;padding-top:8px;color:#999;font-size:11px;text-align:center;">本报告由院感培训系统自动生成</p>
</body>
</html>`;

    const pdfBuffer = await htmlToPdf(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="infection_report_${currentMonth}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate infection report error:', err);
    res.status(500).json({ error: '生成报告失败' });
  }
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default router;
