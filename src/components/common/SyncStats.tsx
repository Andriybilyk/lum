import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStatsProps {
  successCount: number;
  failureCount: number;
  pendingCount: number;
  lastSyncTime?: number | null;
  className?: string;
}

export const SyncStats = memo(function SyncStats({
  successCount,
  failureCount,
  pendingCount,
  lastSyncTime,
  className = '',
}: SyncStatsProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Успішно</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {successCount}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Очікування</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {pendingCount}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Помилок</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {failureCount}
            </p>
          </div>
        </div>
      </Card>

      {lastSyncTime && (
        <Card className="col-span-full p-4 bg-slate-50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Остання синхронізація:
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formatTime(lastSyncTime)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
});

export default SyncStats;
