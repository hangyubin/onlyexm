import crypto from 'crypto';
import express from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getInfectionConfig } from '../services/configService';
import { getDictItems } from '../utils/dictCache';
import { success, error, paginate } from '../utils/response';

const router = express.Router();

const userSelect = {
  id: true,
  username: true,
  realName: true,
  role: true,
  department: true,
  phone: true,
  email: true,
  hospitalId: true,
  isLocked: true,
  createdAt: true,
  hospital: { select: { id: true, name: true } },
};

router.use(authMiddleware);

const normalizeRole = async (role: unknown): Promise<string | undefined> => {
  if (!role) return undefined;
  const r = String(role).trim().toUpperCase();
  const items = await getDictItems('ROLE');
  const hit = items.find((i) => i.code === r || i.name === r || i.name.toUpperCase() === r);
  return hit ? hit.code : r;
};

const normalizeDepartment = async (dept: unknown): Promise<string | undefined> => {
  if (dept === undefined || dept === null) return undefined;
  const s = String(dept).trim();
  if (!s) return undefined;
  const items = await getDictItems('DEPARTMENT');
  const hit = items.find((i) => i.code === s || i.name === s || i.code.toUpperCase() === s.toUpperCase());
  return hit ? hit.code : s;
};

router.get('/', roleGuard(['ADMIN', 'INFECTION_OFFICER', 'DEPARTMENT_HEAD']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const keyword = req.query.keyword as string;
    const role = req.query.role as string;
    const hospitalId = req.query.hospitalId as string;
    const department = req.query.department as string;

    const skip = (page - 1) * pageSize;

    const where: any = {};
    const searchText = keyword || search;
    if (searchText) {
      where.OR = [
        { realName: { contains: searchText } },
        { username: { contains: searchText } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (hospitalId) {
      where.hospitalId = parseInt(hospitalId);
    }
    if (department) {
      where.department = department;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const transformedUsers = users.map(user => ({
      ...user,
      hospitalName: user.hospital?.name || '',
    }));

    paginate(res, transformedUsers, total, page, pageSize);
  } catch (err) {
    console.error('获取用户列表失败:', err);
    error(res, 500, '获取用户列表失败');
  }
});

// 批量导入用户接口
const upload = multer({ storage: multer.memoryStorage() });

// 下载用户导入模板
router.get('/import-template', async (_req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('用户导入模板');

    // 表头
    worksheet.columns = [
      { header: '用户名', key: 'username', width: 15 },
      { header: '姓名', key: 'realName', width: 15 },
      { header: '密码', key: 'password', width: 15 },
      { header: '角色', key: 'role', width: 15 },
      { header: '科室', key: 'department', width: 15 },
    ];

    // 表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    };

    // 动态获取角色和科室选项
    const [roles, departments] = await Promise.all([
      getDictItems('ROLE'),
      getDictItems('DEPARTMENT'),
    ]);

    // 示例数据
    worksheet.addRow({
      username: 'zhangsan',
      realName: '张三',
      password: '123456',
      role: roles[0]?.code || 'DOCTOR',
      department: departments[0]?.code || '',
    });

    // 添加说明 sheet
    const noteSheet = workbook.addWorksheet('填写说明');
    noteSheet.columns = [
      { header: '字段', key: 'field', width: 15 },
      { header: '说明', key: 'desc', width: 50 },
    ];
    noteSheet.getRow(1).font = { bold: true };
    noteSheet.addRow({ field: '用户名', desc: '必填，登录账号，不可重复' });
    noteSheet.addRow({ field: '姓名', desc: '必填，真实姓名' });
    noteSheet.addRow({ field: '密码', desc: '选填，不填则自动生成随机密码' });
    noteSheet.addRow({ field: '角色', desc: `选填，可选值：${roles.map(r => `${r.name}(${r.code})`).join('、')}，默认 DOCTOR` });
    noteSheet.addRow({ field: '科室', desc: `选填，可选值：${departments.map(d => `${d.name}(${d.code})`).join('、')}` });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=user-import-template.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('生成用户导入模板失败:', err);
    res.status(500).json({ error: '生成模板失败' });
  }
});

router.post('/batch-import', roleGuard(['ADMIN', 'INFECTION_OFFICER']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 400, '请上传 Excel 文件');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return error(res, 400, 'Excel 文件中没有工作表');
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const username = String(row.getCell(1).value || '').trim();
      const realName = String(row.getCell(2).value || '').trim();
      const password = String(row.getCell(3).value || '').trim() || crypto.randomBytes(4).toString('hex');
      const role = String(row.getCell(4).value || '').trim() || 'DOCTOR';
      const department = String(row.getCell(5).value || '').trim();

      if (!username || !realName) {
        results.failed++;
        results.errors.push(`第 ${rowNumber} 行: 用户名或姓名为空`);
        continue;
      }

      try {
        const existingUser = await prisma.user.findFirst({ where: { username } });
        if (existingUser) {
          results.failed++;
          results.errors.push(`第 ${rowNumber} 行: 用户名 ${username} 已存在`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [nRole, nDept] = await Promise.all([
          normalizeRole(role),
          normalizeDepartment(department),
        ]);

        const userData: any = {
          username,
          password: hashedPassword,
          realName,
          role: nRole || 'DOCTOR',
          department: nDept || '未分配',
        };

        await prisma.user.create({ data: userData });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push(`第 ${rowNumber} 行: 创建失败 - ${(e as Error).message}`);
      }
    }

    success(res, results, `导入完成: 成功 ${results.success} 条, 失败 ${results.failed} 条`);
  } catch (err) {
    console.error('批量导入用户失败:', err);
    error(res, 500, '批量导入用户失败');
  }
});

router.get('/:id', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        department: true,
        hospitalId: true,
        isLocked: true,
        createdAt: true,
        hospital: true,
      },
    });

    if (!user) {
      return error(res, 404, '用户不存在');
    }

    success(res, user);
  } catch (err) {
    console.error('获取用户详情失败:', err);
    error(res, 500, '获取用户详情失败');
  }
});

