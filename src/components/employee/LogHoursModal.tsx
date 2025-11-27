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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <Label htmlFor="date" className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Дата</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
            />
          </div>

          {hoursWorkedToday > 0 && (
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm sm:text-base font-medium text-blue-800 dark:text-blue-200">
                  Вже відпрацьовано сьогодні: <span className="font-bold text-base sm:text-lg">{hoursWorkedToday} год</span>
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="object" className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Об'єкт/Проєкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger id="object" className="mt-2 h-12 sm:h-14 text-base sm:text-lg">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name} className="h-12 sm:h-14 text-base sm:text-lg cursor-pointer">
                    <div className="flex items-center gap-2">
                      {obj.name}
                      {obj.isBusinessTrip && (
                        <span className="text-sm sm:text-base text-orange-600 font-medium">🛫 Відрядження</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isBusinessTrip && (
              <p className="text-sm sm:text-base text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-2 font-medium">
                🛫 Цей об'єкт рахується як відрядження (коефіцієнт 1.2x)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="hours" className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Відпрацьовано Годин</Label>
            <Input
              id="hours"
              type="number"
              step={WORK_HOURS.HOUR_STEP}
              max={Math.max(0, WORK_HOURS.MAX_DAILY_HOURS - hoursWorkedToday) || undefined}
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="4.0"
              required
              className="mt-2 h-12 sm:h-14 text-base sm:text-lg"
            />
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Доступно: <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.max(0, WORK_HOURS.MAX_DAILY_HOURS - hoursWorkedToday).toFixed(1)} год</span> (макс. {WORK_HOURS.MAX_DAILY_HOURS} год/день)
            </p>
          </div>

          {formData.hours && formData.object && (
            <>
              {totalHoursToday <= WORK_HOURS.MAX_DAILY_HOURS && (
                <div className="space-y-3">
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2">
                    <div className="space-y-2 text-sm sm:text-base">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Звичайні години:</span>
                        <span className="font-semibold text-right">{earnings.normalHours.toFixed(1)} год × ₴{user?.hourlyRate} × {earnings.baseCoefficient}x</span>
                      </div>
                      {earnings.overtimeHours > 0 && (
                        <div className="flex justify-between gap-3 text-orange-600 dark:text-orange-400">
                          <span className="font-medium">Понаднормові:</span>
                          <span className="font-semibold text-right">{earnings.overtimeHours.toFixed(1)} год × ₴{user?.hourlyRate} × {earnings.baseCoefficient}x × 1.5x</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                    <p className="text-base sm:text-lg font-bold text-green-800 dark:text-green-200">
                      💰 Очікуваний Заробіток: ₴{earnings.total.toFixed(2)}
                    </p>
                    <p className="text-sm sm:text-base text-green-600 dark:text-green-400 mt-2 font-medium">
                      Всього за день: {totalHoursToday.toFixed(1)} год
                      {totalHoursToday > WORK_HOURS.NORMAL_HOURS_LIMIT && ` (${(totalHoursToday - WORK_HOURS.NORMAL_HOURS_LIMIT).toFixed(1)} год понаднормових)`}
                    </p>
                  </div>
                </div>
              )}

              {totalHoursToday > WORK_HOURS.MAX_DAILY_HOURS && (
                <div className="p-4 sm:p-5 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                  <p className="text-base sm:text-lg font-bold text-red-800 dark:text-red-200">
                    ❌ Перевищено ліміт! Максимум {WORK_HOURS.MAX_DAILY_HOURS} годин на день
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold">
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg active:scale-95 transition-transform"
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