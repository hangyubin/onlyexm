import prisma from '../lib/prisma';
import { getInfectionConfig, getInfectionTagSet } from './configService';

export interface SyncRecord {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timestamp: string;
  /** 客户端生成的唯一 ID，用于幂等去重 */
  clientRecordId?: string;
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

    const txResult = await prisma.$transaction(async (tx) => {
      const config = await getInfectionConfig();
      const infectionTagSet = await getInfectionTagSet();

      // 批量查询所有题目（避免 N+1 查询）
      const questionIds = records.map(r => r.questionId);
      const questions = await tx.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, infectionTag: true, subCategory: true },
      });
      const questionMap = new Map(questions.map(q => [q.id, q]));

      // 为缺失 clientRecordId 的记录补生成（兼容旧客户端）
      const ensureClientRecordId = (r: SyncRecord, idx: number): string =>
        r.clientRecordId || `auto-${userId}-${r.questionId}-${new Date(r.timestamp).getTime()}-${idx}`;

      // 先查已存在的 clientRecordId，跳过重复记录（幂等）
      const clientRecordIds = records.map((r, i) => ensureClientRecordId(r, i));
      const existing = await tx.practiceSyncRecord.findMany({
        where: { userId, clientRecordId: { in: clientRecordIds } },
        select: { clientRecordId: true },
      });
      const existingIds = new Set(existing.map(e => e.clientRecordId));

      let correctCount = 0;
      let totalCount = 0;

      // 收集有效记录，批量创建（跳过已存在的）
      const validRecords: {
        userId: number;
        questionId: number;
        userAnswer: string;
        isCorrect: boolean;
        syncTime: Date;
        clientRecordId: string;
      }[] = [];

      records.forEach((record, idx) => {
        const question = questionMap.get(record.questionId);

        if (!question) {
          failedIds.push(record.questionId);
          return;
        }

        const clientRecordId = clientRecordIds[idx];
        // 幂等：已存在的记录跳过，不计入 correctCount/totalCount
        if (existingIds.has(clientRecordId)) {
          return;
        }

        const isInfectionQuestion =
          (question.infectionTag != null && infectionTagSet.has(question.infectionTag)) ||
          (question.subCategory != null && infectionTagSet.has(question.subCategory));

        validRecords.push({
          userId,
          questionId: record.questionId,
          userAnswer: record.userAnswer,
          isCorrect: record.isCorrect,
          syncTime: new Date(record.timestamp),
          clientRecordId,
        });

        if (isInfectionQuestion && record.isCorrect) {
          correctCount++;
        }
        if (isInfectionQuestion) {
          totalCount++;
        }
      });

      // 批量创建同步记录（skipDuplicates 兜底，防止并发竞争）
      if (validRecords.length > 0) {
        await tx.practiceSyncRecord.createMany({
          data: validRecords,
          skipDuplicates: true,
        });
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
          const oldCompleted = Math.max(latestInfectionReq.completedCount - correctCount, 0);
          const oldAccuracy = Number(latestInfectionReq.accuracyRate || 0);
          const newCompleted = latestInfectionReq.completedCount;
          const newAccuracy = newCompleted > 0
            ? Math.round((oldAccuracy * oldCompleted + batchAccuracy * totalCount) / (oldCompleted + totalCount))
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
        let unlocked = false;
        if (updatedReq && updatedReq.completedCount >= config.monthlyRequiredCount && Number(updatedReq.accuracyRate || 0) >= config.passRateThreshold) {
          await tx.user.update({
            where: { id: userId },
            data: { isLocked: false },
          });
          unlocked = true;
        }
        return { newCount: validRecords.length, unlocked };
      }
    });

    syncedCount = txResult.newCount;
    isUnlocked = txResult.unlocked;

    return {
      syncedCount,
      failedIds,
      isUnlocked,
    };
  } catch (err) {
    console.error('Sync practice records error:', err);
    throw err;
  }
}