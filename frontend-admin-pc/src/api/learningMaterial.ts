import api from './axios';

export interface LearningMaterial {
  id: number;
  title: string;
  description?: string;
  type: 'ARTICLE' | 'VIDEO' | 'PDF' | 'DOC' | 'EXCEL' | 'PPT';
  content: string;
  category?: string;
  thumbnailUrl?: string;
  attachmentUrl?: string;
  viewCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningMaterialListParams {
  category?: string;
  type?: string;
  isActive?: boolean;
  keyword?: string;
}

export const learningMaterialApi = {
  getList: async (params?: LearningMaterialListParams): Promise<LearningMaterial[]> => {
    const response = await api.get<LearningMaterial[]>('/learning-materials', { params });
    return response.data;
  },

  getById: async (id: number): Promise<LearningMaterial> => {
    const response = await api.get<LearningMaterial>(`/learning-materials/${id}`);
    return response.data;
  },

  create: async (data: Omit<LearningMaterial, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<LearningMaterial> => {
    const response = await api.post<LearningMaterial>('/learning-materials', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<LearningMaterial, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>>): Promise<LearningMaterial> => {
    const response = await api.put<LearningMaterial>(`/learning-materials/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete<{ success: boolean; message?: string }>(`/learning-materials/${id}`);
    return response.data;
  },
};
