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

/** 下载 Excel 文件 */
async function downloadExcel(url: string, params: Record<string, any>, filename: string): Promise<void> {
  const response = await api.post(url, params, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
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

  // Excel 导出接口
  downloadExamSummary: async (startDate: string, endDate: string): Promise<void> => {
    return downloadExcel('/reports/exam-summary', { startDate, endDate }, `exam_summary_${startDate}_${endDate}.xlsx`);
  },

  downloadUnqualifiedStaff: async (): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    return downloadExcel('/reports/unqualified-staff', {}, `unqualified_staff_${today}.xlsx`);
  },

  downloadDeptRanking: async (startDate: string, endDate: string): Promise<void> => {
    return downloadExcel('/reports/dept-ranking', { startDate, endDate }, `dept_ranking_${startDate}_${endDate}.xlsx`);
  },

  downloadQuestionErrorRate: async (): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    return downloadExcel('/reports/question-error-rate', {}, `question_error_rate_${today}.xlsx`);
  },

  downloadActivity: async (startDate: string, endDate: string): Promise<void> => {
    return downloadExcel('/reports/activity', { startDate, endDate }, `activity_report_${startDate}_${endDate}.xlsx`);
  },
};
