import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { generatePaper, GeneratePaperInput } from '../services/paperService';
import { htmlToPdf } from '../utils/pdf';

const router = express.Router();

function mapPaperItem(item: any) {
  return {
    id: item.id,
    title: item.name,
    description: item.description || '',
    totalScore: item.totalScore,
    passScore: item.passingScore,
    duration: item.durationMinutes,
    durationMinutes: item.durationMinutes,
    examStartTime: item.examStartTime ? new Date(item.examStartTime).toISOString() : null,
    examEndTime: item.examEndTime ? new Date(item.examEndTime).toISOString() : null,
    departments: [] as string[],
    status: item.isActive ? 'ACTIVE' : 'INACTIVE',
    isActive: item.isActive,
    isPublished: item.isPublished || false,
    questions: [] as any[],
    questionCount: item._count?.paperQuestions ?? 0,
    createdAt: item.createdAt,
  };
}

function mapPaperDetail(paper: any) {
  return {
    id: paper.id,
    title: paper.name,
    description: paper.description || '',
    totalScore: paper.totalScore,
    passScore: paper.passingScore,
    duration: paper.durationMinutes,
    durationMinutes: paper.durationMinutes,
    examStartTime: paper.examStartTime ? new Date(paper.examStartTime).toISOString() : null,
    examEndTime: paper.examEndTime ? new Date(paper.examEndTime).toISOString() : null,
    departments: [] as string[],
    status: paper.isActive ? 'ACTIVE' : 'INACTIVE',
    isActive: paper.isActive,
    isPublished: paper.isPublished || false,
    questions: (paper.paperQuestions || []).map((pq: any) => ({
      questionId: pq.questionId,
      content: pq.question.content,
      type: pq.question.type,
      score: pq.score,
    })),
    questionCount: (paper.paperQuestions || []).length,
    createdAt: paper.createdAt,
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const keyword = (req.query.keyword as string)?.trim() || '';
    const isActive = req.query.isActive as string;
    const userId = req.user?.userId;

    const where: any = {};
    if (keyword) {
      where.name = { contains: keyword };
    }
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // 非管理员角色只能查看已发布的试卷
    if (req.user?.role && !['ADMIN', 'INFECTION_OFFICER'].includes(req.user.role)) {
      where.isPublished = true;
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      prisma.paper.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          totalScore: true,
          passingScore: true,
          durationMinutes: true,
          examStartTime: true,
          examEndTime: true,
          isActive: true,
          isPublished: true,
          createdAt: true,
          _count: { select: { paperQuestions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.paper.count({ where }),
    ]);

    // 查询当前用户对每份试卷的考试记录
    let userExamMap = new Map<number, { status: string; examRecordId: number }>();
    if (userId) {
      const paperIds = items.map((item) => item.id);
      const examRecords = await prisma.examRecord.findMany({
        where: {
          userId,
          paperId: { in: paperIds },
        },
        select: { id: true, paperId: true, status: true },
        orderBy: { createdAt: 'desc' },
      });
      for (const record of examRecords) {
        const existing = userExamMap.get(record.paperId);
        if (!existing || existing.status === 'IN_PROGRESS') {
          userExamMap.set(record.paperId, { status: record.status, examRecordId: record.id });
        }
      }
    }

    res.json({
      data: items.map((item) => ({
        ...mapPaperItem(item),
        userExamStatus: userExamMap.get(item.id)?.status || null,
        userExamRecordId: userExamMap.get(item.id)?.examRecordId || null,
      })),
      total,
    });
  } catch (err) {
    console.error('Get paper list error:', err);
    res.status(500).json({ error: '获取试卷列表失败' });
  }
});

