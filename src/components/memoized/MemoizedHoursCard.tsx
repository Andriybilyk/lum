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
      <Card className="p-3 sm:p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1.5">
              <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white flex-1 min-w-0">
                {hours.object}
              </p>
              {hours.isBusinessTrip && (
                <span className="flex-shrink-0 text-xs sm:text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg font-medium">
                  🛫 1.2x
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">📅 {hours.date}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                {hours.hours} год
              </p>
              <span className="text-xs sm:text-sm text-slate-400">×</span>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                ₴{(hours.salary / hours.hours).toFixed(2)}/год
              </p>
              <span className="text-xs sm:text-sm text-slate-400">=</span>
              <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                ₴{hours.salary.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col sm:gap-2 justify-end sm:justify-start">
            <Button
              variant="outline"
              onClick={handleEdit}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950/20"
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
      prevProps.hours.id === nextProps.hours.id &&
      prevProps.hours.date === nextProps.hours.date &&
      prevProps.hours.hours === nextProps.hours.hours &&
      prevProps.hours.salary === nextProps.hours.salary &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);

export default MemoizedHoursCardComponent;
