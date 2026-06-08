import api from './axios';

export interface ExamRecordItem {
  id: number;
  userId: number;
  userName: string;
  department: string;
  paperId: number;
  paperName: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  time: string;
  score: number | null;
  isPassed: boolean | null;
  tabSwitchCount: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMIT' | 'FORCE_SUBMIT';
  statusLabel: string;
  clientIp: string;
  suspiciousLogCount: number;
}

export interface ExamRecordDetail {
  id: number;
  userName: string;
  department: string;
  paperName: string;
  status: string;
  score: number | null;
  tabSwitchCount: number;
  clientIp: string;
  suspiciousLog: { questionId: number; timeSpent: number; timestamp: string }[];
  answerProgress: { answered: number; total: number; percent: number };
  currentAnswers: { questionId: number; questionIndex: number; content: string; userAnswer: string }[];
}

export interface ExamStats {
  inProgressCount: number;
  todayCompletedCount: number;
  abnormalSwitchCount: number;
  paperDetails: PaperStat[];
  trend: {
    labels: string[];
    data: number[];
  };
}

export interface PaperStat {
  paperId: number;
  paperName: string;
  participantCount: number;
  averageScore: number;
  passRate: number;
}

export interface ExamRecordsResponse {
  items: ExamRecordItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const examApi = {
  getStats: async (): Promise<ExamStats> => {
    const response = await api.get<ExamStats>('/exam/records/stats');
    return response.data;
  },

  getRecords: async (params?: {
    page?: number;
    pageSize?: number;
    paperId?: number;
    keyword?: string;
    status?: string;
  }): Promise<ExamRecordsResponse> => {
    const response = await api.get<ExamRecordsResponse>('/exam/records', { params });
    return response.data;
  },

  forceSubmit: async (examRecordId: number): Promise<void> => {
    await api.post(`/exam/${examRecordId}/force-submit`);
  },

  getRecordDetail: async (examRecordId: number): Promise<ExamRecordDetail> => {
    const response = await api.get<ExamRecordDetail>(`/exam/monitor/${examRecordId}`);
    return response.data;
  },
};
