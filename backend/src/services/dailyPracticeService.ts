import prisma from '../lib/prisma';

export interface PracticeQuestion {
  id: number;
  content: string;
  type: string;
  category: string;
  infectionTag?: string;
  subCategory?: string;
  options: { id: number; optionKey: string; content: string }[];
}

export interface DailyPracticeResult {
  id: number;
  date: string;
  questions: PracticeQuestion[];
  answers: Record<number, string | string[]>;
  score: number;
  isCompleted: boolean;
}

export interface SubmitAnswer {
  questionId: number;
  answer: string | string[];
}

// ============================================================
// 获取用户薄弱标签
// ============================================================
async function getWeakTags(userId: number): Promise<string[]> {
  const wrongQuestions = await prisma.wrongQuestion.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { question: true },
  });

  const tagCount = new Map<string, number>();
  wrongQuestions.forEach((wq) => {
    const tag = (wq.question as any).subCategory || wq.question.infectionTag;
    if (tag) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
  });

  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

// ============================================================
// 获取用户已用过的题目ID集合（从 PracticeQuestionRecord 查询）
// ============================================================
async function getUsedQuestionIds(userId: number): Promise<Set<number>> {
  const records = await prisma.practiceQuestionRecord.findMany({
    where: { userId },
    select: { questionId: true },
  });
  return new Set(records.map((r) => r.questionId));
}

// ============================================================
// 高效的随机题目获取（ID-based 随机选择）
// 先获取所有可用ID，内存随机选取，再按ID批量查询
// 避免 MySQL skip/offset 大偏移量性能问题
// ============================================================
async function getRandomQuestions(
  whereClause: any,
  excludeIds: Set<number>,
  take: number,
): Promise<PracticeQuestion[]> {
  if (take <= 0) return [];

  const allExcludeIds = Array.from(excludeIds);

  const where: any = {
    ...whereClause,
    deletedAt: null,
    type: { in: ['SINGLE', 'MULTIPLE', 'JUDGE'] },
  };

  if (allExcludeIds.length > 0) {
    where.id = { notIn: allExcludeIds };
  }

  // 第一步：只取ID（轻量查询，不加载选项）
  const allIds = await prisma.question.findMany({
    where,
    select: { id: true },
  });

  if (allIds.length === 0) return [];

  // 第二步：内存随机选取ID（Fisher-Yates 洗牌）
  const actualTake = Math.min(take, allIds.length);
  for (let i = allIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }
  const selectedIds = allIds.slice(0, actualTake).map((q) => q.id);

  // 第三步：按ID精确查询（走主键索引，极快）
  const questions = await prisma.question.findMany({
    where: { id: { in: selectedIds } },
    include: { options: true },
  });

  return questions.map((q) => ({
    id: q.id,
    content: q.content,
    type: q.type,
    category: q.category,
    infectionTag: q.infectionTag || undefined,
    subCategory: (q as any).subCategory || undefined,
    options: q.options.map((opt) => ({
      id: opt.id,
      optionKey: opt.optionKey,
      content: opt.content,
    })),
  }));
}

