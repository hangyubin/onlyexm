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

      for (const record of records) {
        const question = await tx.question.findUnique({
          where: { id: record.questionId },
          select: { infectionTag: true },
        });

        if (!question) {
          failedIds.push(record.questionId);
          continue;
        }

        await tx.practiceSyncRecord.create({
          data: {
            userId,
            questionId: record.questionId,
            userAnswer: record.userAnswer,
            isCorrect: record.isCorrect,
            syncTime: new Date(record.timestamp),
          },
        });

        if (question.infectionTag && record.isCorrect) {
          const infectionReq = await tx.infectionRequirement.findFirst({
            where: { userId, month: currentMonth },
          });

          if (infectionReq) {
            await tx.infectionRequirement.update({
              where: { id: infectionReq.id },
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
        }

        totalCount++;
        if (record.isCorrect) correctCount++;
      }

      const latestInfectionReq = await tx.infectionRequirement.findFirst({
        where: { userId, month: currentMonth },
      });

      if (latestInfectionReq) {
        const allSyncRecords = await tx.practiceSyncRecord.findMany({
          where: { userId },
        });

        const totalCorrect = allSyncRecords.filter(r => r.isCorrect).length;
        const accuracyRate = totalCorrect / allSyncRecords.length * 100;

        await tx.infectionRequirement.update({
          where: { id: latestInfectionReq.id },
          data: { accuracyRate },
        });

        if (latestInfectionReq.completedCount >= 20 && accuracyRate >= 70) {
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