import prisma from '../lib/prisma';
import { getInfectionConfig } from './configService';

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
      const config = await getInfectionConfig();
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

        if (isInfectionQuestion && record.isCorrect) {
          correctCount++;
        }
        if (isInfectionQuestion) {
          totalCount++;
        }
      }

      // 批量更新院感达标（避免 N+1 查询）
      if (correctCount > 0 || totalCount > 0) {
        let requirement = await tx.infectionRequirement.findFirst({
          where: { userId, month: currentMonth },
        });

        if (!requirement) {
          requirement = await tx.infectionRequirement.create({
            data: {
              userId,
              month: currentMonth,
              requiredCount: config.monthlyRequiredCount,
              completedCount: correctCount,
              accuracyRate: 0,
            },
          });
        } else {
          await tx.infectionRequirement.update({
            where: { id: requirement.id },
            data: { completedCount: { increment: correctCount } },
          });
        }
      }

      // 重新计算正确率（基于本次同步的记录 + 已有记录）
      const latestInfectionReq = await tx.infectionRequirement.findFirst({
        where: { userId, month: currentMonth },
      });

      if (latestInfectionReq) {
        // 只统计本次同步的院感题目正确率，增量更新
        if (totalCount > 0) {
          const batchAccuracy = Math.round((correctCount / totalCount) * 100);
          const oldCompleted = latestInfectionReq.completedCount - correctCount;
          const oldAccuracy = Number(latestInfectionReq.accuracyRate || 0);
          const newCompleted = latestInfectionReq.completedCount;
          const newAccuracy = newCompleted > 0
            ? Math.round((oldAccuracy * Math.max(oldCompleted, 0) + batchAccuracy * totalCount) / (Math.max(oldCompleted, 0) + totalCount))
            : batchAccuracy;

          await tx.infectionRequirement.update({
            where: { id: latestInfectionReq.id },
            data: { accuracyRate: newAccuracy },
          });
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