router.post('/', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const { username, password, realName, role, hospitalId, department } = req.body;

    if (!username || !password || !realName || !role) {
      return error(res, 400, '缺少必填字段');
    }

    const existingUser = await prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      return error(res, 400, '用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [nRole, nDept] = await Promise.all([
      normalizeRole(role),
      normalizeDepartment(department),
    ]);

    const userData: any = {
      username,
      password: hashedPassword,
      realName,
      role: nRole || 'DOCTOR',
      department: nDept || '未分配',
      hospitalId: hospitalId || null,
    };

    const user = await prisma.user.create({
      data: userData,
      include: {
        hospital: true,
      },
    });

    // 同步创建 InfectionRequirement（如果需要）
    try {
      const existingReq = await prisma.infectionRequirement.findFirst({
        where: { userId: user.id, month: new Date().toISOString().slice(0, 7) },
      });
      if (!existingReq) {
        const config = await getInfectionConfig();
        await prisma.infectionRequirement.create({
          data: {
            userId: user.id,
            month: new Date().toISOString().slice(0, 7),
            requiredCount: config.monthlyRequiredCount,
            completedCount: 0,
            accuracyRate: 0 as any,
            isLocked: false,
          },
        });
      }
    } catch (_e) {
      // 即使创建失败也不应影响用户创建流程
    }

    success(res, user);
  } catch (err) {
    console.error('创建用户失败:', err);
    error(res, 500, '创建用户失败');
  }
});

router.put('/:id', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, realName, role, department, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return error(res, 404, '用户不存在');
    }

    const updateData: Record<string, any> = {};

    if (username !== undefined && username !== null && String(username).trim()) {
      updateData.username = String(username);
    }
    if (realName !== undefined && realName !== null && String(realName).trim()) {
      updateData.realName = String(realName);
    }
    const [nRole, nDept] = await Promise.all([
      normalizeRole(role),
      normalizeDepartment(department),
    ]);
    if (nRole !== undefined) updateData.role = nRole;
    if (nDept !== undefined) updateData.department = nDept;

    if (password && String(password).trim()) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return success(res, existingUser);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        hospital: true,
      },
    });

    success(res, user);
  } catch (err) {
    console.error('更新用户失败:', err);
    error(res, 500, '更新用户失败');
  }
});

router.delete('/:id', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return error(res, 404, '用户不存在');
    }

    await prisma.user.delete({
      where: { id },
    });

    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除用户失败:', err);
    error(res, 500, '删除用户失败');
  }
});

