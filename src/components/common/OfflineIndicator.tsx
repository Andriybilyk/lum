import { memo } from 'react';
import { WifiOff, Wifi, Loader } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator = memo(function OfflineIndicator({
  className = '',
}: OfflineIndicatorProps) {
  const { isOnline, isSyncing, hasPendingSync, lastSyncTime } = useOffline();

  if (isOnline && !hasPendingSync && !isSyncing) {
    return null;
  }

  const getIcon = () => {
    if (isSyncing) {
      return <Loader className="w-4 h-4 animate-spin text-blue-600" />;
    }

    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-600" />;
    }

    if (hasPendingSync) {
      return <Wifi className="w-4 h-4 text-yellow-600" />;
    }

    return null;
  };

  const getMessage = () => {
    if (isSyncing) {
      return 'Синхронізація...';
    }

    if (!isOnline) {
      return 'Немає інтернету';
    }

    if (hasPendingSync) {
      return 'Очікування синхронізації';
    }

    return '';
  };

  const getBackgroundColor = () => {
    if (isSyncing) {
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
    }

    if (!isOnline) {
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
    }

    if (hasPendingSync) {
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    }

    return '';
  };

  const getTextColor = () => {
    if (isSyncing) {
      return 'text-blue-700 dark:text-blue-300';
    }

    if (!isOnline) {
      return 'text-red-700 dark:text-red-300';
    }

    if (hasPendingSync) {
      return 'text-yellow-700 dark:text-yellow-300';
    }

    return '';
  };

  return (
    <div
      className={`${className} flex items-center gap-2 px-3 py-2 rounded-lg border ${getBackgroundColor()} ${getTextColor()}`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{getMessage()}</span>
      {lastSyncTime && !isSyncing && (
        <span className="text-xs opacity-75">
          {new Date(lastSyncTime).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  );
});

export default OfflineIndicator;
