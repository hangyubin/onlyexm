import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { offlineDB } from '../utils/offlineDB';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  isUnlocked?: boolean;
}

export function useOnlineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const isSyncingRef = useRef(false);

  const checkPendingRecords = useCallback(async () => {
    const records = await offlineDB.getPendingSync();
    setPendingCount(records.length);
    return records.length;
  }, []);

  const syncPendingRecords = useCallback(async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      return { success: false, message: '网络未连接', syncedCount: 0 };
    }
    if (isSyncingRef.current) {
      return { success: false, message: '正在同步中', syncedCount: 0 };
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const pendingRecords = await offlineDB.getPendingSync();

      if (pendingRecords.length === 0) {
        return { success: true, message: '没有待同步的数据', syncedCount: 0 };
      }

      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!userId) {
        return { success: false, message: '用户ID不存在', syncedCount: 0 };
      }

      const batchSize = 50;
      let totalSynced = 0;

      for (let i = 0; i < pendingRecords.length; i += batchSize) {
        const batch = pendingRecords.slice(i, i + batchSize);
        
        const syncData = batch.map(record => ({
          questionId: record.questionId,
          userAnswer: record.userAnswer,
          isCorrect: record.isCorrect,
          timestamp: new Date(record.timestamp).toISOString(),
        }));

        const response = await api.post(
          '/sync/practice',
          { userId, records: syncData }
        );

        // 拦截器已处理 code/error 并展开 { code, data } → data
        totalSynced += response.data.syncedCount;
        const failedIds: number[] = response.data.failedIds || [];
        const syncedIds = batch
          .filter(r => !failedIds.includes(r.questionId))
          .map(r => r.id!)
          .filter(id => id !== undefined);

        await offlineDB.markSynced(syncedIds);
      }

      await checkPendingRecords();
      setLastSyncTime(Date.now());

      return {
        success: true,
        message: `成功同步 ${totalSynced} 条记录`,
        syncedCount: totalSynced,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        message: '同步失败，请稍后重试',
        syncedCount: 0,
      };
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [checkPendingRecords]);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRecords();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords]);

  // 初始化检查 + 仅在有待同步数据时启动轮询
  useEffect(() => {
    checkPendingRecords();
  }, [checkPendingRecords]);

  useEffect(() => {
    if (pendingCount === 0) return;

    const timer = setInterval(async () => {
      if (!navigator.onLine || isSyncingRef.current) return;
      await syncPendingRecords();
    }, 60000);

    return () => clearInterval(timer);
  }, [pendingCount, syncPendingRecords]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    syncPendingRecords,
    checkPendingRecords,
  };
}