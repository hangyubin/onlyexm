import prisma from '../lib/prisma';

export const ExamStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  AUTO_SUBMIT: 'AUTO_SUBMIT',
  FORCE_SUBMIT: 'FORCE_SUBMIT'
};

export interface AnswerItem {
  questionId: number;
  answer: string | string[];
}

export interface SuspiciousLogItem {
  questionId: number;
  durationSeconds: number;
}

export interface SubmitExamInput {
  examRecordId: number;
  answers: AnswerItem[];
  tabSwitchCount: number;
  suspiciousLog: SuspiciousLogItem[];
}

export interface WrongQuestion {
  questionId: number;
  correctAnswer: string;
  userAnswer: string;
  analysis: string;
}

export interface SubmitResult {
  code: number;
  data?: {
    score: number;
    infectionScore: number;
    isPassed: boolean;
    passingScore: number;
    wrongQuestions: WrongQuestion[];
    infectionAccuracy: number;
    needMoreInfection: boolean;
  };
  message?: string;
}

interface CaseStep {
  stepKey: string;
  points: number;
  correctAnswer: string;
}

interface CaseScoringRule {
  questionId: number;
  steps: CaseStep[];
  totalPoints: number;
}

const caseScoringRules: Record<number, CaseScoringRule> = {};

function normalizeAnswer(answer: string | string[]): string {
  if (Array.isArray(answer)) {
    return answer.sort().join(',');
  }
  return answer;
}

function calculateQuestionScore(
  question: any,
  userAnswer: string | string[],
  options: any[]
): { score: number; isCorrect: boolean; correctAnswer: string } {
  const correctOptions = options.filter((opt) => opt.isCorrect);
  const correctAnswer = correctOptions.map((opt) => opt.optionKey).sort().join(',');
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const isCorrect = normalizedUserAnswer === correctAnswer;

  if (question.type === 'CASE') {
    const rule = caseScoringRules[question.id];
    if (rule) {
      let totalScore = 0;
      const userAnswerObj = typeof userAnswer === 'object' && !Array.isArray(userAnswer) ? userAnswer as unknown as Record<string, unknown> : {} as Record<string, unknown>;
      
      for (const step of rule.steps) {
        const userStepAnswer = userAnswerObj[step.stepKey];
        if (userStepAnswer === step.correctAnswer) {
          totalScore += step.points;
        }
      }
      
      return {
        score: totalScore,
        isCorrect: totalScore === rule.totalPoints,
        correctAnswer: JSON.stringify(rule.steps.map(s => ({ [s.stepKey]: s.correctAnswer }))),
      };
    }
    
    return {
      score: isCorrect ? question.score : 0,
      isCorrect,
      correctAnswer,
    };
  }

  return {
    score: isCorrect ? question.score : 0,
    isCorrect,
    correctAnswer,
  };
}

