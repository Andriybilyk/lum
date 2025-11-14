import { useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import type { Hours } from '@/types';

interface MemoizedHoursCardProps {
  hours: Hours;
  onEdit: (hours: Hours) => void;
  onDelete: (hoursId: string) => void;
  isLoading?: boolean;
}

const MemoizedHoursCardComponent = memo(
  function MemoizedHoursCard({
    hours,
    onEdit,
    onDelete,
    isLoading = false
  }: MemoizedHoursCardProps) {
    const handleEdit = useCallback(() => {
      onEdit(hours);
    }, [hours, onEdit]);

    const handleDelete = useCallback(() => {
      onDelete(hours.id);
    }, [hours.id, onDelete]);

    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              {hours.object}
              {hours.isBusinessTrip && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                  Відрядження 1.2x
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{hours.date}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
              {hours.hours} год × ₴{(hours.salary / hours.hours).toFixed(2)}/год = ₴{hours.salary.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
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
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.hours.id === nextProps.hours.id &&
      prevProps.hours.date === nextProps.hours.date &&
      prevProps.hours.hours === nextProps.hours.hours &&
      prevProps.hours.salary === nextProps.hours.salary &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);

export default MemoizedHoursCardComponent;
