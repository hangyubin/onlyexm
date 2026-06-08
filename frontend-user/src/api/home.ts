import api from './axios';
import { systemApi, DictItem } from './system';

export interface InfectionStatus {
  completedCount: number;
  totalCount: number;
  correctRate: number;
  isCompliant: boolean;
  isLocked: boolean;
}

export interface Task {
  id: number;
  type: 'exam' | 'training';
  title: string;
  deadline: string | null;
  status: 'pending' | 'completed' | 'ended';
}

export interface WeakPoint {
  name: string;
  score: number;
}

export const DEFAULT_WEAK_POINTS: WeakPoint[] = [
  { name: '手卫生', score: 75 },
  { name: '隔离防护', score: 60 },
  { name: '消毒灭菌', score: 80 },
  { name: '医疗废物', score: 65 },
  { name: '无菌操作', score: 70 },
  { name: '感染监测', score: 55 }
];

export const fetchDefaultWeakPoints = async (): Promise<WeakPoint[]> => {
  try {
    const tags = await systemApi.getDict('INFECTION_TAG');
    return tags.map((tag: DictItem) => ({
      name: tag.name,
      score: Math.floor(Math.random() * 40) + 40
    }));
  } catch {
    return DEFAULT_WEAK_POINTS;
  }
};

export interface HomeApi {
  getInfectionStatus: () => Promise<InfectionStatus>;
  getTasks: () => Promise<Task[]>;
  completeTask: (taskId: number) => Promise<{ success: boolean }>;
  getWrongCount: () => Promise<{ count: number }>;
  getWeakPoints: () => Promise<WeakPoint[]>;
}

export const homeApi: HomeApi = {
  getInfectionStatus: async (): Promise<InfectionStatus> => {
    const response = await api.get('/home/infection-status');
    return response.data;
  },

  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/home/tasks');
    return response.data;
  },

  completeTask: async (taskId: number): Promise<{ success: boolean }> => {
    const response = await api.post(`/home/tasks/${taskId}/complete`);
    return response.data;
  },

  getWrongCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/home/wrong-count');
    return response.data;
  },

  getWeakPoints: async (): Promise<WeakPoint[]> => {
    try {
      const response = await api.get('/home/weak-points');
      return response.data && response.data.length > 0 ? response.data : await fetchDefaultWeakPoints();
    } catch {
      return await fetchDefaultWeakPoints();
    }
  },
};