export async function submitExam(input: SubmitExamInput): Promise<SubmitResult> {
  return prisma.$transaction(async (tx) => {
    const examRecord = await tx.examRecord.findUnique({
      where: { id: input.examRecordId },
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
      return { code: 404, message: '考试记录不存在' };
    }

    if (examRecord.status !== ExamStatus.IN_PROGRESS) {
      return { code: 400, message: '考试状态不正确，无法提交' };
    }

    const { paper } = examRecord;
    const questionMap = new Map<number, any>();
    
    // 获取已有的答案记录（答题时自动保存的）
    const existingAnswers = await tx.answerDetail.findMany({
      where: { examRecordId: input.examRecordId },
    });
    const existingAnswerIds = new Set(existingAnswers.map((a) => a.questionId));

    for (const pq of paper.paperQuestions) {
      questionMap.set(pq.question.id, {
        question: pq.question,
        score: pq.score,
      });
    }

    let totalScore = 0;
    let infectionScore = 0;
    let infectionTotal = 0;
    let infectionCorrectCount = 0; // 答对的院感题目数
    const wrongQuestions: WrongQuestion[] = [];
    const answerDetails: any[] = [];

    for (const answerItem of input.answers) {
      const qInfo = questionMap.get(answerItem.questionId);
      
      if (!qInfo) continue;

      const { question, score: questionScore } = qInfo;
      const result = calculateQuestionScore(question, answerItem.answer, question.options);

      if (!result.isCorrect) {
        wrongQuestions.push({
          questionId: question.id,
          correctAnswer: result.correctAnswer,
          userAnswer: normalizeAnswer(answerItem.answer),
          analysis: question.analysis,
        });
      }

      totalScore += result.score;

      if (question.infectionTag) {
        infectionScore += result.score;
        infectionTotal += questionScore;
        if (result.isCorrect) infectionCorrectCount++;
      }

      answerDetails.push({
        examRecordId: input.examRecordId,
        questionId: question.id,
        userAnswer: JSON.stringify(answerItem.answer),
        isCorrect: result.isCorrect,
        scoreObtained: result.score,
      });
    }

    const durationSeconds = Math.floor(
      (new Date().getTime() - new Date(examRecord.startTime).getTime()) / 1000
    );

    const infectionAccuracy = infectionTotal > 0 ? Math.round((infectionScore / infectionTotal) * 100) : 0;
    const isPassed = totalScore >= paper.passingScore;

    await tx.answerDetail.createMany({
      data: answerDetails.filter((ad: any) => !existingAnswerIds.has(ad.questionId)),
    });

    // 更新已有答案记录的得分
    for (const ad of answerDetails) {
      if (existingAnswerIds.has(ad.questionId)) {
        await tx.answerDetail.updateMany({
          where: { examRecordId: input.examRecordId, questionId: ad.questionId },
          data: { isCorrect: ad.isCorrect, scoreObtained: ad.scoreObtained, userAnswer: ad.userAnswer },
        });
      }
    }

    await tx.examRecord.update({
      where: { id: input.examRecordId },
      data: {
        endTime: new Date(),
        durationSeconds,
        score: totalScore,
        infectionScore,
        isPassed,
        tabSwitchCount: input.tabSwitchCount,
        status: ExamStatus.SUBMITTED as any,
      },
    });

    if (examRecord.userId) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const requirement = await tx.infectionRequirement.findFirst({
        where: {
          userId: examRecord.userId,
          month: currentMonth,
        },
      });

      if (requirement && infectionAccuracy >= 70) {
        await tx.infectionRequirement.update({
          where: { id: requirement.id },
          data: {
            completedCount: { increment: infectionCorrectCount }, // 按答对的院感题目数增加
            accuracyRate: {
              set: ((requirement.completedCount * Number(requirement.accuracyRate || 0) + infectionAccuracy) / (requirement.completedCount + infectionCorrectCount)),
            },
          },
        });
      }

      // 批量处理错题记录（避免逐个查询）
      const wrongQuestionIds = wrongQuestions.map((w) => w.questionId);
      const existingWrongQuestions = await tx.wrongQuestion.findMany({
        where: {
          userId: examRecord.userId,
          questionId: { in: wrongQuestionIds },
          status: 'ACTIVE',
        },
      });
      const existingWrongMap = new Map(existingWrongQuestions.map((wq) => [wq.questionId, wq]));

      const newWrongQuestions = wrongQuestions.filter((w) => !existingWrongMap.has(w.questionId));

      // 更新已有错题：递增错误次数
      if (existingWrongQuestions.length > 0) {
        await Promise.all(
          existingWrongQuestions.map((wq) =>
            tx.wrongQuestion.update({
              where: { id: wq.id },
              data: { wrongCount: { increment: 1 }, correctCount: 0 },
            })
          )
        );
      }

      // 批量创建新错题
      if (newWrongQuestions.length > 0) {
        await tx.wrongQuestion.createMany({
          data: newWrongQuestions.map((w) => ({
            userId: examRecord.userId,
            questionId: w.questionId,
            wrongCount: 1,
            correctCount: 0,
            status: 'ACTIVE',
          })),
        });
      }
    }

    const updatedRequirement = examRecord.userId
      ? await tx.infectionRequirement.findFirst({
          where: {
            userId: examRecord.userId,
            month: new Date().toISOString().slice(0, 7),
          },
        })
      : null;

    const needMoreInfection =
      updatedRequirement &&
      (updatedRequirement.completedCount < updatedRequirement.requiredCount ||
        Number(updatedRequirement.accuracyRate || 0) < 70);

    return {
      code: 0,
      data: {
        score: totalScore,
        infectionScore,
        isPassed,
        passingScore: paper.passingScore,
        wrongQuestions,
        infectionAccuracy,
        needMoreInfection: !!needMoreInfection,
      },
    };
  });
}