// ============================================================
// 生成每日练习题（题目不重复）
// ============================================================
async function generateQuestions(userId: number, questionCount: number = 10): Promise<PracticeQuestion[]> {
  const today = new Date().toISOString().slice(0, 10);

  // 从 PracticeQuestionRecord 表获取已用题目ID（精准可靠）
  const usedQuestionIds = await getUsedQuestionIds(userId);
  console.log(`[每日一练] 用户${userId} 已用题目数: ${usedQuestionIds.size}`);

  // 获取可用题目总数
  const totalAvailable = await prisma.question.count({
    where: {
      deletedAt: null,
      type: { in: ['SINGLE', 'MULTIPLE', 'JUDGE'] },
    },
  });

  // 如果所有题目都已用完，清空历史记录，重新开始循环
  if (usedQuestionIds.size >= totalAvailable && totalAvailable > 0) {
    console.log(`[每日一练] 用户${userId} 已用完所有${totalAvailable}道题，重置记录`);
    await prisma.practiceQuestionRecord.deleteMany({ where: { userId } });
    usedQuestionIds.clear();
  }

  const questions: PracticeQuestion[] = [];
  const usedIdsInBatch = new Set<number>();
  const weakTags = await getWeakTags(userId);

  // 按比例分配：30%弱标签题，20%院感基础，50%基础题
  const weakTagCount = Math.round(questionCount * 0.3);
  const basicInfectionCount = Math.round(questionCount * 0.2);
  const basicCount = questionCount - weakTagCount - basicInfectionCount;

  // 合并排除ID
  const allExclude = new Set([...usedQuestionIds, ...usedIdsInBatch]);

  // 1. 弱标签题目
  if (weakTags.length > 0 && weakTagCount > 0) {
    const weakQuestions = await getRandomQuestions(
      {
        OR: [
          { subCategory: { in: weakTags } },
          { infectionTag: { in: weakTags }, subCategory: null },
        ],
      },
      allExclude,
      weakTagCount,
    );
    questions.push(...weakQuestions);
    weakQuestions.forEach((q) => {
      allExclude.add(q.id);
      usedIdsInBatch.add(q.id);
    });
  }

  // 2. 院感基础题
  if (basicInfectionCount > 0) {
    const remainingTake = basicInfectionCount;
    const infectionQuestions = await getRandomQuestions(
      {
        OR: [
          { subCategory: { not: null } },
          { infectionTag: { not: null }, subCategory: null },
        ],
      },
      allExclude,
      remainingTake,
    );
    questions.push(...infectionQuestions);
    infectionQuestions.forEach((q) => {
      allExclude.add(q.id);
      usedIdsInBatch.add(q.id);
    });
  }

  // 3. 剩余基础题
  const remainingTake = questionCount - questions.length;
  if (remainingTake > 0) {
    const basicQuestions = await getRandomQuestions(
      {},
      allExclude,
      remainingTake,
    );
    questions.push(...basicQuestions);
    basicQuestions.forEach((q) => {
      usedIdsInBatch.add(q.id);
    });
  }

  // 如果题目不够，允许使用已用过的题目（补充）
  if (questions.length < questionCount) {
    const remainingNeeded = questionCount - questions.length;
    const backupExclude = new Set(questions.map((q) => q.id));
    const backupQuestions = await getRandomQuestions({}, backupExclude, remainingNeeded);
    questions.push(...backupQuestions);
  }

  // 最终去重
  const seenIds = new Set<number>();
  const uniqueQuestions: PracticeQuestion[] = [];
  for (const q of questions) {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id);
      uniqueQuestions.push(q);
    }
  }

  // 记录本次生成的题目到 PracticeQuestionRecord
  const questionIds = uniqueQuestions.map((q) => q.id);
  if (questionIds.length > 0) {
    try {
      await prisma.practiceQuestionRecord.createMany({
        data: questionIds.map((qid) => ({
          userId,
          questionId: qid,
          date: today,
        })),
        skipDuplicates: true, // 跳过已存在的记录（防止唯一约束冲突）
      });
    } catch (e) {
      console.error('[每日一练] 记录题目失败:', e);
    }
  }

  console.log(`[每日一练] 用户${userId} 生成${uniqueQuestions.length}题（去重前${questions.length}）`);
  return uniqueQuestions.slice(0, questionCount);
}

// ============================================================
// 获取今日练习
// ============================================================
export async function getTodayPractice(userId: number, questionCount?: number): Promise<DailyPracticeResult> {
  const today = new Date().toISOString().slice(0, 10);
  console.log('[每日一练] 获取今日练习 - 用户:', userId, '日期:', today);

  let practice = await prisma.dailyPractice.findFirst({
    where: { userId, date: today },
  });

  if (!practice) {
    console.log('[每日一练] 创建新练习');
    const questions = await generateQuestions(userId, questionCount || 10);

    practice = await prisma.dailyPractice.create({
      data: {
        userId,
        date: today,
        questions: JSON.stringify(questions),
        answers: JSON.stringify({}),
        score: 0,
        isCompleted: false,
      },
    });
    console.log('[每日一练] 新练习创建成功 ID:', practice.id);
  } else {
    console.log('[每日一练] 已有练习 ID:', practice.id, '已完成:', practice.isCompleted);
  }

  return {
    id: practice.id,
    date: practice.date,
    questions: JSON.parse(practice.questions as string),
    answers: JSON.parse(practice.answers as string),
    score: practice.score,
    isCompleted: practice.isCompleted,
  };
}

