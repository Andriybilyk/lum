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
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              {process.processName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {process.date} • {process.volume} {process.unit} × ₴{process.rate?.toFixed(0) || (process.volume ? (process.salary / process.volume).toFixed(0) : '0')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              ₴{process.salary.toFixed(0)}
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                disabled={isLoading}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
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
