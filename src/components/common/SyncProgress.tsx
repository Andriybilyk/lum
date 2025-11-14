import { memo } from 'react';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncProgressProps {
  itemsSynced: number;
  totalItems: number;
  isComplete: boolean;
  hasErrors: boolean;
  errorMessage?: string;
  className?: string;
}

export const SyncProgress = memo(function SyncProgress({
  itemsSynced,
  totalItems,
  isComplete,
  hasErrors,
  errorMessage,
  className = '',
}: SyncProgressProps) {
  const progressPercentage = totalItems > 0 ? (itemsSynced / totalItems) * 100 : 0;

  const getStatusColor = () => {
    if (hasErrors) return 'bg-red-500';
    if (isComplete) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (hasErrors) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    if (isComplete) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <Loader className="w-5 h-5 animate-spin text-blue-600" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {itemsSynced} / {totalItems} Синхронізовано
          </span>
        </div>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {errorMessage && (
        <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
});

export default SyncProgress;