// ============================================================
// 重置今日练习
// ============================================================
export async function resetTodayPractice(userId: number, questionCount?: number): Promise<DailyPracticeResult> {
  const today = new Date().toISOString().slice(0, 10);
  console.log('[每日一练] 重置今日练习 - 用户:', userId);

  // 删除今日练习记录
  await prisma.dailyPractice.deleteMany({
    where: { userId, date: today },
  });

  // 删除今日的题目使用记录（允许重新出题）
  // 注意：保留历史记录，只删除今天的
  await prisma.practiceQuestionRecord.deleteMany({
    where: { userId, date: today },
  });

  // 创建新练习
  const questions = await generateQuestions(userId, questionCount || 10);
  const practice = await prisma.dailyPractice.create({
    data: {
      userId,
      date: today,
      questions: JSON.stringify(questions),
      answers: JSON.stringify({}),
      score: 0,
      isCompleted: false,
    },
  });

  console.log('[每日一练] 重置成功，新ID:', practice.id);
  return {
    id: practice.id,
    date: practice.date,
    questions: JSON.parse(practice.questions as string),
    answers: JSON.parse(practice.answers as string),
    score: practice.score,
    isCompleted: practice.isCompleted,
  };
}

export interface SubmitResult {
  success: boolean;
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  earnedBonus: boolean;
  message: string;
  results: { questionId: number; isCorrect: boolean; correctAnswer: string; userAnswer: string }[];
}

// ============================================================
// 提交练习
// ============================================================
export async function submitPractice(practiceId: number, answers: SubmitAnswer[]): Promise<SubmitResult> {
  console.log('[每日一练] 提交练习 - ID:', practiceId);

  return prisma.$transaction(async (tx) => {
    const safePracticeId = typeof practiceId === 'string' ? parseInt(practiceId) : practiceId;

    const practice = await tx.dailyPractice.findUnique({
      where: { id: safePracticeId },
    });

    if (!practice) {
      return {
        success: false, score: 0, totalQuestions: 0,
        correctCount: 0, accuracy: 0, earnedBonus: false,
        message: '练习不存在', results: [],
      };
    }

    if (practice.isCompleted) {
      return {
        success: false, score: 0, totalQuestions: 0,
        correctCount: 0, accuracy: 0, earnedBonus: false,
        message: '练习已完成', results: [],
      };
    }

    const questions: PracticeQuestion[] = JSON.parse(practice.questions as string);
    const results: { questionId: number; isCorrect: boolean; correctAnswer: string; userAnswer: string }[] = [];
    let correctCount = 0;

    for (const question of questions) {
      const options = await tx.questionOption.findMany({
        where: { questionId: question.id },
      });

      const correctOptions = options.filter((opt) => opt.isCorrect);
      const correctAnswer = correctOptions.map((opt) => opt.optionKey).sort().join(',');

      let userAnswer = '';
      let isCorrect = false;

      const answerItem = answers.find((a) => a.questionId === question.id);
      if (answerItem) {
        userAnswer = Array.isArray(answerItem.answer)
          ? answerItem.answer.sort().join(',')
          : answerItem.answer;
        isCorrect = userAnswer === correctAnswer;
        if (isCorrect) correctCount++;
      }

      results.push({ questionId: question.id, isCorrect, correctAnswer, userAnswer });
    }

    const totalQuestions = questions.length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const score = Math.round((correctCount / totalQuestions) * 100);
    const earnedBonus = accuracy >= 80;

    const wasAlreadyCompleted = practice.isCompleted;

    await tx.dailyPractice.update({
      where: { id: safePracticeId },
      data: {
        answers: JSON.stringify(Object.fromEntries(answers.map((a) => [a.questionId, a.answer]))),
        score,
        isCompleted: true,
      },
    });

    // 更新月度院感任务
    if (!wasAlreadyCompleted && practice.userId) {
      const currentMonth = new Date().toISOString().slice(0, 7);

      let requirement = await tx.infectionRequirement.findFirst({
        where: { userId: practice.userId, month: currentMonth },
      });

      if (!requirement) {
        requirement = await tx.infectionRequirement.create({
          data: {
            userId: practice.userId,
            month: currentMonth,
            requiredCount: 20,
            completedCount: 0,
            accuracyRate: 0,
            isLocked: false,
          },
        });
      }

      const thisMonthPractices = await tx.dailyPractice.findMany({
        where: {
          userId: practice.userId,
          date: { startsWith: currentMonth },
          isCompleted: true,
        },
      });

      let totalScore = score;
      let totalPractices = 1;
      for (const p of thisMonthPractices) {
        if (p.id !== safePracticeId) {
          totalScore += p.score || 0;
          totalPractices += 1;
        }
      }

      const newAccuracy = totalPractices > 0 ? Math.round(totalScore / totalPractices) : 0;

      await tx.infectionRequirement.update({
        where: { id: requirement.id },
        data: {
          completedCount: { increment: totalQuestions },
          accuracyRate: newAccuracy,
        },
      });
    }

    let message = '';
    if (accuracy >= 90) {
      message = '太棒了！你今天表现出色！';
    } else if (accuracy >= 80) {
      message = '不错！继续保持，已获得额外奖励积分！';
    } else if (accuracy >= 60) {
      message = '还可以，再接再厉！';
    } else {
      message = '加油！多多练习会更好！';
    }

    return {
      success: true, score, totalQuestions, correctCount,
      accuracy, earnedBonus, message, results,
    };
  });
}

