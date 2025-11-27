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
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">👥 Додати Працівника до Команди</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5">
          {currentTeamEmployees.length > 0 && (
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                У вашій команді ({currentTeamEmployees.length}):
              </h3>
              <div className="space-y-2">
                {currentTeamEmployees.map((emp) => (
                  <div key={emp.id} className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-base sm:text-lg text-slate-800 dark:text-white">{emp.name}</p>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">{emp.level} • ₴{emp.hourlyRate}/год</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 sm:pt-5">
            {availableEmployees.length === 0 ? (
              <p className="text-center text-slate-500 text-base sm:text-lg py-6 sm:py-8">
                Немає доступних працівників для додавання
              </p>
            ) : (
              <>
                <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Доступні працівники:
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                  {availableEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base sm:text-lg text-slate-800 dark:text-white truncate">{emp.name}</p>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{emp.level} • ₴{emp.hourlyRate}/год</p>
                      </div>
                      <Button
                        onClick={() => handleAddEmployee(emp.id)}
                        disabled={loading}
                        className="gap-2 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg active:scale-95 transition-transform flex-shrink-0"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        Додати
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button variant="outline" onClick={onClose} className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold">
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
