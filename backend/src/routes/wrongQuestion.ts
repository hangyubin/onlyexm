import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const type = req.query.type as string;
  const category = req.query.category as string;
  const infectionTag = req.query.infectionTag as string;

  try {
    const where: any = {
      userId: user.userId,
      status: 'ACTIVE',
      question: {
        deletedAt: null,
      },
    };

    if (type) {
      where.question = { ...where.question, type };
    }
    if (category) {
      where.question = { ...where.question, category };
    }
    if (infectionTag) {
      where.question = { ...where.question, infectionTag };
    }

    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where,
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    });

    const total = await prisma.wrongQuestion.count({ where });

    res.json({
      success: true,
      data: wrongQuestions,
      total,
    });
  } catch (err) {
    console.error('Get wrong questions error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/practice', authMiddleware, async (req, res) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const { questionId, isCorrect } = req.body;

  try {
    let wrongQuestion = await prisma.wrongQuestion.findFirst({
      where: {
        userId: user.userId,
        questionId,
        status: 'ACTIVE',
      },
    });

    if (!wrongQuestion) {
      return res.status(404).json({ error: '错题记录不存在' });
    }

    let newCorrectCount = wrongQuestion.correctCount;
    let newWrongCount = wrongQuestion.wrongCount;
    let newStatus = 'ACTIVE';

    if (isCorrect) {
      newCorrectCount += 1;
      if (newCorrectCount >= 3) {
        newStatus = 'REMOVED';
      }
    } else {
      newWrongCount += 1;
      newCorrectCount = 0;
    }

    const updated = await prisma.wrongQuestion.update({
      where: { id: wrongQuestion.id },
      data: {
        correctCount: newCorrectCount,
        wrongCount: newWrongCount,
        status: newStatus,
      },
    });

    res.json({
      success: true,
      data: updated,
      autoRemoved: newStatus === 'REMOVED',
      message: newStatus === 'REMOVED' ? '恭喜！此题已掌握，自动移出错题本' : '练习记录已保存',
    });
  } catch (err) {
    console.error('Practice wrong question error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const wrongQuestion = await prisma.wrongQuestion.findFirst({
      where: {
        id: parseInt(id),
        userId: user.userId,
      },
    });

    if (!wrongQuestion) {
      return res.status(404).json({ error: '错题记录不存在' });
    }

    await prisma.wrongQuestion.update({
      where: { id: parseInt(id) },
      data: { status: 'REMOVED' },
    });

    res.json({
      success: true,
      message: '已标记为已掌握',
    });
  } catch (err) {
    console.error('Delete wrong question error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