router.post('/', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const { title, description, duration, passScore, totalScore, questions, status, examStartTime, examEndTime } = req.body;

    if (!title) {
      return res.status(400).json({ error: '试卷名称不能为空' });
    }

    const startTime = examStartTime ? new Date(examStartTime) : null;
    const endTime = examEndTime ? new Date(examEndTime) : null;
    if (startTime && endTime && endTime <= startTime) {
      return res.status(400).json({ error: '考试结束时间必须晚于开始时间' });
    }

    const paper = await prisma.$transaction(async (tx) => {
      const paper = await tx.paper.create({
        data: {
          name: title,
          description: description || null,
          totalScore: totalScore || 0,
          passingScore: passScore || 60,
          durationMinutes: duration || 60,
          examStartTime: startTime,
          examEndTime: endTime,
          isActive: false, // 创建时默认未发布
          isPublished: false,
        },
      });

      if (questions && questions.length > 0) {
        await Promise.all(
          questions.map((q: { questionId: number; score: number }) =>
            tx.paperQuestion.create({
              data: {
                paperId: paper.id,
                questionId: q.questionId,
                score: q.score,
              },
            })
          )
        );
      }

      return paper;
    });

    const fullPaper = await prisma.paper.findUnique({
      where: { id: paper.id },
      include: {
        paperQuestions: {
          include: {
            question: {
              select: {
                id: true,
                content: true,
                type: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    res.json(mapPaperDetail(fullPaper));
  } catch (err) {
    console.error('Create paper error:', err);
    res.status(500).json({ error: '创建试卷失败' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的试卷ID' });
    }

    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        paperQuestions: {
          include: {
            question: {
              include: {
                options: {
                  select: { id: true, optionKey: true, content: true, isCorrect: true },
                },
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!paper) {
      return res.status(404).json({ error: '试卷不存在' });
    }

    res.json(mapPaperDetail(paper));
  } catch (err) {
    console.error('Get paper detail error:', err);
    res.status(500).json({ error: '获取试卷详情失败' });
  }
});

router.put('/:id', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的试卷ID' });
    }

    const existing = await prisma.paper.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '试卷不存在' });
    }

    const { title, description, totalScore, passScore, duration, questions, examStartTime, examEndTime } = req.body;

    // 已发布的试卷不允许修改任何信息（包括考试时间）
    if (existing.isPublished) {
      return res.status(400).json({ error: '已发布的试卷不允许修改，请先取消发布' });
    }

    const paper = await prisma.$transaction(async (tx) => {
      const data: any = {};
      if (title !== undefined) data.name = title;
      if (description !== undefined) data.description = description;
      if (totalScore !== undefined) data.totalScore = totalScore;
      if (passScore !== undefined) data.passingScore = passScore;
      if (duration !== undefined) data.durationMinutes = duration;
      if (examStartTime !== undefined) data.examStartTime = examStartTime ? new Date(examStartTime) : null;
      if (examEndTime !== undefined) data.examEndTime = examEndTime ? new Date(examEndTime) : null;

      const updated = await tx.paper.update({
        where: { id },
        data,
      });

      if (questions !== undefined) {
        await tx.paperQuestion.deleteMany({ where: { paperId: id } });

        if (questions && questions.length > 0) {
          await Promise.all(
            questions.map((q: { questionId: number; score: number }) =>
              tx.paperQuestion.create({
                data: {
                  paperId: id,
                  questionId: q.questionId,
                  score: q.score,
                },
              })
            )
          );
        }
      }

      return updated;
    });

    const fullPaper = await prisma.paper.findUnique({
      where: { id },
      include: {
        paperQuestions: {
          include: {
            question: {
              select: {
                id: true,
                content: true,
                type: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    res.json(mapPaperDetail(fullPaper));
  } catch (err) {
    console.error('Update paper error:', err);
    res.status(500).json({ error: '更新试卷失败' });
  }
});

router.delete('/:id', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的试卷ID' });
    }

    const existing = await prisma.paper.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '试卷不存在' });
    }

    // 检查是否有正在进行的考试
    const inProgressCount = await prisma.examRecord.count({
      where: { paperId: id, status: 'IN_PROGRESS' },
    });
    if (inProgressCount > 0) {
      return res.status(400).json({ error: `有${inProgressCount}人正在考试中，无法删除` });
    }

    // 允许删除已结束考试的试卷（连同考试记录一起删除）
    await prisma.$transaction(async (tx) => {
      // 先删除考试相关的答案详情
      const examRecordIds = await tx.examRecord.findMany({
        where: { paperId: id },
        select: { id: true },
      });
      if (examRecordIds.length > 0) {
        await tx.answerDetail.deleteMany({
          where: { examRecordId: { in: examRecordIds.map(r => r.id) } },
        });
        // 删除考试记录
        await tx.examRecord.deleteMany({ where: { paperId: id } });
      }
      // 删除试卷生成日志
      await tx.paperGenerationLog.deleteMany({ where: { paperId: id } });
      // 删除试卷题目关联
      await tx.paperQuestion.deleteMany({ where: { paperId: id } });
      // 删除试卷
      await tx.paper.delete({ where: { id } });
    });

    res.json({ success: true, message: '试卷已删除' });
  } catch (err) {
    console.error('Delete paper error:', err);
    res.status(500).json({ error: '删除试卷失败' });
  }
});

router.patch('/:id/publish', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的试卷ID' });
    }

    const existing = await prisma.paper.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: '试卷不存在' });
    }

    const action = req.body.action; // 'publish' or 'unpublish'

    if (action === 'unpublish') {
      // 取消发布
      if (!existing.isActive) {
        return res.status(400).json({ error: '试卷尚未发布' });
      }
      // 检查是否有正在进行的考试
      const inProgressCount = await prisma.examRecord.count({
        where: { paperId: id, status: 'IN_PROGRESS' },
      });
      if (inProgressCount > 0) {
        return res.status(400).json({ error: `有${inProgressCount}人正在考试中，无法取消发布` });
      }

      const paper = await prisma.paper.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        isActive: paper.isActive,
        isPublished: paper.isPublished,
        status: 'INACTIVE',
        message: '试卷已取消发布',
      });
    } else {
      // 发布
      if (existing.isPublished && existing.isActive) {
        return res.status(400).json({ error: '该试卷已发布' });
      }

      // 检查考试时间
      if (!existing.examStartTime || !existing.examEndTime) {
        return res.status(400).json({ error: '请先设置考试时间再发布' });
      }

      // 检查是否有题目
      const questionCount = await prisma.paperQuestion.count({ where: { paperId: id } });
      if (questionCount === 0) {
        return res.status(400).json({ error: '试卷没有题目，无法发布' });
      }

      const paper = await prisma.paper.update({
        where: { id },
        data: {
          isActive: true,
          isPublished: true,
        },
      });

      res.json({
        success: true,
        isActive: paper.isActive,
        isPublished: paper.isPublished,
        status: 'ACTIVE',
        message: '试卷已发布',
      });
    }
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: '发布操作失败' });
  }
});

