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
 * 从满足条件的题目中随机选取指定数量
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

  const allExcludeIds = Array.from(excludeIds);
  if (allExcludeIds.length > 0) {
    where.id = { notIn: allExcludeIds };
  }

  const allIds = await require('../lib/prisma').default.question.findMany({
    where,
    select: { id: true },
  });

  if (allIds.length === 0) return [];

  const actualTake = Math.min(take, allIds.length);
  const shuffled = shuffleArray(allIds);
  return shuffled.slice(0, actualTake).map((q: { id: number }) => q.id);
}
