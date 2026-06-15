import api from './axios';

export interface User {
  id: number;
  username: string;
  realName: string;
  role: string;
  department: string;
  hospitalId: number;
  hospitalName: string;
  isLocked: boolean;
  createdAt: string;
}

export interface Hospital {
  id: number;
  name: string;
  code: string;
}

export interface LearningProfile {
  userId: number;
  examRecords: ExamRecord[];
  complianceProgress: number;
  wrongQuestionCount: number;
  totalStudyMinutes: number;
  infectionRequirement: InfectionRequirement | null;
}

export interface ExamRecord {
  id: number;
  paperTitle: string;
  score: number;
  totalScore: number;
  examDate: string;
  status: 'PASS' | 'FAIL';
}

export interface InfectionRequirement {
  id: number;
  userId: number;
  requirementType: string;
  isCompliant: boolean;
  lastExamDate: string;
  nextExamDate: string;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  failedDetails: string[];
}

export interface UserApi {
  getList: (params?: { page?: number; pageSize?: number; search?: string; role?: string; department?: string }) => Promise<{ items: User[]; total: number }>;
  getById: (id: number) => Promise<User>;
  create: (data: Omit<User, 'id' | 'createdAt' | 'hospitalName'> & { password?: string }) => Promise<User>;
  update: (id: number, data: Partial<Omit<User, 'id' | 'createdAt' | 'hospitalName'>>) => Promise<User>;
  delete: (id: number) => Promise<void>;
  resetPassword: (id: number) => Promise<{ tempPassword: string }>;
  toggleLock: (id: number) => Promise<User>;
  getLearningProfile: (id: number) => Promise<LearningProfile>;
  batchImport: (file: File, onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void) => Promise<BatchImportResult>;
  downloadTemplate: () => Promise<Blob>;
  getHospitals: () => Promise<Hospital[]>;
}

export const userApi: UserApi = {
  getList: async (params?: { page?: number; pageSize?: number; search?: string; role?: string; department?: string }): Promise<{ items: User[]; total: number }> => {
    const response = await api.get<{ items: User[]; total: number }>('/users', { params });
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: Omit<User, 'id' | 'createdAt' | 'hospitalName'> & { password?: string }): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<User, 'id' | 'createdAt' | 'hospitalName'>>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  resetPassword: async (id: number): Promise<{ tempPassword: string }> => {
    const response = await api.post<{ tempPassword: string }>(`/users/${id}/reset-password`);
    return response.data;
  },

  toggleLock: async (id: number): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/toggle-lock`);
    return response.data;
  },

  getLearningProfile: async (id: number): Promise<LearningProfile> => {
    const response = await api.get<LearningProfile>(`/users/${id}/learning-profile`);
    return response.data;
  },

  batchImport: async (file: File, onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void): Promise<BatchImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BatchImportResult>('/users/batch-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/users/import-template', {
      responseType: 'blob',
    });
    return response.data;
  },

  getHospitals: async (): Promise<Hospital[]> => {
    const response = await api.get<Hospital[]>('/hospitals');
    return response.data;
  },
};