// ============================================================
// 获取练习历史
// ============================================================
export async function getUserPracticeHistory(userId: number, months: number = 3): Promise<{ date: string; isCompleted: boolean; score: number }[]> {
  const totalDays = months * 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - totalDays + 1);
  const startDateStr = startDate.toISOString().slice(0, 10);

  // 一次性获取日期范围内的所有练习记录
  const practices = await prisma.dailyPractice.findMany({
    where: {
      userId,
      date: { gte: startDateStr },
    },
    select: { date: true, isCompleted: true, score: true },
  });

  // 按日期建立映射
  const practiceMap = new Map<string, { isCompleted: boolean; score: number }>();
  for (const p of practices) {
    practiceMap.set(p.date, { isCompleted: p.isCompleted, score: p.score });
  }

  // 在内存中组装结果
  const result: { date: string; isCompleted: boolean; score: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const practice = practiceMap.get(dateStr);

    result.push({
      date: dateStr,
      isCompleted: practice?.isCompleted || false,
      score: practice?.score || 0,
    });
  }

  return result;
}

// ============================================================
// 获取练习结果详情
// ============================================================
export async function getPracticeResult(practiceId: number): Promise<SubmitResult> {
  console.log('[每日一练] 获取练习详情 - ID:', practiceId);

  const practice = await prisma.dailyPractice.findUnique({
    where: { id: practiceId },
  });

  if (!practice) {
    return {
      success: false, score: 0, totalQuestions: 0,
      correctCount: 0, accuracy: 0, earnedBonus: false,
      message: '练习不存在', results: [],
    };
  }

  const questions: PracticeQuestion[] = JSON.parse(practice.questions as string);
  const savedAnswers: Record<number, any> = JSON.parse(practice.answers as string);
  const results: { questionId: number; isCorrect: boolean; correctAnswer: string; userAnswer: string }[] = [];
  let correctCount = 0;

  for (const question of questions) {
    const options = await prisma.questionOption.findMany({
      where: { questionId: question.id },
    });

    const correctOptions = options.filter((opt) => opt.isCorrect);
    const correctAnswer = correctOptions.map((opt) => opt.optionKey).sort().join(',');

    let userAnswer = '';
    let isCorrect = false;

    if (savedAnswers[question.id]) {
      userAnswer = Array.isArray(savedAnswers[question.id])
        ? savedAnswers[question.id].sort().join(',')
        : savedAnswers[question.id];
      isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correctCount++;
    }

    results.push({ questionId: question.id, isCorrect, correctAnswer, userAnswer });
  }

  const totalQuestions = questions.length;
  const accuracy = practice.score;
  const earnedBonus = accuracy >= 80;

  let message = '';
  if (accuracy >= 90) {
    message = '太棒了！你今天表现出色！';
  } else if (accuracy >= 80) {
    message = '不错！继续保持，已获得额外奖励积分！';
  } else if (accuracy >= 60) {
    message = '还可以，再接再厉！';
  } else {
    message = '加油！多多练习会更好！';
  }

  return {
    success: true, score: practice.score, totalQuestions, correctCount,
    accuracy, earnedBonus, message, results,
  };
}