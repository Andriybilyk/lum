import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';

interface Reminder {
  id: string;
  date: string;
  description: string;
  type: 'today' | 'tomorrow' | 'upcoming';
  assignedBy: string;
  assignedTo: string;
  status: 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed';
  notes: string;
  employeeConfirmed: boolean;
  managerConfirmed: boolean;
}

export default function WorkReminders() {
  const { toast } = useToast();
  const { assignments, updateAssignment, users } = useData();
  const { user } = useUser();
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [confirmedReminders, setConfirmedReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!user) return;

    // Фільтруємо призначення для поточного користувача
    const userAssignments = assignments.filter(a => {
      // Показуємо призначення де користувач є або працівником, або менеджером
      return a.employeeId === user.id || a.managerId === user.id;
    });

    // Конвертуємо призначення в нагадування
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

    const pending: Reminder[] = [];
    const confirmed: Reminder[] = [];

    userAssignments.forEach(assignment => {
      const assignedByUser = users.find(u => u.id === assignment.managerId);
      const assignedToUser = users.find(u => u.id === assignment.employeeId);
      
      let type: 'today' | 'tomorrow' | 'upcoming' = 'upcoming';
      if (assignment.date === today) {
        type = 'today';
      } else if (assignment.date === tomorrow) {
        type = 'tomorrow';
      }

      // Визначаємо чи підтвердили обидві сторони
      let employeeConfirmed = false;
      let managerConfirmed = false;
      let fullyConfirmed = false;

      if (assignment.status === 'confirmed') {
        // Повністю підтверджено
        employeeConfirmed = true;
        managerConfirmed = true;
        fullyConfirmed = true;
      } else if (assignment.status === 'employee_confirmed') {
        employeeConfirmed = true;
      } else if (assignment.status === 'manager_confirmed') {
        managerConfirmed = true;
      }

      const reminder: Reminder = {
        id: assignment.id,
        date: assignment.date,
        description: assignment.description,
        type,
        assignedBy: assignedByUser?.name || 'Невідомо',
        assignedTo: assignedToUser?.name || 'Невідомо',
        status: assignment.status,
        notes: assignment.notes,
        employeeConfirmed,
        managerConfirmed,
      };

      if (fullyConfirmed) {
        confirmed.push(reminder);
      } else if (assignment.status !== 'declined') {
        pending.push(reminder);
      }
    });

    // Сортуємо за датою
    pending.sort((a, b) => a.date.localeCompare(b.date));
    confirmed.sort((a, b) => a.date.localeCompare(b.date));

    setReminders(pending);
    setConfirmedReminders(confirmed);
  }, [assignments, user, users]);

  const handleConfirm = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      // Знаходимо оригінальне призначення
      const assignment = assignments.find(a => a.id === id);
      if (!assignment) return;

      // Якщо менеджер призначив завдання собі - одразу повністю підтверджуємо
      const isSelfAssignment = assignment.employeeId === assignment.managerId;
      
      let newStatus: 'confirmed' | 'declined' = 'confirmed';
      
      if (isSelfAssignment) {
        // Самопризначення - одразу підтверджуємо
        newStatus = 'confirmed';
      } else if (user?.role === 'employee') {
        // Якщо менеджер вже підтвердив, то повністю підтверджуємо
        if (reminder.managerConfirmed) {
          newStatus = 'confirmed';
        } else {
          // Інакше позначаємо що працівник підтвердив
          newStatus = 'employee_confirmed' as any;
        }
      } else if (user?.role === 'manager') {
        // Якщо працівник вже підтвердив, то повністю підтверджуємо
        if (reminder.employeeConfirmed) {
          newStatus = 'confirmed';
        } else {
          // Інакше позначаємо що менеджер підтвердив
          newStatus = 'manager_confirmed' as any;
        }
      }

      await updateAssignment(id, newStatus);
      
      const isFullyConfirmed = newStatus === 'confirmed';
      
      toast({
        title: isFullyConfirmed ? '✅ Завдання Повністю Підтверджено' : '⏳ Очікується Підтвердження',
        description: isFullyConfirmed 
          ? `"${reminder.description}" - ${isSelfAssignment ? 'ви підтвердили' : 'обидві сторони підтвердили'}`
          : `"${reminder.description}" - ви підтвердили, очікується підтвердження від ${user?.role === 'employee' ? 'менеджера' : 'працівника'}`,
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося підтвердити завдання',
        variant: 'destructive'
      });
    }
  };

  const handleDecline = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      await updateAssignment(id, 'declined');
      
      toast({
        title: 'Завдання Відхилено',
        description: `"${reminder.description}" - ви відхилили завдання`,
        variant: 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося відхилити завдання',
        variant: 'destructive'
      });
    }
  };

  // Якщо немає нагадувань взагалі - не показуємо компонент
  if (reminders.length === 0 && confirmedReminders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Підтверджені нагадування */}
      {confirmedReminders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            ✅ Підтверджені Завдання
          </h3>
          {confirmedReminders.map((reminder) => {
            const isToday = reminder.type === 'today';
            const isTomorrow = reminder.type === 'tomorrow';
            
            return (
              <Alert
                key={reminder.id}
                className={`border-l-4 ${
                  isToday 
                    ? 'border-l-green-600 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/40 dark:to-emerald-950/40 shadow-md'
                    : isTomorrow
                    ? 'border-l-green-500 bg-green-100 dark:bg-green-950/30 shadow-sm'
                    : 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className={`w-5 h-5 mt-0.5 ${
                    isToday 
                      ? 'text-green-700 dark:text-green-300 animate-pulse'
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                  <div className="flex-1">
                    <AlertDescription className={`text-sm font-medium ${
                      isToday 
                        ? 'text-green-900 dark:text-green-100 font-bold'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {isToday ? '🔔 СЬОГОДНІ - ВИХІД НА Р��БОТУ!' : isTomorrow ? '📅 Завтра - Вихід на роботу' : '📆 ' + reminder.date}: {reminder.description}
                    </AlertDescription>
                    {reminder.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <strong>Примітки:</strong> {reminder.notes}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {user?.role === 'manager' 
                        ? `Працівник: ${reminder.assignedTo}`
                        : `Менеджер: ${reminder.assignedBy}`
                      }
                    </p>
                    {isToday && (
                      <div className="mt-2 px-2 py-1 bg-green-200 dark:bg-green-900/50 rounded text-xs font-semibold text-green-900 dark:text-green-100">
                        ⚠️ Не забудьте вийти на роботу сьогодні!
                      </div>
                    )}
                    {isTomorrow && (
                      <div className="mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs font-medium text-green-800 dark:text-green-200">
                        📌 Підготуйтеся до виходу на роботу завтра
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Очікуючі нагадування */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            📋 Призначені Завдання
          </h3>
          {reminders.map((reminder) => {
            const isToday = reminder.type === 'today';
            const isTomorrow = reminder.type === 'tomorrow';
            const needsMyConfirmation = user?.role === 'employee' 
              ? !reminder.employeeConfirmed 
              : !reminder.managerConfirmed;
            const waitingForOther = user?.role === 'employee'
              ? reminder.employeeConfirmed && !reminder.managerConfirmed
              : reminder.managerConfirmed && !reminder.employeeConfirmed;
            
            return (
              <Alert
                key={reminder.id}
                className={`border-l-4 ${
                  isToday
                    ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
                    : isTomorrow
                    ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                    : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {isToday ? (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    ) : isTomorrow ? (
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    ) : (
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {reminder.description}
                      </AlertDescription>
                      {reminder.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          <strong>Примітки:</strong> {reminder.notes}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {isToday ? 'Сьогодні' : isTomorrow ? 'Завтра' : reminder.date} • 
                        {user?.role === 'manager' 
                          ? ` Працівник: ${reminder.assignedTo}`
                          : ` Менеджер: ${reminder.assignedBy}`
                        }
                      </p>
                      {waitingForOther && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          ⏳ Очікується підтвердження від {user?.role === 'employee' ? 'менеджера' : 'працівника'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {needsMyConfirmation && (
                    <div className="flex gap-2 ml-8">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirm(reminder.id)}
                        className="flex-1 h-8 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:text-green-400 dark:border-green-800"
                      >
                        ✓ Підтвердити
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(reminder.id)}
                        className="flex-1 h-8 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800"
                      >
                        ✗ Відхилити
                      </Button>
                    </div>
                  )}
                </div>
              </Alert>
            );
          })}
        </div>
      )}
    </div>
  );
}