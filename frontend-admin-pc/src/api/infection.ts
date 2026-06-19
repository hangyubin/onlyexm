import api from './axios';

export interface KPIData {
  monthlyAvgScore: number;
  monthlyAvgScoreChange: number;
  complianceRate: number;
  complianceRateChange: number;
  lockedCount: number;
  lockedRate: number;
  monthlyPracticeCount: number;
  monthlyPracticeChange: number;
}

export interface DeptRanking {
  department: string;
  correctRate: number;
  rank: number;
}

export interface WeakPoint {
  name: string;
  count: number;
  rate: number;
  children?: WeakPoint[];
}

export interface TrendData {
  month: string;
  avgScore: number;
  participantCount: number;
}

export interface UnqualifiedStaff {
  id: number;
  name: string;
  department: string;
  practiceCount: number;
  correctRate: number;
  isLocked: boolean;
  weakPoints: string[];
}

export const infectionApi = {
  getKPI: async (): Promise<KPIData> => {
    try {
      const response = await api.get('/infection/dashboard/kpi');
      // 转换数据结构
      const data = response.data?.data || response.data;
      return {
        monthlyAvgScore: data?.avgExamScore || 0,
        monthlyAvgScoreChange: 0,
        complianceRate: data?.qualifiedRate || 0,
        complianceRateChange: 0,
        lockedCount: data?.lockedCount || 0,
        lockedRate: 0,
        monthlyPracticeCount: data?.totalPractice || 0,
        monthlyPracticeChange: 0,
      };
    } catch (error) {
      console.error('Get KPI error:', error);
      // 返回默认值
      return {
        monthlyAvgScore: 0,
        monthlyAvgScoreChange: 0,
        complianceRate: 0,
        complianceRateChange: 0,
        lockedCount: 0,
        lockedRate: 0,
        monthlyPracticeCount: 0,
        monthlyPracticeChange: 0,
      };
    }
  },

  getDeptRanking: async (): Promise<DeptRanking[]> => {
    try {
      const response = await api.get('/infection/dashboard/dept-ranking');
      const data = response.data?.data || response.data || [];
      return data.map((item: any, index: number) => ({
        department: item?.name || item?.department || '',
        correctRate: item?.rate || item?.correctRate || 0,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('Get dept ranking error:', error);
      return [];
    }
  },

  getWeakPoints: async (): Promise<WeakPoint[]> => {
    try {
      const response = await api.get('/infection/dashboard/weak-points');
      const data = response.data?.data || response.data || [];
      return data.map((item: any) => ({
        name: item?.name || '',
        count: item?.count || 0,
        rate: item?.value || item?.rate || 0,
      }));
    } catch (error) {
      console.error('Get weak points error:', error);
      return [];
    }
  },

  getTrend: async (months: number = 6): Promise<TrendData[]> => {
    try {
      const response = await api.get('/infection/dashboard/trend', { params: { months } });
      const data = response.data?.data || response.data || [];
      return data.map((item: any) => ({
        month: item?.month || '',
        avgScore: item?.avgScore || 0,
        participantCount: item?.participantCount || item?.totalCount || 0,
      }));
    } catch (error) {
      console.error('Get trend error:', error);
      return [];
    }
  },

  getUnqualifiedStaff: async (page: number = 1, pageSize: number = 20): Promise<{ data: UnqualifiedStaff[]; total: number }> => {
    try {
      const response = await api.get('/infection/unqualified-staff', {
        params: { page, pageSize },
      });
      const data = response.data?.data || response.data || [];
      const total = response.data?.total || 0;
      
      return {
        data: data.map((item: any) => ({
          id: item?.userId || item?.id || 0,
          name: item?.realName || item?.name || '',
          department: item?.department || '',
          practiceCount: item?.completedCount || item?.practiceCount || 0,
          correctRate: item?.accuracyRate || item?.correctRate || 0,
          isLocked: item?.isLocked || false,
          weakPoints: [],
        })),
        total,
      };
    } catch (error) {
      console.error('Get unqualified staff error:', error);
      return {
        data: [],
        total: 0,
      };
    }
  },

  batchNotify: async (ids: number[]): Promise<void> => {
    try {
      await api.post('/infection/notify/batch', { ids });
    } catch (error) {
      console.error('Batch notify error:', error);
      throw error;
    }
  },

  generateReport: async (): Promise<Blob> => {
    try {
      const response = await api.get('/infection/report/pdf', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Generate report error:', error);
      throw error;
    }
  },
};
