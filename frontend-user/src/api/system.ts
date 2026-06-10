import api from './axios';

export interface DictItem {
  id: number;
  category: string;
  code: string;
  name: string;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId?: number | null;
  children?: DictItem[];
}

const baseUrl = '/system';

export const systemApi = {
  getDictByCategory: (category: string) =>
    api.get(`${baseUrl}/dict/${category}`).then((r) => r.data as DictItem[]),

  getDict: (category: string) =>
    api.get(`${baseUrl}/dict/${category}`).then((r) => r.data as DictItem[]),

  getDictBatch: (categories: string[]) =>
    api
      .get(`${baseUrl}/dict-batch`, { params: { categories: categories.join(',') } })
      .then((r) => r.data as Record<string, DictItem[]>),
};

export const DICT_CATEGORY = {
  ROLE: 'ROLE',
  DEPARTMENT: 'DEPARTMENT',
  QUESTION_TYPE: 'QUESTION_TYPE',
  QUESTION_CATEGORY: 'QUESTION_CATEGORY',
  INFECTION_TAG: 'INFECTION_TAG',
  LEARNING_MATERIAL_TYPE: 'LEARNING_MATERIAL_TYPE',
};
