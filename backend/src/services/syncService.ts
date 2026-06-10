import prisma from '../lib/prisma';

export interface SyncRecord {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface SyncResult {
  syncedCount: number;
  failedIds: number[];
  isUnlocked: boolean;
}

export async function syncPracticeRecords(userId: number, records: SyncRecord[]): Promise<SyncResult> {
  let syncedCount = 0;
  const failedIds: number[] = [];
  let isUnlocked = false;

  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    await prisma.$transaction(async (tx) => {
      let correctCount = 0;
      let totalCount = 0;

      // 批量查询所有题目（避免 N+1 查询）
      const questionIds = records.map(r => r.questionId);
      const questions = await tx.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, infectionTag: true, subCategory: true },
      });
      const questionMap = new Map(questions.map(q => [q.id, q]));
      const knownInfectionTags = ['HAND_HYGIENE', 'MEDICAL_WASTE', 'DISINFECTION', 'EXPOSURE', 'ISOLATION', 'STERILIZATION', 'MDRO', 'AIR_QUALITY'];

      for (const record of records) {
        const question = questionMap.get(record.questionId);

        if (!question) {
          failedIds.push(record.questionId);
          continue;
        }

        const isInfectionQuestion = knownInfectionTags.includes(question.infectionTag) || knownInfectionTags.includes(question.subCategory);

        await tx.practiceSyncRecord.create({
          data: {
            userId,
            questionId: record.questionId,
            userAnswer: record.userAnswer,
            isCorrect: record.isCorrect,
            syncTime: new Date(record.timestamp),
          },
        });

        const latestInfectionReq = await tx.infectionRequirement.findFirst({
          where: { userId, month: currentMonth },
        });

        if (isInfectionQuestion && record.isCorrect) {
          if (latestInfectionReq) {
            await tx.infectionRequirement.update({
              where: { id: latestInfectionReq.id },
              data: { completedCount: { increment: 1 } },
            });
          } else {
            await tx.infectionRequirement.create({
              data: {
                userId,
                month: currentMonth,
                requiredCount: 20,
                completedCount: 1,
              },
            });
          }
          totalCount++;
          correctCount++;
        }
      }

      const latestInfectionReq = await tx.infectionRequirement.findFirst({
        where: { userId, month: currentMonth },
      });

      if (latestInfectionReq) {
        // 只统计有院感标签的同步记录的正确率
        const allSyncRecords = await tx.practiceSyncRecord.findMany({
          where: { userId },
          select: { questionId: true, isCorrect: true },
        });

        if (allSyncRecords.length > 0) {
          const questionIds = allSyncRecords.map(r => r.questionId);
          const infectionQuestions = await tx.question.findMany({
            where: {
              id: { in: questionIds },
              OR: [
                { infectionTag: { in: ['HAND_HYGIENE', 'MEDICAL_WASTE', 'DISINFECTION', 'EXPOSURE', 'ISOLATION', 'STERILIZATION', 'MDRO', 'AIR_QUALITY'] } },
                { subCategory: { in: ['HAND_HYGIENE', 'MEDICAL_WASTE', 'DISINFECTION', 'EXPOSURE', 'ISOLATION', 'STERILIZATION', 'MDRO', 'AIR_QUALITY'] } },
              ],
            },
            select: { id: true },
          });
          const infectionQuestionIds = new Set(infectionQuestions.map(q => q.id));

          const infectionSyncRecords = allSyncRecords.filter(r => infectionQuestionIds.has(r.questionId));
          if (infectionSyncRecords.length > 0) {
            const totalCorrect = infectionSyncRecords.filter(r => r.isCorrect).length;
            const accuracyRate = Math.round((totalCorrect / infectionSyncRecords.length) * 100);

            await tx.infectionRequirement.update({
              where: { id: latestInfectionReq.id },
              data: { accuracyRate },
            });
          }
        }

        // 达标解锁判断
        const updatedReq = await tx.infectionRequirement.findFirst({
          where: { userId, month: currentMonth },
        });
        if (updatedReq && updatedReq.completedCount >= 20 && Number(updatedReq.accuracyRate || 0) >= 70) {
          await tx.user.update({
            where: { id: userId },
            data: { isLocked: false },
          });
          isUnlocked = true;
        }
      }
    });

    return {
      syncedCount: records.length - failedIds.length,
      failedIds,
      isUnlocked,
    };
  } catch (err) {
    console.error('Sync practice records error:', err);
    throw err;
  }
}