router.post(
  '/generate',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const body = req.body;
      const categoryCounts = body.categoryCounts || {};
      const typeCounts = body.typeCounts || {};
      const typeScores = body.typeScores || {};

      // 动态构建分类配置：categoryCounts 是 { [categoryCode]: count } 格式
      const categoryConfigs: { categoryCode: string; count: number }[] = Object.entries(categoryCounts)
        .map(([code, count]) => ({ categoryCode: code, count: Number(count) || 0 }))
        .filter(c => c.count > 0);

        const typeConfigs: { typeCode: string; count: number; score: number }[] = [
          { typeCode: 'SINGLE', count: typeCounts.single || 0, score: typeScores.single || 2 },
          { typeCode: 'MULTIPLE', count: typeCounts.multiple || 0, score: typeScores.multiple || 3 },
          { typeCode: 'JUDGE', count: typeCounts.judge || 0, score: typeScores.judge || 2 },
          { typeCode: 'CASE', count: typeCounts.case || 0, score: typeScores.case || 5 },
        ].filter(t => t.count > 0);

        const input: GeneratePaperInput = {
          name: body.title || body.name,
          department: body.departments?.[0],
          categoryConfigs,
          typeConfigs,
          difficultyRatio: body.difficultyRatio || '5:3:2',
          durationMinutes: body.duration || 60,
          passingScore: body.passScore || 60,
        };

      if (!input.name) {
        return res.status(400).json({ error: '试卷名称不能为空' });
      }

      if (!input.difficultyRatio.match(/^\d+:\d+:\d+$/)) {
        return res.status(400).json({ error: '难度比例格式错误，应为 5:3:2 格式' });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const result = await generatePaper(input, userId);

      if (result.success) {
        const fullPaper = await prisma.paper.findUnique({
          where: { id: result.paperId },
          include: {
            paperQuestions: {
              include: {
                question: {
                  select: {
                    id: true,
                    content: true,
                    type: true,
                  },
                },
              },
              orderBy: { id: 'asc' },
            },
          },
        });

        res.json(mapPaperDetail(fullPaper));
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (err) {
      console.error('Generate paper error:', err);
      res.status(500).json({
        success: false,
        message: '组卷失败，服务器内部错误',
      });
    }
  }
);

// ============================================================
// 打印空白试卷 (PDF)
// ============================================================
router.get('/:id/print', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的试卷ID' });
    }

    const paper = await prisma.paper.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        totalScore: true,
        passingScore: true,
        durationMinutes: true,
        paperQuestions: {
          orderBy: { id: 'asc' },
          select: {
            score: true,
            question: {
              select: {
                id: true,
                content: true,
                type: true,
                options: {
                  orderBy: { optionKey: 'asc' },
                  select: {
                    optionKey: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!paper) {
      return res.status(404).json({ error: '试卷不存在' });
    }

    // 获取题型字典
    const typeDict = await prisma.systemDict.findMany({
      where: { category: 'QUESTION_TYPE', isActive: true },
      select: { code: true, name: true },
    });
    const typeNameMap = new Map<string, string>();
    typeDict.forEach(d => typeNameMap.set(d.code, d.name));

    // 按题型分组
    const typeOrder = ['SINGLE', 'MULTIPLE', 'JUDGE', 'CASE'];
    const typeNames: Record<string, string> = {
      'SINGLE': '单项选择题',
      'MULTIPLE': '多项选择题',
      'JUDGE': '是非判断题',
      'CASE': '案例分析题',
    };

    // 分组统计
    const groupedQuestions = new Map<string, { questions: any[]; totalScore: number; scorePerQuestion: number }>();
    for (const pq of paper.paperQuestions) {
      const type = pq.question.type;
      if (!groupedQuestions.has(type)) {
        groupedQuestions.set(type, { questions: [], totalScore: 0, scorePerQuestion: pq.score });
      }
      const group = groupedQuestions.get(type)!;
      group.questions.push(pq);
      group.totalScore += pq.score;
    }

    // 构建 HTML
    const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八'];
    let typeIndex = 0;
    let globalQuestionNumber = 1;
    let bodyHtml = '';

    for (const type of typeOrder) {
      const group = groupedQuestions.get(type);
      if (!group || group.questions.length === 0) continue;

      const typeName = typeNames[type] || typeNameMap.get(type) || type;
      const count = group.questions.length;
      const totalScore = group.totalScore;

      bodyHtml += `<h3 style="font-size:15px;margin:18px 0 8px;font-weight:bold;">${chineseNumbers[typeIndex]}、${typeName}（共${count}题，共${totalScore}分）</h3>`;

      for (const pq of group.questions) {
        const question = pq.question;
        const hasOptions = question.options && question.options.length > 0;
        const answerArea = hasOptions || type === 'JUDGE' ? '（&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;）' : '';

        bodyHtml += `<div style="margin-bottom:14px;line-height:1.8;">
          <p style="font-size:14px;margin:0 0 6px;"><b>${globalQuestionNumber}.</b> ${escapeHtml(question.content)}${answerArea}</p>`;
        globalQuestionNumber++;

        if (hasOptions && type !== 'JUDGE') {
          bodyHtml += '<div style="padding-left:24px;font-size:14px;">';
          const options = question.options;
          for (let i = 0; i < options.length; i += 2) {
            const opt1 = options[i];
            const opt2 = options[i + 1];
            bodyHtml += `<div style="display:flex;gap:60px;margin-bottom:3px;">`;
            bodyHtml += `<span>${opt1.optionKey}. ${escapeHtml(opt1.content)}</span>`;
            if (opt2) bodyHtml += `<span>${opt2.optionKey}. ${escapeHtml(opt2.content)}</span>`;
            bodyHtml += `</div>`;
          }
          bodyHtml += '</div>';
        } else if (type === 'CASE') {
          for (let i = 0; i < 8; i++) {
            bodyHtml += '<p style="color:#999;">&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;&lowbar;</p>';
          }
        }

        bodyHtml += '</div>';
      }

      typeIndex++;
    }

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 15mm; }
  body { font-family: 'SimHei', 'Microsoft YaHei', 'PingFang SC', sans-serif; color: #222; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 14px; color: #555; margin-bottom: 16px; }
  .info { font-size: 14px; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>${escapeHtml(paper.name)}</h1>
<p class="subtitle">考试时长：${paper.durationMinutes}分钟 &emsp; 满分：${paper.totalScore}分 &emsp; 及格线：${paper.passingScore}分</p>
<p class="info">姓名：________________&emsp;&emsp;科室：________________&emsp;&emsp;得分：________</p>
${bodyHtml}
</body>
</html>`;

    const pdfBuffer = await htmlToPdf(html);
    const filename = `${paper.name || '试卷'}_空白试卷.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}; filename=paper_${paper.id}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Print paper error:', err);
    res.status(500).json({ error: '打印试卷失败' });
  }
});

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default router;
