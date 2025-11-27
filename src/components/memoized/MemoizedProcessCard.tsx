import { useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import type { Process } from '@/types';

interface MemoizedProcessCardProps {
  process: Process;
  onEdit: (process: Process) => void;
  onDelete: (processId: string) => void;
  isLoading?: boolean;
}

const MemoizedProcessCardComponent = memo(
  function MemoizedProcessCard({
    process,
    onEdit,
    onDelete,
    isLoading = false
  }: MemoizedProcessCardProps) {
    const handleEdit = useCallback(() => {
      onEdit(process);
    }, [process, onEdit]);

    const handleDelete = useCallback(() => {
      onDelete(process.id);
    }, [process.id, onDelete]);

    return (
      <Card className="p-3 sm:p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1.5">
              {process.processName}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
              📅 {process.date}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400">
                {process.volume} {process.unit}
              </p>
              <span className="text-xs sm:text-sm text-slate-400">×</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                ₴{process.rate?.toFixed(0) || (process.volume ? (process.salary / process.volume).toFixed(0) : '0')}
              </p>
              <span className="text-xs sm:text-sm text-slate-400">=</span>
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                ₴{process.salary.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col sm:gap-2 justify-end sm:justify-start">
            <Button
              variant="outline"
              onClick={handleEdit}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 text-sm hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 dark:hover:bg-purple-950/20"
            >
              <Edit2 className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Редагувати</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 text-sm text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Видалити</span>
            </Button>
          </div>
        </div>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.process.id === nextProps.process.id &&
      prevProps.process.date === nextProps.process.date &&
      prevProps.process.volume === nextProps.process.volume &&
      prevProps.process.salary === nextProps.process.salary &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);

export default MemoizedProcessCardComponent;
