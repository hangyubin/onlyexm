import ExcelJS from 'exceljs';
import prisma from '../lib/prisma';

// 获取科室字典映射 (code -> 中文名称)
async function getDeptNameMap(): Promise<Map<string, string>> {
  const deptDict = await prisma.systemDict.findMany({
    where: { category: 'DEPARTMENT', isActive: true },
    select: { code: true, name: true },
  });
  const map = new Map<string, string>();
  deptDict.forEach(d => map.set(d.code, d.name));
  return map;
}

// 将日期字符串转换为当天的结束时间（23:59:59.999），避免 endDate 当天数据被遗漏
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function generateExamSummaryReport(startDate: string, endDate: string): Promise<Buffer | ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('考试成绩汇总');

  worksheet.columns = [
    { header: '姓名', key: 'realName', width: 15 },
    { header: '科室', key: 'department', width: 15 },
    { header: '考试名称', key: 'paperName', width: 25 },
    { header: '得分', key: 'score', width: 10 },
    { header: '院感得分', key: 'infectionScore', width: 12 },
    { header: '是否及格', key: 'isPassed', width: 12 },
    { header: '考试时长(秒)', key: 'duration', width: 15 },
    { header: '切屏次数', key: 'tabSwitchCount', width: 12 },
  ];

  const [examRecords, deptNameMap] = await Promise.all([
    prisma.examRecord.findMany({
      where: {
        status: 'SUBMITTED',
        createdAt: {
          gte: new Date(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: {
        user: true,
        paper: true,
      },
    }),
    getDeptNameMap(),
  ]);

  examRecords.forEach(record => {
    worksheet.addRow({
      realName: record.user.realName,
      department: deptNameMap.get(record.user.department) || record.user.department || '未分配',
      paperName: record.paper?.name || '已删除试卷',
      score: record.score || 0,
      infectionScore: record.infectionScore || 0,
      isPassed: (record.score || 0) >= (record.paper?.passingScore ?? 60) ? '是' : '否',
      duration: record.durationSeconds || 0,
      tabSwitchCount: record.tabSwitchCount,
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.autoFilter = 'A1:H1';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generateUnqualifiedStaffReport(): Promise<Buffer | ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('院感未达标人员');

  worksheet.columns = [
    { header: '姓名', key: 'realName', width: 15 },
    { header: '科室', key: 'department', width: 15 },
    { header: '本月练习数', key: 'completedCount', width: 15 },
    { header: '正确率(%)', key: 'accuracyRate', width: 15 },
    { header: '锁定状态', key: 'isLocked', width: 12 },
    { header: '建议补训内容', key: 'suggestion', width: 30 },
  ];

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [unqualifiedUsers, deptNameMap] = await Promise.all([
    prisma.infectionRequirement.findMany({
      where: {
        month: currentMonth,
        OR: [
          { completedCount: { lt: 20 } },
          { accuracyRate: { lt: 70 } },
        ],
      },
      include: { user: true },
    }),
    getDeptNameMap(),
  ]);

  unqualifiedUsers.forEach(req => {
    const needsPractice = req.completedCount < 20;
    const needsAccuracy = Number(req.accuracyRate || 0) < 70;
    
    let suggestion = '';
    if (needsPractice && needsAccuracy) {
      suggestion = '需增加院感练习量并提高正确率';
    } else if (needsPractice) {
      suggestion = '需增加院感练习量';
    } else if (needsAccuracy) {
      suggestion = '需提高练习正确率，建议复习错题';
    }

    worksheet.addRow({
      realName: req.user.realName,
      department: deptNameMap.get(req.user.department) || req.user.department || '未分配',
      completedCount: req.completedCount,
      accuracyRate: Math.round(Number(req.accuracyRate || 0)),
      isLocked: req.user.isLocked ? '已锁定' : '正常',
      suggestion,
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.autoFilter = 'A1:F1';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generateDeptRankingReport(startDate: string, endDate: string): Promise<Buffer | ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('科室排名');

  worksheet.columns = [
    { header: '排名', key: 'rank', width: 10 },
    { header: '科室', key: 'department', width: 15 },
    { header: '参考人数', key: 'participants', width: 12 },
    { header: '平均分', key: 'avgScore', width: 12 },
    { header: '及格率(%)', key: 'passRate', width: 15 },
    { header: '院感平均分', key: 'avgInfectionScore', width: 18 },
  ];

  const [examRecords, deptNameMap] = await Promise.all([
    prisma.examRecord.findMany({
      where: {
        status: 'SUBMITTED',
        createdAt: {
          gte: new Date(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: { user: true, paper: { select: { passingScore: true } } },
    }),
    getDeptNameMap(),
  ]);

  const deptStats: Record<string, { totalScore: number; totalInfectionScore: number; count: number; passed: number }> = {};

  examRecords.forEach(record => {
    const dept = record.user.department;
    if (!deptStats[dept]) {
      deptStats[dept] = { totalScore: 0, totalInfectionScore: 0, count: 0, passed: 0 };
    }
    deptStats[dept].totalScore += record.score || 0;
    deptStats[dept].totalInfectionScore += record.infectionScore || 0;
    deptStats[dept].count++;
    if ((record.score || 0) >= (record.paper?.passingScore ?? 60)) {
      deptStats[dept].passed++;
    }
  });

  const sortedDepts = Object.entries(deptStats)
    .map(([dept, stats]) => ({
      department: deptNameMap.get(dept) || dept || '未分配',
      participants: stats.count,
      avgScore: Math.round(stats.totalScore / stats.count * 10) / 10,
      passRate: Math.round((stats.passed / stats.count) * 100),
      avgInfectionScore: Math.round(stats.totalInfectionScore / stats.count * 10) / 10,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  sortedDepts.forEach((dept, index) => {
    worksheet.addRow({
      rank: index + 1,
      ...dept,
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.autoFilter = 'A1:F1';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generateQuestionErrorRateReport(): Promise<Buffer | ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('题目错误率分析');

  worksheet.columns = [
    { header: '题目ID', key: 'questionId', width: 12 },
    { header: '题目内容', key: 'content', width: 40 },
    { header: '题型', key: 'type', width: 12 },
    { header: '院感标签', key: 'infectionTag', width: 15 },
    { header: '错误率(%)', key: 'errorRate', width: 15 },
    { header: '错误人数', key: 'wrongCount', width: 12 },
  ];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const answerDetails = await prisma.answerDetail.findMany({
    where: {
      examRecord: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
      },
    },
    include: { question: true },
  });

  const questionStats: Record<
    number,
    { total: number; wrong: number; content: string; type: string; infectionTag: string | null }
  > = {};

  answerDetails.forEach(answer => {
    const qId = answer.questionId;
    if (!questionStats[qId]) {
      questionStats[qId] = {
        total: 0,
        wrong: 0,
        content: answer.question.content.substring(0, 50) + (answer.question.content.length > 50 ? '...' : ''),
        type: answer.question.type,
        infectionTag: answer.question.infectionTag || '',
      };
    }
    questionStats[qId].total++;
    if (!answer.isCorrect) {
      questionStats[qId].wrong++;
    }
  });

  const sortedQuestions = Object.entries(questionStats)
    .map(([id, stats]) => ({
      questionId: parseInt(id),
      content: stats.content,
      type: stats.type,
      infectionTag: stats.infectionTag || '无',
      errorRate: Math.round((stats.wrong / stats.total) * 100),
      wrongCount: stats.wrong,
    }))
    .sort((a, b) => b.errorRate - a.errorRate);

  sortedQuestions.forEach(question => {
    worksheet.addRow(question);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.autoFilter = 'A1:F1';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generateActivityReport(startDate: string, endDate: string): Promise<Buffer | ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('学习活跃度统计');

  worksheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '活跃人数', key: 'activeUsers', width: 12 },
    { header: '完成练习人数', key: 'practiceUsers', width: 15 },
    { header: '完成考试人数', key: 'examUsers', width: 15 },
    { header: '平均学习时长(分钟)', key: 'avgStudyDuration', width: 20 },
  ];

  const start = new Date(startDate);
  const end = endOfDay(endDate);

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  const learningRecords = await prisma.learningRecord.findMany({
    where: {
      completedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  const examRecords = await prisma.examRecord.findMany({
    where: {
      status: 'SUBMITTED',
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  const practiceRecords = await prisma.practiceSyncRecord.findMany({
    where: {
      syncTime: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });

  const dateActivity: Record<string, { activeUsers: Set<number>; practiceUsers: Set<number>; examUsers: Set<number>; totalDuration: number; durationCount: number }> = {};

  dates.forEach(date => {
    dateActivity[date] = {
      activeUsers: new Set(),
      practiceUsers: new Set(),
      examUsers: new Set(),
      totalDuration: 0,
      durationCount: 0,
    };
  });

  learningRecords.forEach(record => {
    const date = record.completedAt.toISOString().split('T')[0];
    if (dateActivity[date]) {
      dateActivity[date].activeUsers.add(record.userId);
      dateActivity[date].totalDuration += record.studyDurationSeconds;
      dateActivity[date].durationCount++;
    }
  });

  practiceRecords.forEach(record => {
    const date = record.syncTime.toISOString().split('T')[0];
    if (dateActivity[date]) {
      dateActivity[date].activeUsers.add(record.userId);
      dateActivity[date].practiceUsers.add(record.userId);
    }
  });

  examRecords.forEach(record => {
    const date = record.createdAt.toISOString().split('T')[0];
    if (dateActivity[date]) {
      dateActivity[date].activeUsers.add(record.userId);
      dateActivity[date].examUsers.add(record.userId);
    }
  });

  dates.forEach(date => {
    const activity = dateActivity[date];
    worksheet.addRow({
      date,
      activeUsers: activity.activeUsers.size,
      practiceUsers: activity.practiceUsers.size,
      examUsers: activity.examUsers.size,
      avgStudyDuration: activity.durationCount > 0 
        ? Math.round((activity.totalDuration / activity.durationCount) / 60 * 10) / 10 
        : 0,
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.autoFilter = 'A1:E1';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}