import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { AlertCircle } from 'lucide-react';
import { calculateEarnings, calculateDailyHours, getCurrentDate } from '@/utils/calculations';
import { WORK_HOURS, MESSAGES } from '@/utils/constants';

interface LogHoursModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogHoursModal({ open, onClose }: LogHoursModalProps) {
  const { user } = useUser();
  const { objects, hours, addHours } = useData();
  const { error, success } = useNotification();

  const [formData, setFormData] = useState({
    date: getCurrentDate(),
    hours: '',
    object: ''
  });

  const selectedObject = objects.find(o => o.name === formData.object);
  const isBusinessTrip = selectedObject?.isBusinessTrip || false;

  const hoursWorkedToday = calculateDailyHours(hours, user?.id || '', formData.date);

  const hoursValue = parseFloat(formData.hours) || 0;
  const earnings = calculateEarnings({
    hours: hoursValue,
    hourlyRate: user?.hourlyRate || 0,
    hoursWorkedToday,
    isBusinessTrip
  });

  const totalHoursToday = hoursWorkedToday + hoursValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalHoursToday > WORK_HOURS.MAX_DAILY_HOURS) {
      error('Помилка', MESSAGES.ERROR.MAX_HOURS_EXCEEDED);
      return;
    }

    try {
      await addHours({
        userId: user?.id || '',
        date: formData.date,
        hours: hoursValue,
        object: formData.object,
        isBusinessTrip: isBusinessTrip,
        salary: earnings.total
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const overtime = earnings.overtimeHours > 0
        ? ` (${earnings.overtimeHours.toFixed(1)} год понаднормових)`
        : '';

      success(
        'Успішно',
        `Записано ${hoursValue} годин. Заробіток: ₴${earnings.total.toFixed(2)}${overtime}`
      );

      setFormData({
        date: getCurrentDate(),
        hours: '',
        object: ''
      });
      onClose();
    } catch (err) {
      error('Помилка', 'Не вдалося зберегти записи. Спробуйте ще раз.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">📅 Записати Робочі Години</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="date" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Дата</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          {hoursWorkedToday > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                  Сьогодні: <span className="font-bold">{hoursWorkedToday} год</span>
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="object" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Об'єкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger id="object" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 py-1">
                      <span className="font-medium">{obj.name}</span>
                      {obj.isBusinessTrip && (
                        <span className="text-xs sm:text-sm text-orange-600 font-medium">🛫 1.2x</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isBusinessTrip && (
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 mt-1.5 flex items-center gap-1.5 font-medium">
                🛫 Відрядження (1.2x)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="hours" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Годин</Label>
            <Input
              id="hours"
              type="number"
              step={WORK_HOURS.HOUR_STEP}
              max={Math.max(0, WORK_HOURS.MAX_DAILY_HOURS - hoursWorkedToday) || undefined}
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="4.0"
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
              Доступно: <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.max(0, WORK_HOURS.MAX_DAILY_HOURS - hoursWorkedToday).toFixed(1)}</span> / {WORK_HOURS.MAX_DAILY_HOURS} год
            </p>
          </div>

          {formData.hours && formData.object && (
            <>
              {totalHoursToday <= WORK_HOURS.MAX_DAILY_HOURS && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-2">
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Звичайні:</span>
                        <span className="font-semibold text-right">{earnings.normalHours.toFixed(1)} год × ₴{user?.hourlyRate} × {earnings.baseCoefficient}x</span>
                      </div>
                      {earnings.overtimeHours > 0 && (
                        <div className="flex justify-between gap-2 text-orange-600 dark:text-orange-400">
                          <span className="font-medium">Понад:</span>
                          <span className="font-semibold text-right">{earnings.overtimeHours.toFixed(1)} год × ₴{user?.hourlyRate} × {earnings.baseCoefficient}x × 1.5x</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <p className="text-sm sm:text-base font-bold text-green-800 dark:text-green-200">
                      💰 Заробіток: ₴{earnings.total.toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                      За день: {totalHoursToday.toFixed(1)} год
                      {totalHoursToday > WORK_HOURS.NORMAL_HOURS_LIMIT && ` (+${(totalHoursToday - WORK_HOURS.NORMAL_HOURS_LIMIT).toFixed(1)} понад)`}
                    </p>
                  </div>
                </div>
              )}

              {totalHoursToday > WORK_HOURS.MAX_DAILY_HOURS && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <p className="text-sm sm:text-base font-bold text-red-800 dark:text-red-200">
                    ❌ Ліміт! Макс. {WORK_HOURS.MAX_DAILY_HOURS} год/день
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold">
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg active:scale-95 transition-transform"
              disabled={totalHoursToday > WORK_HOURS.MAX_DAILY_HOURS}
            >
              ✓ Зберегти
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}