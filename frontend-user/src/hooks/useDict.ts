import { useEffect, useState } from 'react';
import { systemApi, DictItem, DICT_CATEGORY } from '../api/system';

export { DICT_CATEGORY };

export function useDicts(categories: string[]) {
  const [dicts, setDicts] = useState<Record<string, DictItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    systemApi
      .getDictBatch(categories)
      .then((res) => {
        setDicts(res);
        setError(null);
      })
      .catch((err) => {
        console.error('字典加载失败:', err);
        setError('字典加载失败，部分功能可能受限');
      })
      .finally(() => setLoading(false));
  }, [categories.join(',')]);

  const getName = (category: string, code: string) => {
    const list = dicts[category] || [];
    const item = list.find((x) => x.code === code);
    return item ? item.name : code;
  };

  const getItems = (category: string) => dicts[category] || [];

  return { dicts, loading, error, getName, getItems };
}
