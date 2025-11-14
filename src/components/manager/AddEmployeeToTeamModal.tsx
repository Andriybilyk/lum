import { logger } from '@/utils/logger';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Loader2 } from 'lucide-react';

interface AddEmployeeToTeamModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddEmployeeToTeamModal({ open, onClose }: AddEmployeeToTeamModalProps) {
  const { user } = useUser();
  const { users, updateUser } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const availableEmployees = useMemo(() => {
    if (!user?.id) return [];
    return users.filter(u =>
      u.role === 'employee' &&
      u.id !== user.id &&
      u.managerId !== user.id
    );
  }, [users, user?.id]);

  const currentTeamEmployees = useMemo(() => {
    if (!user?.id) return [];
    return users.filter(u =>
      u.role === 'employee' &&
      u.managerId === user.id
    );
  }, [users, user?.id]);

  const handleAddEmployee = async (employeeId: string) => {
    const employee = users.find(u => u.id === employeeId);
    if (!employee || !user?.id) return;

    setLoading(true);
    try {
      await updateUser(employeeId, { managerId: user.id });

      toast({
        title: 'Успішно',
        description: `Працівника "${employee.name}" додано до команди`
      });

      onClose();
    } catch (error) {
      logger.error('Error adding employee:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати працівника до команди',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Додати Працівника до Команди</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentTeamEmployees.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                У вашій команді ({currentTeamEmployees.length}):
              </h3>
              <div className="space-y-2">
                {currentTeamEmployees.map((emp) => (
                  <div key={emp.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <p className="font-medium text-slate-800 dark:text-white">{emp.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{emp.level} • ₴{emp.hourlyRate}/год</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            {availableEmployees.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">
                Немає доступних працівників для додавання
              </p>
            ) : (
              <>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Доступні працівники:
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">{emp.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{emp.level} • ₴{emp.hourlyRate}/год</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddEmployee(emp.id)}
                        disabled={loading}
                        className="gap-1 bg-gradient-to-r from-blue-600 to-cyan-500"
                      >
                        {loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Додати
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button variant="outline" onClick={onClose} className="w-full">
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
