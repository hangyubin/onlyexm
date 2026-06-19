import { useState, useEffect, useCallback } from 'react';
import { systemApi } from '../api/system';

type DictMap = Record<string, { label: string; color: string }>;
type DictOptions = { value: string; label: string }[];

export interface DictData {
  dictMap: DictMap;
  options: DictOptions;
}

const globalCache = new Map<string, DictData>();

/**
 * 清除字典缓存（在字典增删改后调用）
 * @param category 指定分类，不传则清除全部
 */
export function clearDictCache(category?: string) {
  if (category) {
    globalCache.delete(category);
  } else {
    globalCache.clear();
  }
}

/**
 * 统一字典数据 Hook，带全局缓存
 * @param category 字典分类代码
 */
export function useDictData(category: string): DictData & { loading: boolean } {
  const [data, setData] = useState<DictData>(
    globalCache.get(category) || { dictMap: {}, options: [] }
  );
  const [loading, setLoading] = useState(!globalCache.has(category));

  const loadDict = useCallback(async () => {
    if (globalCache.has(category)) {
      setData(globalCache.get(category)!);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await systemApi.getDict(category);
      const dictMap: DictMap = items.reduce(
        (acc: DictMap, item: any) => ({ ...acc, [item.code]: { label: item.name, color: item.color || 'gray' } }),
        {}
      );
      const options: DictOptions = items.map((item: any) => ({ value: item.code, label: item.name }));
      const result = { dictMap, options };
      globalCache.set(category, result);
      setData(result);
    } catch (error) {
      console.error('加载字典数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadDict();
  }, [loadDict]);

  return { ...data, loading };
}

/**
 * 批量加载多个字典数据
 * @param categories 字典分类代码数组
 */
export function useMultiDictData(categories: string[]) {
  const [data, setData] = useState<Record<string, DictData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          categories.map(async (cat) => {
            if (globalCache.has(cat)) {
              return { cat, data: globalCache.get(cat)! };
            }
            const items = await systemApi.getDict(cat);
            const dictMap: DictMap = items.reduce(
              (acc: DictMap, item: any) => ({ ...acc, [item.code]: { label: item.name, color: item.color || 'gray' } }),
              {}
            );
            const options: DictOptions = items.map((item: any) => ({ value: item.code, label: item.name }));
            const result = { dictMap, options };
            globalCache.set(cat, result);
            return { cat, data: result };
          })
        );
        const map: Record<string, DictData> = {};
        results.forEach((r, index) => {
          if (r.status === 'fulfilled') {
            map[r.value.cat] = r.value.data;
          } else {
            console.error(`加载字典 [${categories[index]}] 失败:`, r.reason);
          }
        });
        setData(map);
      } catch (error) {
        console.error('加载字典数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [categories.join(',')]);

  return { data, loading };
}

/**
 * 搜索防抖 Hook
 * @param value 输入值
 * @param delay 延迟毫秒数，默认300ms
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
