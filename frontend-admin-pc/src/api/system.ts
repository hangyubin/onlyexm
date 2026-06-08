import request from './axios';

export interface DictItem {
  id: number;
  category: string;
  code: string;
  name: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  remark?: string;
  parentId?: number | null;
  children?: DictItem[];
}

export interface KnowledgeDistributionItem {
  id: number;
  schemeName: string;
  description?: string;
  categoryCode: string;
  categoryName?: string;
  questionCount: number;
  scorePerQuestion: number;
  difficultyFrom: number;
  difficultyTo: number;
  sortOrder: number;
  isActive: boolean;
}

export const systemApi = {
  getDict: async (category: string): Promise<DictItem[]> => {
    const response = await request.get(`/system/dict/${category}`);
    return response.data;
  },

  getDictBatch: async (categories: string[]): Promise<Record<string, DictItem[]>> => {
    const response = await request.get('/system/dict-batch', {
      params: { categories: categories.join(',') },
    });
    return response.data;
  },

  getAllDicts: async (category?: string, keyword?: string): Promise<DictItem[]> => {
    const response = await request.get('/system/dict', {
      params: { category, keyword },
    });
    return response.data;
  },

  createDict: async (data: {
    category: string;
    code: string;
    name: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
    remark?: string;
    parentId?: number | null;
  }): Promise<DictItem> => {
    const response = await request.post('/system/dict', data);
    return response.data;
  },

  updateDict: async (id: number, data: {
    name?: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
    remark?: string;
    parentId?: number | null;
  }): Promise<DictItem> => {
    const response = await request.put(`/system/dict/${id}`, data);
    return response.data;
  },

  deleteDict: async (id: number): Promise<void> => {
    await request.delete(`/system/dict/${id}`);
  },

  initDict: async (categories?: string[]): Promise<{ message: string; created: number; skipped: number }> => {
    const response = await request.post('/system/dict/init', { categories: categories?.join(',') });
    return response.data;
  },

  getKnowledgeDistribution: async (schemeName?: string, isActive?: boolean): Promise<{
    items: KnowledgeDistributionItem[];
    grouped: Record<string, KnowledgeDistributionItem[]>;
  }> => {
    const response = await request.get('/system/knowledge-distribution', {
      params: { schemeName, isActive },
    });
    return response.data;
  },

  createKnowledgeDistribution: async (data: {
    schemeName: string;
    description?: string;
    categoryCode: string;
    categoryName?: string;
    questionCount: number;
    scorePerQuestion: number;
    difficultyFrom: number;
    difficultyTo: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<KnowledgeDistributionItem> => {
    const response = await request.post('/system/knowledge-distribution', data);
    return response.data;
  },

  updateKnowledgeDistribution: async (id: number, data: {
    schemeName?: string;
    description?: string;
    categoryCode?: string;
    categoryName?: string;
    questionCount?: number;
    scorePerQuestion?: number;
    difficultyFrom?: number;
    difficultyTo?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<KnowledgeDistributionItem> => {
    const response = await request.put(`/system/knowledge-distribution/${id}`, data);
    return response.data;
  },

  deleteKnowledgeDistribution: async (id: number): Promise<void> => {
    await request.delete(`/system/knowledge-distribution/${id}`);
  },

  getHospitals: async (): Promise<{ id: number; name: string; level: string }[]> => {
    const response = await request.get('/system/hospitals');
    return response.data;
  },

  createHospital: async (data: { name: string; level?: string }): Promise<{ id: number; name: string; level: string }> => {
    const response = await request.post('/system/hospitals', data);
    return response.data;
  },

  updateHospital: async (id: number, data: { name?: string; level?: string }): Promise<{ id: number; name: string; level: string }> => {
    const response = await request.put(`/system/hospitals/${id}`, data);
    return response.data;
  },

  deleteHospital: async (id: number): Promise<void> => {
    await request.delete(`/system/hospitals/${id}`);
  },

  getConfig: async (): Promise<Record<string, any>> => {
    const response = await request.get('/system/config');
    return response.data;
  },

  saveConfig: async (data: Record<string, any>): Promise<void> => {
    await request.post('/system/config', data);
  },
};

export default systemApi;