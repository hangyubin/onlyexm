import prisma from '../lib/prisma';

export interface DictItem {
  code: string;
  name: string;
  color?: string | null;
}

const dictCache = new Map<string, { items: DictItem[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

export async function getDictItems(category: string): Promise<DictItem[]> {
  const now = Date.now();
  const cached = dictCache.get(category);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.items;
  }
  const items = await prisma.systemDict.findMany({
    where: { category, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { code: true, name: true, color: true },
  });
  dictCache.set(category, { items, timestamp: now });
  return items;
}

export function clearDictCache(category?: string) {
  if (category) {
    dictCache.delete(category);
  } else {
    dictCache.clear();
  }
}