router.post('/:id/reset-password', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return error(res, 404, '用户不存在');
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    success(res, { tempPassword, mustChangePassword: true }, '密码重置成功，请通知用户尽快登录修改密码');
  } catch (err) {
    console.error('重置密码失败:', err);
    error(res, 500, '重置密码失败');
  }
});

router.patch('/:id/toggle-lock', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (id === (req as any).user.id) {
      return error(res, 400, '不能锁定/解锁自己的账户');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return error(res, 404, '用户不存在');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isLocked: !existingUser.isLocked },
      include: {
        hospital: true,
      },
    });

    success(res, user);
  } catch (err) {
    console.error('切换锁定状态失败:', err);
    error(res, 500, '切换锁定状态失败');
  }
});

// 学习档案接口
router.get('/:id/learning-profile', roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    // 考试记录统计
    const examRecords = await prisma.examRecord.findMany({
      where: { userId, status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] } },
      select: {
        id: true,
        paperId: true,
        score: true,
        isPassed: true,
        infectionScore: true,
        startTime: true,
        endTime: true,
        paper: { select: { name: true, passingScore: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const totalExams = examRecords.length;
    const passedExams = examRecords.filter((r) => r.isPassed).length;
    const avgScore = totalExams > 0
      ? Math.round(examRecords.reduce((sum, r) => sum + (r.score || 0), 0) / totalExams * 10) / 10
      : 0;

    // 院感达标情况
    const currentMonth = new Date().toISOString().slice(0, 7);
    const infectionRequirements = await prisma.infectionRequirement.findMany({
      where: { userId },
      orderBy: { month: 'desc' },
      take: 6,
    });
    const currentMonthReq = infectionRequirements.find((r) => r.month === currentMonth);

    // 每日练习统计
    const dailyPractices = await prisma.dailyPractice.findMany({
      where: { userId },
      select: { id: true, date: true, score: true, isCompleted: true },
      orderBy: { date: 'desc' },
      take: 30,
    });
    const totalPractices = dailyPractices.length;
    const completedPractices = dailyPractices.filter((p) => p.isCompleted).length;

    // 学习记录统计
    const learningRecords = await prisma.learningRecord.findMany({
      where: { userId },
      select: { id: true, contentTitle: true, studyDurationSeconds: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
    const totalStudySeconds = learningRecords.reduce((sum, r) => sum + r.studyDurationSeconds, 0);

    // 错题统计
    const wrongQuestionCount = await prisma.wrongQuestion.count({
      where: { userId, status: 'ACTIVE' },
    });

    success(res, {
      user: {
        id: user.id,
        realName: user.realName,
        username: user.username,
        role: user.role,
        department: user.department,
        hospital: user.hospital?.name || '',
      },
      examStats: {
        totalExams,
        passedExams,
        passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 1000) / 10 : 0,
        avgScore,
        recentExams: examRecords.slice(0, 10).map((r) => ({
          id: r.id,
          paperName: r.paper?.name || '已删除试卷',
          score: r.score,
          isPassed: r.isPassed,
          infectionScore: r.infectionScore,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      },
      infectionCompliance: {
        currentMonth: currentMonthReq
          ? {
              month: currentMonthReq.month,
              requiredCount: currentMonthReq.requiredCount,
              completedCount: currentMonthReq.completedCount,
              accuracyRate: Number(currentMonthReq.accuracyRate || 0),
              isCompliant: currentMonthReq.completedCount >= currentMonthReq.requiredCount
                && Number(currentMonthReq.accuracyRate || 0) >= 70,
            }
          : null,
        history: infectionRequirements.map((r) => ({
          month: r.month,
          requiredCount: r.requiredCount,
          completedCount: r.completedCount,
          accuracyRate: Number(r.accuracyRate || 0),
        })),
      },
      practiceStats: {
        totalPractices,
        completedPractices,
        recentPractices: dailyPractices.slice(0, 10),
      },
      learningStats: {
        totalStudySeconds,
        totalStudyHours: Math.round(totalStudySeconds / 36) / 100,
        recentRecords: learningRecords,
      },
      wrongQuestionCount,
    });
  } catch (err) {
    console.error('获取学习档案失败:', err);
    error(res, 500, '获取学习档案失败');
  }
});

export default router;
