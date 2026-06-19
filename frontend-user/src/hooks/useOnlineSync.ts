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

  const checkPendingRecords = useCallback(async () => {
    const records = await offlineDB.getPendingSync();
    setPendingCount(records.length);
    return records.length;
  }, []);

  const syncPendingRecords = useCallback(async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      return { success: false, message: '网络未连接', syncedCount: 0 };
    }

    setIsSyncing(true);

    try {
      const pendingRecords = await offlineDB.getPendingSync();

      if (pendingRecords.length === 0) {
        setIsSyncing(false);
        return { success: true, message: '没有待同步的数据', syncedCount: 0 };
      }

      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!userId) {
        setIsSyncing(false);
        return { success: false, message: '用户ID不存在', syncedCount: 0 };
      }

      const batchSize = 50;
      let totalSynced = 0;
      let isUnlocked = false;

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

        if (response.data.code === 0) {
          totalSynced += response.data.data.syncedCount;
          if (response.data.data.isUnlocked) {
            isUnlocked = true;
          }

          const failedIds: number[] = response.data.data.failedIds || [];
          const syncedIds = batch
            .filter(r => !failedIds.includes(r.questionId))
            .map(r => r.id!)
            .filter(id => id !== undefined);

          await offlineDB.markSynced(syncedIds);
        }
      }

      await checkPendingRecords();
      setLastSyncTime(Date.now());
      setIsSyncing(false);

      return {
        success: true,
        message: `成功同步 ${totalSynced} 条记录`,
        syncedCount: totalSynced,
        isUnlocked,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      setIsSyncing(false);
      return {
        success: false,
        message: '同步失败，请稍后重试',
        syncedCount: 0,
      };
    }
  }, [checkPendingRecords]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncPendingRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords]);

  // 使用 ref 保存 isSyncing，避免定时器因状态变化而重建
  const isSyncingRef = useRef(isSyncing);
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    checkPendingRecords();

    const timer = setInterval(async () => {
      await checkPendingRecords();
      if (navigator.onLine && !isSyncingRef.current) {
        await syncPendingRecords();
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [checkPendingRecords, syncPendingRecords]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    syncPendingRecords,
    checkPendingRecords,
  };
}