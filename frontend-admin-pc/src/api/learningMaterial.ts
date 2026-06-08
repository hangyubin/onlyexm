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

export interface LearningMaterialListResponse {
  success: boolean;
  data: LearningMaterial[];
  message?: string;
}

export interface LearningMaterialResponse {
  success: boolean;
  data: LearningMaterial;
  message?: string;
}

export const learningMaterialApi = {
  getList: async (params?: LearningMaterialListParams): Promise<LearningMaterialListResponse> => {
    const response = await api.get<LearningMaterialListResponse>('/learning-materials', { params });
    return response.data;
  },

  getById: async (id: number): Promise<LearningMaterialResponse> => {
    const response = await api.get<LearningMaterialResponse>(`/learning-materials/${id}`);
    return response.data;
  },

  create: async (data: Omit<LearningMaterial, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<LearningMaterialResponse> => {
    const response = await api.post<LearningMaterialResponse>('/learning-materials', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<LearningMaterial, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>>): Promise<LearningMaterialResponse> => {
    const response = await api.put<LearningMaterialResponse>(`/learning-materials/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(`/learning-materials/${id}`);
    return response.data;
  },
};
