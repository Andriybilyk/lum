import { useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface MemoizedEmployeeCardProps {
  employee: User;
  onSelect: (id: string) => void;
  onEdit?: (employee: User) => void;
  isSelected?: boolean;
}

const MemoizedEmployeeCardComponent = memo(
  function MemoizedEmployeeCard({
    employee,
    onSelect,
    onEdit,
    isSelected,
  }: MemoizedEmployeeCardProps) {
    const handleSelect = useCallback(() => {
      onSelect(employee.id);
    }, [employee.id, onSelect]);

    const handleEdit = useCallback(() => {
      if (onEdit) {
        onEdit(employee);
      }
    }, [employee, onEdit]);

    return (
      <Card
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
        }`}
        onClick={handleSelect}
      >
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {employee.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {employee.level}
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                ₴{employee.hourlyRate.toFixed(2)}/год
              </p>
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                Редагувати
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.employee.id === nextProps.employee.id &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);

export default MemoizedEmployeeCardComponent;
