import prisma from '../lib/prisma';

type Question = Awaited<ReturnType<typeof prisma.question.findMany>>[number];

export interface GeneratePaperInput {
  name: string;
  department?: string;
  categoryConfigs: { categoryCode: string; count: number; subCategory?: string }[];
  typeConfigs: { typeCode: string; count: number; score: number }[];
  difficultyRatio: string;
  durationMinutes: number;
  passingScore: number;
}

export interface GeneratedQuestion {
  question: Question;
  score: number;
}

export interface GenerateResult {
  success: boolean;
  paperId?: number;
  message?: string;
  totalScore?: number;
  questionCount?: number;
}

// ============================================================
// 获取所有试卷已使用的题目ID（跨试卷去重）
// ============================================================
async function getUsedQuestionIdsInPapers(): Promise<Set<number>> {
  const records = await prisma.paperQuestionRecord.findMany({
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
): Promise<Question[]> {
  if (take <= 0) return [];

  const allExcludeIds = Array.from(excludeIds);

  const where: any = {
    ...whereClause,
    deletedAt: null,
  };

  if (allExcludeIds.length > 0) {
    where.id = { notIn: allExcludeIds };
  }

  // 第一步：只取ID（轻量，仅整数字段）
  const allIds = await prisma.question.findMany({
    where,
    select: { id: true },
  });

  if (allIds.length === 0) return [];

  // 第二步：内存随机选取（Fisher-Yates 洗牌）
  const actualTake = Math.min(take, allIds.length);
  for (let i = allIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }
  const selectedIds = allIds.slice(0, actualTake).map((q) => q.id);

  // 第三步：按ID精确查询（走主键索引）
  return prisma.question.findMany({
    where: { id: { in: selectedIds } },
    include: { options: true },
  });
}

// ============================================================
// 获取可用题目（按分类，ID-based，避免全量加载选项）
// ============================================================
async function getAvailableQuestions(
  category: string,
  excludeIds: Set<number>,
  subCategory?: string,
): Promise<Question[]> {
  const where: any = {
    category: category as any,
    deletedAt: null,
  };

  if (subCategory) {
    where.OR = [
      { subCategory: subCategory as any },
      { infectionTag: subCategory as any, subCategory: null },
    ];
  }

  const allExclude = Array.from(excludeIds);
  if (allExclude.length > 0) {
    where.id = { notIn: allExclude };
  }

  // 只取ID，不加载选项
  const allIds = await prisma.question.findMany({
    where,
    select: { id: true },
  });

  if (allIds.length === 0) return [];

  // 按ID精确查询（走主键索引）
  return prisma.question.findMany({
    where: { id: { in: allIds.map((q) => q.id) } },
    include: { options: true },
  });
}

// ============================================================
// 洗牌算法
// ============================================================
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================
// 按难度比例分配题目
// ============================================================
function splitByDifficulty(
  questions: Question[],
  easyRatio: number,
  mediumRatio: number,
  hardRatio: number,
  totalCount: number,
): Question[] {
  if (questions.length <= totalCount) {
    return shuffleArray(questions);
  }

  const totalRatio = easyRatio + mediumRatio + hardRatio;
  let easyCount = Math.round((easyRatio / totalRatio) * totalCount);
  let mediumCount = Math.round((mediumRatio / totalRatio) * totalCount);
  let hardCount = totalCount - easyCount - mediumCount;

  const easyQuestions = questions.filter((q) => q.difficulty === 1 || q.difficulty === 0);
  const mediumQuestions = questions.filter((q) => q.difficulty === 2);
  const hardQuestions = questions.filter((q) => q.difficulty === 3);

  const shuffledEasy = shuffleArray(easyQuestions);
  const shuffledMedium = shuffleArray(mediumQuestions);
  const shuffledHard = shuffleArray(hardQuestions);

  let selectedEasy = shuffledEasy.slice(0, easyCount);
  let selectedMedium = shuffledMedium.slice(0, mediumCount);
  let selectedHard = shuffledHard.slice(0, hardCount);

  // 如果某难度题目不够，用其他难度补充
  const easyDeficit = easyCount - selectedEasy.length;
  const mediumDeficit = mediumCount - selectedMedium.length;
  const hardDeficit = hardCount - selectedHard.length;

  if (easyDeficit > 0 || mediumDeficit > 0 || hardDeficit > 0) {
    const remainingEasy = shuffledEasy.slice(easyCount);
    const remainingMedium = shuffledMedium.slice(mediumCount);
    const remainingHard = shuffledHard.slice(hardCount);
    const remainingPool = shuffleArray([...remainingEasy, ...remainingMedium, ...remainingHard]);

    let offset = 0;
    if (easyDeficit > 0) {
      selectedEasy = [...selectedEasy, ...remainingPool.slice(offset, offset + easyDeficit)];
      offset += easyDeficit;
    }
    if (mediumDeficit > 0) {
      selectedMedium = [...selectedMedium, ...remainingPool.slice(offset, offset + mediumDeficit)];
      offset += mediumDeficit;
    }
    if (hardDeficit > 0) {
      selectedHard = [...selectedHard, ...remainingPool.slice(offset, offset + hardDeficit)];
    }
  }

  const result = [...selectedEasy, ...selectedMedium, ...selectedHard];

  if (result.length < totalCount) {
    const needed = totalCount - result.length;
    const backup = shuffleArray(questions.filter((q) => !result.includes(q)));
    return [...result, ...backup.slice(0, needed)];
  }

  return shuffleArray(result.slice(0, totalCount));
}

// ============================================================
// 自动组卷（题目不重复）
// ============================================================
async function generatePaper(
  input: GeneratePaperInput,
  userId: number,
): Promise<GenerateResult> {
  return prisma.$transaction(async (tx) => {
    const [easyRatio, mediumRatio, hardRatio] = input.difficultyRatio
      .split(':')
      .map((s) => parseInt(s, 10));

    // 从 PaperQuestionRecord 获取所有试卷已用题目ID
    let usedQuestionIds = await getUsedQuestionIdsInPapers();
    console.log(`[组卷] 试卷已用题目数: ${usedQuestionIds.size}`);

    // 获取可用题目总数
    const totalAvailable = await tx.question.count({
      where: { deletedAt: null },
    });

    // 如果所有题目都已用完，清空历史记录，重新开始循环
    if (usedQuestionIds.size >= totalAvailable && totalAvailable > 0) {
      console.log(`[组卷] 所有${totalAvailable}道题已用完，重置记录`);
      await tx.paperQuestionRecord.deleteMany({});
      usedQuestionIds.clear();
    }

    const totalCategoryCount = input.categoryConfigs.reduce((sum, c) => sum + c.count, 0);
    const totalTypeCount = input.typeConfigs.reduce((sum, t) => sum + t.count, 0);

    // 收集所有候选题目
    const allCandidateQuestions: Question[] = [];
    const seenIds = new Set<number>();

    for (const config of input.categoryConfigs) {
      if (config.count <= 0) continue;
      const questions = await getAvailableQuestions(
        config.categoryCode,
        usedQuestionIds,
        config.subCategory,
      );
      for (const q of questions) {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          allCandidateQuestions.push(q);
        }
      }
    }

    const allSelectedQuestions: GeneratedQuestion[] = [];
    const usedQuestionsInPaper: number[] = [];

    for (const typeConfig of input.typeConfigs) {
      if (typeConfig.count <= 0) continue;

      const candidatesByType = allCandidateQuestions.filter(
        (q) => q.type === typeConfig.typeCode && !usedQuestionsInPaper.includes(q.id),
      );

      let selected = splitByDifficulty(
        candidatesByType,
        easyRatio,
        mediumRatio,
        hardRatio,
        typeConfig.count,
      );

      // 如果候选题目不够，从数据库补充（排除已用题目）
      if (selected.length < typeConfig.count) {
        const remainingNeeded = typeConfig.count - selected.length;
        const extraExclude = new Set([
          ...usedQuestionIds,
          ...usedQuestionsInPaper,
          ...selected.map((q) => q.id),
        ]);
        const extraQuestions = await getRandomQuestions(
          { type: typeConfig.typeCode as any },
          extraExclude,
          remainingNeeded,
        );
        selected = [...selected, ...extraQuestions];
      }

      // 如果仍然不够，允许使用已用过的题目
      if (selected.length < typeConfig.count) {
        const remainingNeeded = typeConfig.count - selected.length;
        const fallbackExclude = new Set(
              usedQuestionsInPaper.concat(selected.map((q) => q.id)),
            );
        const fallbackQuestions = await getRandomQuestions(
          { type: typeConfig.typeCode as any },
          fallbackExclude,
          remainingNeeded,
        );
        selected = [...selected, ...fallbackQuestions];
      }

      if (selected.length < typeConfig.count) {
        const typeItems = await tx.systemDict.findMany({
          where: { category: 'QUESTION_TYPE', code: typeConfig.typeCode },
          select: { name: true },
        });
        const typeName = typeItems[0]?.name || typeConfig.typeCode;
        return {
          success: false,
          message: `${typeName}题数量不足，需要 ${typeConfig.count} 道，实际只有 ${selected.length} 道`,
        };
      }

      selected.forEach((q) => {
        allSelectedQuestions.push({ question: q, score: typeConfig.score });
        usedQuestionsInPaper.push(q.id);
      });
    }

    const totalScore = allSelectedQuestions.reduce((sum, gq) => sum + gq.score, 0);

    // 验证及格分不超过总分
    if (input.passingScore > totalScore) {
      throw new Error(`及格分(${input.passingScore})不能超过总分(${totalScore})`);
    }

    // 创建试卷
    const paper = await tx.paper.create({
      data: {
        name: input.name,
        description: `${input.department || '全院'} - ${input.difficultyRatio}难度比例`,
        totalScore,
        passingScore: input.passingScore,
        durationMinutes: input.durationMinutes,
        isActive: true,
        isPublished: true,
      },
    });

    // 创建试卷-题目关联
    await Promise.all(
      allSelectedQuestions.map((gq) =>
        tx.paperQuestion.create({
          data: {
            paperId: paper.id,
            questionId: gq.question.id,
            score: gq.score,
          },
        }),
      ),
    );

    // 记录题目到 PaperQuestionRecord（确保跨试卷去重）
    const questionIds = allSelectedQuestions.map((gq) => gq.question.id);
    if (questionIds.length > 0) {
      try {
        await tx.paperQuestionRecord.createMany({
          data: questionIds.map((qid) => ({
            paperId: paper.id,
            questionId: qid,
          })),
          skipDuplicates: true,
        });
      } catch (e) {
        console.error('[组卷] 记录题目失败:', e);
      }
    }

    // 生成日志
    await tx.paperGenerationLog.create({
      data: {
        userId,
        paperId: paper.id,
        paperName: input.name,
      },
    });

    console.log(`[组卷] 试卷"${input.name}"创建成功，${allSelectedQuestions.length}题，总分${totalScore}`);

    return {
      success: true,
      paperId: paper.id,
      totalScore,
      questionCount: allSelectedQuestions.length,
      message: '组卷成功',
    };
  });
}

export { generatePaper };