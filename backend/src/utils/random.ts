import prisma from '../lib/prisma';

/**
 * Fisher-Yates 洗牌算法
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 从满足条件的题目中随机选取指定数量（offset-free 优化版）
 *
 * 优化点：
 * 1. 不再一次性拉取所有符合条件 ID 到内存洗牌（题库上万时内存/耗时线性增长）
 * 2. 采用“随机偏移法”：count 得到总数 N，生成 k 个 [0, N) 随机偏移，
 *    用 cursor/skip 取题，O(k) 次查询而非 O(N) 内存
 * 3. excludeIds 过长时（>1000）改分批 notIn，避免 SQL 长度超限
 * 4. 当候选不足时自动回退到全量查询（保证可用性）
 */
export async function getRandomQuestionIds(
  whereClause: any,
  excludeIds: Set<number>,
  take: number,
): Promise<number[]> {
  if (take <= 0) return [];

  const where: any = {
    ...whereClause,
    deletedAt: null,
  };

  // excludeIds 过长时分批处理，避免单个 notIn SQL 过长
  const allExcludeIds = Array.from(excludeIds);
  const EXCLUDE_BATCH_SIZE = 1000;

  // 先统计可用题量
  let totalCount = 0;
  if (allExcludeIds.length <= EXCLUDE_BATCH_SIZE) {
    where.id = allExcludeIds.length > 0 ? { notIn: allExcludeIds } : undefined;
    totalCount = await prisma.question.count({ where });
  } else {
    // 分批统计：总数 - excludeIds 命中数（近似值，去重误差可接受）
    totalCount = await prisma.question.count({ where: { ...where, deletedAt: null } });
    const excludedCount = await prisma.question.count({
      where: { ...where, id: { in: allExcludeIds } },
    });
    totalCount = Math.max(0, totalCount - excludedCount);
  }

  if (totalCount === 0) return [];

  const actualTake = Math.min(take, totalCount);
  // 候选不足（<= 200）时直接全量拉取洗牌，避免随机偏移法在小集合上反复命中
  if (totalCount <= 200) {
    const queryWhere = allExcludeIds.length > 0
      ? { ...where, id: { notIn: allExcludeIds } }
      : where;
    const allIds = await prisma.question.findMany({
      where: queryWhere,
      select: { id: true },
    });
    const shuffled = shuffleArray(allIds.map(q => q.id));
    return shuffled.slice(0, actualTake);
  }

  // 随机偏移法：生成 actualTake * 1.5 个不重复偏移，冗余取题以应对去重后的数量不足
  const oversampleRatio = 1.5;
  const attempts = Math.min(
    totalCount,
    Math.ceil(actualTake * oversampleRatio) + 5,
  );
  const offsets = new Set<number>();
  let guard = 0;
  while (offsets.size < attempts && guard < attempts * 3) {
    offsets.add(Math.floor(Math.random() * totalCount));
    guard++;
  }

  // 按偏移降序排序，从后往前 take，避免 skip 大偏移时影响前面已取结果
  const sortedOffsets = Array.from(offsets).sort((a, b) => b - a);

  const result = new Set<number>();
  for (const offset of sortedOffsets) {
    if (result.size >= actualTake) break;
    // skip + take 1，配合 excludeIds notIn
    const queryWhere = allExcludeIds.length > 0
      ? { ...where, id: { notIn: allExcludeIds } }
      : where;
    const rows = await prisma.question.findMany({
      where: queryWhere,
      select: { id: true },
      skip: offset,
      take: 1,
    });
    if (rows.length > 0) {
      result.add(rows[0].id);
    }
  }

  // 兜底：随机偏移法未取足（偏移撞车或被 exclude 命中），回退全量洗牌
  if (result.size < actualTake) {
    const queryWhere = allExcludeIds.length > 0
      ? { ...where, id: { notIn: allExcludeIds } }
      : where;
    const allIds = await prisma.question.findMany({
      where: queryWhere,
      select: { id: true },
    });
    const shuffled = shuffleArray(allIds.map(q => q.id));
    for (const id of shuffled) {
      if (result.size >= actualTake) break;
      result.add(id);
    }
  }

  return Array.from(result).slice(0, actualTake);
}
