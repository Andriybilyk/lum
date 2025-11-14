import { useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import type { User as UserType } from '@/types';

interface MemoizedTeamMemberCardProps {
  employee: UserType;
  stats: { totalHours: number; totalEarnings: number };
  isManager: boolean;
  levelLabel: string;
  onEdit: (employee: UserType) => void;
  onView: (employee: UserType) => void;
  onDelete?: (employeeId: string) => void;
}

const MemoizedTeamMemberCardComponent = memo(
  function MemoizedTeamMemberCard({
    employee,
    stats,
    isManager,
    levelLabel,
    onEdit,
    onView,
    onDelete
  }: MemoizedTeamMemberCardProps) {
    const handleEdit = useCallback(() => {
      onEdit(employee);
    }, [employee, onEdit]);

    const handleView = useCallback(() => {
      onView(employee);
    }, [employee, onView]);

    const handleDelete = useCallback(() => {
      if (onDelete) {
        onDelete(employee.id);
      }
    }, [employee.id, onDelete]);

    return (
      <Card
        className={`overflow-hidden ${
          isManager
            ? 'border-2 border-purple-300 dark:border-purple-700'
            : ''
        }`}
      >
        <CardHeader
          className={`pb-3 ${
            isManager
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
              : 'bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  isManager
                    ? 'bg-gradient-to-br from-purple-500 to-pink-400'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                }`}
              >
                {employee.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{employee.name}</CardTitle>
                  {isManager && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                      Менеджер
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {levelLabel} • ₴{employee.hourlyRate}/год
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
              >
                <Edit className="w-3 h-3" />
              </Button>
              {!isManager && onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Годин</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {stats.totalHours.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Заробіток</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  ₴{stats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={handleView}
          >
            <User className="w-4 h-4 mr-2" />
            Детальна Інформація
          </Button>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.employee.id === nextProps.employee.id &&
      prevProps.stats.totalHours === nextProps.stats.totalHours &&
      prevProps.stats.totalEarnings === nextProps.stats.totalEarnings &&
      prevProps.isManager === nextProps.isManager
    );
  }
);

export default MemoizedTeamMemberCardComponent;
