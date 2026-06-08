import api from './axios';

export interface Paper {
  id: number;
  title: string;
  description: string;
  totalScore: number;
  passScore: number;
  duration: number;
  examStartTime: string | null;
  examEndTime: string | null;
  departments: string[];
  status: 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  isPublished: boolean;
  questions: PaperQuestion[];
  questionCount?: number;
  createdAt: string;
}

export interface PaperQuestion {
  questionId: number;
  content: string;
  type: string;
  score: number;
}

export interface SmartGenerateParams {
  title: string;
  description: string;
  duration: number;
  passScore: number;
  departments: string[];
  categoryCounts: Record<string, number>;
  typeCounts: {
    single: number;
    multiple: number;
    judge: number;
    case: number;
  };
  typeScores: {
    single: number;
    multiple: number;
    judge: number;
    case: number;
  };
  difficultyRatio: string;
}

export interface PublishParams {
  isActive?: boolean;
  action?: 'publish' | 'unpublish';
}

export interface PublishResult {
  url: string;
  qrCode: string;
}

export const paperApi = {
  getList: async (params?: { page?: number; pageSize?: number; status?: string }): Promise<{ data: Paper[]; total: number }> => {
    const response = await api.get<{ data: Paper[]; total: number }>('/papers', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Paper> => {
    const response = await api.get<Paper>(`/papers/${id}`);
    return response.data;
  },

  create: async (data: Omit<Paper, 'id' | 'createdAt' | 'questions' | 'questionCount' | 'isActive' | 'isPublished' | 'status'> & { questions: PaperQuestion[] }): Promise<Paper> => {
    const response = await api.post<Paper>('/papers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Paper, 'id' | 'createdAt'>> & { questions?: PaperQuestion[] }): Promise<Paper> => {
    const response = await api.put<Paper>(`/papers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/papers/${id}`);
  },

  smartGenerate: async (params: SmartGenerateParams): Promise<Paper> => {
    const response = await api.post<Paper>('/papers/generate', params);
    return response.data;
  },

  publish: async (id: number, params: PublishParams): Promise<PublishResult> => {
    const response = await api.patch<PublishResult>(`/papers/${id}/publish`, params);
    return response.data;
  },
};
