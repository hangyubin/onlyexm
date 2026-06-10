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

export const learningMaterialApi = {
  getList: async (): Promise<LearningMaterial[]> => {
    const response = await api.get<LearningMaterial[]>('/learning-materials', { params: { isActive: true } });
    return response.data;
  },

  getById: async (id: number): Promise<LearningMaterial> => {
    const response = await api.get<LearningMaterial>(`/learning-materials/${id}`);
    return response.data;
  },
};
