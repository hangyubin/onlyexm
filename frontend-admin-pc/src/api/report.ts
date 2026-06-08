import api from './axios';

export interface ExamSummaryParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  examName?: string;
}

export interface ExamSummaryItem {
  id: number;
  realName: string;
  department: string;
  examName: string;
  score: number;
  totalScore: number;
  status: 'PASS' | 'FAIL';
  examTime: string;
}

export interface ExamSummaryResponse {
  items: ExamSummaryItem[];
  passCount: number;
  failCount: number;
  passRate: number;
  averageScore: number;
}

export interface PracticeRecordParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  userId?: number;
}

export interface PracticeRecordItem {
  id: number;
  realName: string;
  department: string;
  practiceName: string;
  score: number;
  totalScore: number;
  practiceTime: string;
  duration: number;
}

export interface InfectionComplianceParams {
  startDate?: string;
  endDate?: string;
  department?: string;
}

export interface InfectionComplianceItem {
  id: number;
  realName: string;
  department: string;
  requirementType: string;
  isCompliant: boolean;
  lastExamDate: string;
  nextExamDate: string;
  score: number;
}

export interface UserStudyParams {
  startDate?: string;
  endDate?: string;
  department?: string;
}

export interface UserStudyItem {
  id: number;
  realName: string;
  department: string;
  totalStudyMinutes: number;
  practiceCount: number;
  wrongQuestionCount: number;
  complianceProgress: number;
}

export const reportApi = {
  getExamSummary: async (params: ExamSummaryParams): Promise<ExamSummaryResponse> => {
    const response = await api.post('/reports/exam-summary/data', params);
    return response.data;
  },

  getPracticeRecords: async (params: PracticeRecordParams): Promise<PracticeRecordItem[]> => {
    const response = await api.post('/reports/practice-records/data', params);
    return response.data.items;
  },

  getInfectionCompliance: async (params: InfectionComplianceParams): Promise<InfectionComplianceItem[]> => {
    const response = await api.post('/reports/infection-compliance/data', params);
    return response.data.items;
  },

  getUserStudy: async (params: UserStudyParams): Promise<UserStudyItem[]> => {
    const response = await api.post('/reports/user-study/data', params);
    return response.data.items;
  },
};
