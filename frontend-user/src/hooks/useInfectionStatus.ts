import { useState, useEffect } from 'react';
import api from '../api/axios';

export interface InfectionStatus {
  isLocked: boolean;
  needCount: number;
  currentAccuracy: number;
  requiredCount: number;
  completedCount: number;
  isCompliant: boolean;
}

export function useInfectionStatus() {
  const [status, setStatus] = useState<InfectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus(null);
        setLoading(false);
        return;
      }

      const response = await api.get('/infection/status');
      setStatus(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取院感状态失败');
    } finally {
      setLoading(false);
    }
  };

  const checkUnlock = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, message: '请先登录' };
      }

      const response = await api.post('/infection/check-unlock');
      const data = response.data;

      if (data.success) {
        await fetchStatus();
      }

      return { success: data.success, message: data.message };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : '检查失败' };
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
    checkUnlock,
  };
}
