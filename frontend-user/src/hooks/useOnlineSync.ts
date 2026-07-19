import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { offlineDB } from '../utils/offlineDB';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  isUnlocked?: boolean;
}

// 指数退避配置（毫秒）
const INITIAL_RETRY_DELAY = 30 * 1000;      // 首次失败后 30s
const MAX_RETRY_DELAY = 5 * 60 * 1000;      // 上限 5 分钟
const MAX_CONSECUTIVE_FAILURES = 10;        // 连续失败 10 次后停止自动重试，等待用户手动触发

export function useOnlineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const isSyncingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      let lastResponse: any = null;

      for (let i = 0; i < pendingRecords.length; i += batchSize) {
        const batch = pendingRecords.slice(i, i + batchSize);

        // 为每条记录生成客户端幂等 ID（与后端 PracticeSyncRecord.clientRecordId 对应）
        // 格式：userId-questionId-timestamp-batchIdx，确保同一条记录重复同步只入库一次
        const syncData = batch.map((record, idx) => ({
          questionId: record.questionId,
          userAnswer: record.userAnswer,
          isCorrect: record.isCorrect,
          timestamp: new Date(record.timestamp).toISOString(),
          clientRecordId:
            (record as any).clientRecordId ||
            `u${userId}-q${record.questionId}-t${new Date(record.timestamp).getTime()}-b${i + idx}`,
        }));

        const response = await api.post(
          '/sync/practice',
          { userId, records: syncData }
        );
        lastResponse = response;

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

      // 同步成功，重置退避计数
      retryCountRef.current = 0;
      setConsecutiveFailures(0);

      return {
        success: true,
        message: `成功同步 ${totalSynced} 条记录`,
        syncedCount: totalSynced,
        isUnlocked: lastResponse?.data?.isUnlocked,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      // 递增失败计数，触发指数退避
      retryCountRef.current += 1;
      setConsecutiveFailures(retryCountRef.current);

      return {
        success: false,
        message: consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
          ? `连续同步失败 ${MAX_CONSECUTIVE_FAILURES} 次，已暂停自动重试，请稍后手动重试`
          : '同步失败，将自动重试',
        syncedCount: 0,
      };
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [checkPendingRecords, consecutiveFailures]);

  // 计算下一次重试延迟（指数退避：30s → 60s → 120s → 240s → ... → 5min）
  const getNextRetryDelay = useCallback(() => {
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current);
    return Math.min(delay, MAX_RETRY_DELAY);
  }, []);

  // 网络状态监听（补 catch，避免首次同步失败被静默吞掉）
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 网络恢复时重置退避计数，立即尝试同步
      retryCountRef.current = 0;
      setConsecutiveFailures(0);
      syncPendingRecords().catch((err) => {
        console.error('网络恢复后首次同步失败:', err);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords]);

  // 初始化检查
  useEffect(() => {
    checkPendingRecords();
  }, [checkPendingRecords]);

  // 指数退避轮询：有待同步数据 + 在线 + 未超过最大失败次数
  useEffect(() => {
    if (pendingCount === 0) return;
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) return;

    // 清理上一次的定时器（可能基于旧的延迟设置）
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const delay = getNextRetryDelay();

    const scheduleNext = () => {
      retryTimerRef.current = setTimeout(async () => {
        if (!navigator.onLine || isSyncingRef.current) {
          // 条件不满足，延后重试
          scheduleNext();
          return;
        }
        await syncPendingRecords();
        // 同步后若仍有 pending，继续调度下一次（syncPendingRecords 内部已更新 pendingCount）
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [pendingCount, consecutiveFailures, getNextRetryDelay, syncPendingRecords]);

  // 手动重试：重置失败计数后立即触发
  const manualRetry = useCallback(async () => {
    retryCountRef.current = 0;
    setConsecutiveFailures(0);
    return syncPendingRecords();
  }, [syncPendingRecords]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount,
    consecutiveFailures,
    hasPausedAutoSync: consecutiveFailures >= MAX_CONSECUTIVE_FAILURES,
    syncPendingRecords,
    manualRetry,
    checkPendingRecords,
  };
}
