import { RefreshCw, CloudOff, Cloud } from 'lucide-react';

interface SyncStatusBadgeProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  onSync?: () => void;
}

export function SyncStatusBadge({ isOnline, isSyncing, pendingCount, onSync }: SyncStatusBadgeProps) {
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full text-gray-600 text-sm">
        <CloudOff className="w-4 h-4" />
        <span>离线模式</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full text-blue-600 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>同步中...</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-full text-amber-600 text-sm">
        <Cloud className="w-4 h-4" />
        <span>有 {pendingCount} 条记录待同步</span>
        <button
          onClick={onSync}
          className="ml-1 p-1 hover:bg-amber-100 rounded-full transition-colors"
          title="立即同步"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full text-green-600 text-sm">
      <Cloud className="w-4 h-4" />
      <span>数据已同步</span>
    </div>
  );
}