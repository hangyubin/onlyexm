import api from './axios';

export interface Question {
  id: number;
  content: string;
  type: string;
  category: string;
  sanjiCategory?: string;
  infectionTag?: string;
  subCategory?: string;
  infectionTags?: string[];
  difficulty: number;
  options: QuestionOption[];
  correctAnswer?: string[];
  analysis: string;
  source?: string;
  standardSource?: string;
  createdAt: string;
}

export interface QuestionOption {
  id?: number;
  key?: string;
  optionKey?: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionListParams {
  content?: string;
  type?: string;
  category?: string;
  infectionTag?: string;
  difficulty?: number;
  page?: number;
  pageSize?: number;
}

export interface QuestionListResponse {
  data: Question[];
  total: number;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  failedDetails: string[];
}

export const questionApi = {
  getList: async (params: QuestionListParams): Promise<QuestionListResponse> => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  create: async (data: Omit<Question, 'id' | 'createdAt'>): Promise<Question> => {
    const response = await api.post('/questions', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Question, 'id' | 'createdAt'>>): Promise<Question> => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/questions/${id}`);
  },

  batchImport: async (file: File): Promise<BatchImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/questions/batch-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/questions/template', {
      responseType: 'blob',
    });
    return response.data;
  },
};