export async function startExam(paperId: number, userId: number, clientIp?: string): Promise<any> {
  const MAX_REENTRY = 3; // 最大重入次数

  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    include: {
      paperQuestions: {
        include: {
          question: {
            include: { options: true },
          },
        },
      },
    },
  });

  if (!paper) {
    return { error: '试卷不存在' };
  }

  // 检查试卷是否已发布
  if (!paper.isActive) {
    return { error: '该试卷尚未发布，无法开考' };
  }

  // 检查考试时间
  const now = new Date();
  if (paper.examStartTime && now < new Date(paper.examStartTime)) {
    return { error: '考试尚未开始，请在规定时间内参加考试' };
  }
  if (paper.examEndTime && now > new Date(paper.examEndTime)) {
    return { error: '考试已结束' };
  }
  // 开考30分钟后不允许进入
  if (paper.examStartTime) {
    const thirtyMinutesAfterStart = new Date(new Date(paper.examStartTime).getTime() + 30 * 60 * 1000);
    if (now > thirtyMinutesAfterStart) {
      return { error: '已超过入场时间（开考30分钟后不允许进入）' };
    }
  }

  // 查找该用户对该试卷的已有考试记录
  const existingRecord = await prisma.examRecord.findFirst({
    where: {
      userId,
      paperId,
      status: { in: ['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
    },
    orderBy: { createdAt: 'desc' },
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

  if (existingRecord) {
    // 已交卷，不允许再进入
    if (['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'].includes(existingRecord.status)) {
      return { error: '您已完成该考试，不能再次进入', examRecordId: existingRecord.id };
    }

    // 考试进行中 - 检查是否超时
    const elapsedSeconds = Math.floor((Date.now() - new Date(existingRecord.startTime).getTime()) / 1000);
    const totalAllowedSeconds = paper.durationMinutes * 60;

    if (elapsedSeconds >= totalAllowedSeconds) {
      // 超时，自动交卷
      await autoSubmitExam(existingRecord.id);
      return { error: '考试时间已到，已自动交卷', examRecordId: existingRecord.id };
    }

    // 检查重入次数
    if (existingRecord.reentryCount >= MAX_REENTRY) {
      // 超过重入次数，强制交卷
      await autoSubmitExam(existingRecord.id, 'FORCE_SUBMIT');
      return { error: `重入次数已达上限（${MAX_REENTRY}次），已强制交卷`, examRecordId: existingRecord.id };
    }

    // 允许重入，增加重入次数
    const updatedRecord = await prisma.examRecord.update({
      where: { id: existingRecord.id },
      data: { reentryCount: { increment: 1 } },
    });

    // 恢复考试：返回题目和已保存的答案
    if (!existingRecord.paper) {
      return { error: '试卷不存在或已删除' };
    }
    const questions = existingRecord.paper.paperQuestions.map((pq) => ({
      id: pq.question.id,
      content: pq.question.content,
      type: pq.question.type,
      category: pq.question.category,
      options: pq.question.options.map((opt) => ({
        id: opt.id,
        optionKey: opt.optionKey,
        content: opt.content,
      })),
      score: pq.score,
    }));

    // 获取已保存的答案
    const savedAnswers = await prisma.answerDetail.findMany({
      where: { examRecordId: existingRecord.id },
    });
    const answersMap: Record<number, string> = {};
    for (const sa of savedAnswers) {
      answersMap[sa.questionId] = sa.userAnswer;
    }

    const remainingSeconds = totalAllowedSeconds - elapsedSeconds;

    return {
      paperName: paper.name,
      durationMinutes: paper.durationMinutes,
      examRecordId: existingRecord.id,
      questions,
      savedAnswers: answersMap,
      remainingSeconds,
      reentryCount: updatedRecord.reentryCount,
      maxReentry: MAX_REENTRY,
      isResuming: true,
    };
  }

  // 首次开考 - 创建新考试记录
  const examRecord = await prisma.examRecord.create({
    data: {
      userId,
      paperId,
      status: ExamStatus.IN_PROGRESS as any,
      clientIp: clientIp || null,
    },
  });

  const questions = paper.paperQuestions.map((pq) => ({
    id: pq.question.id,
    content: pq.question.content,
    type: pq.question.type,
    category: pq.question.category,
    options: pq.question.options.map((opt) => ({
      id: opt.id,
      optionKey: opt.optionKey,
      content: opt.content,
    })),
    score: pq.score,
  }));

  // 按题型分组，组内乱序
  const typeOrder = ['SINGLE', 'MULTIPLE', 'JUDGE', 'CASE'];
  const grouped = new Map<string, typeof questions>();
  for (const q of questions) {
    const list = grouped.get(q.type) || [];
    list.push(q);
    grouped.set(q.type, list);
  }
  // 组内乱序
  for (const [, list] of grouped) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  // 按题型顺序合并
  const shuffledQuestions: typeof questions = [];
  for (const type of typeOrder) {
    const list = grouped.get(type);
    if (list) shuffledQuestions.push(...list);
  }
  // 加上不在预定义顺序中的题型
  for (const [type, list] of grouped) {
    if (!typeOrder.includes(type)) {
      shuffledQuestions.push(...list);
    }
  }

  return {
    paperName: paper.name,
    durationMinutes: paper.durationMinutes,
    examRecordId: examRecord.id,
    questions: shuffledQuestions,
    remainingSeconds: paper.durationMinutes * 60,
    reentryCount: 0,
    maxReentry: MAX_REENTRY,
    isResuming: false,
  };
}

// 自动交卷
export async function autoSubmitExam(examRecordId: number, status: string = 'AUTO_SUBMIT'): Promise<void> {
  const examRecord = await prisma.examRecord.findUnique({
    where: { id: examRecordId },
    include: {
      paper: {
        include: {
          paperQuestions: {
            include: {
              question: { include: { options: true } },
            },
          },
        },
      },
      answerDetails: true,
    },
  });

  if (!examRecord || examRecord.status !== 'IN_PROGRESS' || !examRecord.paper) return;

  const questionMap = new Map<number, any>();
  for (const pq of examRecord.paper.paperQuestions) {
    questionMap.set(pq.question.id, { question: pq.question, score: pq.score });
  }

  let totalScore = 0;
  let infectionScore = 0;
  let infectionTotal = 0;

  for (const detail of examRecord.answerDetails) {
    const qInfo = questionMap.get(detail.questionId);
    if (!qInfo) continue;

    const { question, score: questionScore } = qInfo;
    const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
    const correctAnswer = correctOptions.map((opt: any) => opt.optionKey).sort().join(',');
    let normalizedUserAnswer = detail.userAnswer;
    try {
      const parsed = JSON.parse(detail.userAnswer);
      if (Array.isArray(parsed)) {
        normalizedUserAnswer = parsed.sort().join(',');
      }
    } catch { /* not JSON array */ }

    const isCorrect = normalizedUserAnswer === correctAnswer;
    const obtainedScore = isCorrect ? questionScore : 0;
    totalScore += obtainedScore;

    if (question.infectionTag) {
      infectionScore += obtainedScore;
      infectionTotal += questionScore;
    }

    await prisma.answerDetail.update({
      where: { id: detail.id },
      data: { isCorrect, scoreObtained: obtainedScore },
    });
  }

  const durationSeconds = Math.floor((Date.now() - new Date(examRecord.startTime).getTime()) / 1000);
  const isPassed = totalScore >= (examRecord.paper?.passingScore ?? 60);

  await prisma.examRecord.update({
    where: { id: examRecordId },
    data: {
      endTime: new Date(),
      durationSeconds,
      score: totalScore,
      infectionScore,
      isPassed,
      status: status as any,
    },
  });
}

export async function saveAnswer(
  examRecordId: number,
  questionId: number,
  answer: string | string[]
): Promise<boolean> {
  try {
    const existing = await prisma.answerDetail.findFirst({
      where: { examRecordId, questionId },
    });

    if (existing) {
      await prisma.answerDetail.update({
        where: { id: existing.id },
        data: {
          userAnswer: JSON.stringify(answer),
        },
      });
    } else {
      await prisma.answerDetail.create({
        data: {
          examRecordId,
          questionId,
          userAnswer: JSON.stringify(answer),
          isCorrect: false,
          scoreObtained: 0,
        },
      });
    }
    return true;
  } catch {
    return false;
  }
}
