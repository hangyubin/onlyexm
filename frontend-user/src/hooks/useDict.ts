import { useEffect, useState } from 'react';
import { systemApi, DictItem, DICT_CATEGORY } from '../api/system';

export { DICT_CATEGORY };

export function useDicts(categories: string[]) {
  const [dicts, setDicts] = useState<Record<string, DictItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemApi
      .getDictBatch(categories)
      .then((res) => setDicts(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categories.join(',')]);

  const getName = (category: string, code: string) => {
    const list = dicts[category] || [];
    const item = list.find((x) => x.code === code);
    return item ? item.name : code;
  };

  const getItems = (category: string) => dicts[category] || [];

  return { dicts, loading, getName, getItems };
}
