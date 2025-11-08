import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';

interface LogHoursModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogHoursModal({ open, onClose }: LogHoursModalProps) {
  const { user } = useUser();
  const { objects, hours, addHours } = useData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    object: ''
  });

  // Визначаємо чи об'єкт є відрядженням
  const selectedObject = objects.find(o => o.name === formData.object);
  const isBusinessTrip = selectedObject?.isBusinessTrip || false;

  // Підрахунок годин вже відпрацьованих сьогодні
  const hoursWorkedToday = hours
    .filter(h => h.userId === user?.id && h.date === formData.date)
    .reduce((sum, h) => sum + h.hours, 0);

  const calculateEarnings = () => {
    const hoursValue = parseFloat(formData.hours);
    if (isNaN(hoursValue) || !formData.object) return { total: 0, normalHours: 0, overtimeHours: 0, baseCoefficient: 1 };

    const rate = user?.hourlyRate || 0;
    const baseCoefficient = isBusinessTrip ? 1.2 : 1.0;

    // Розрахунок понаднормових годин
    const totalHoursToday = hoursWorkedToday + hoursValue;
    let normalHours = hoursValue;
    let overtimeHours = 0;

    if (totalHoursToday > 8) {
      const normalLimit = Math.max(0, 8 - hoursWorkedToday);
      normalHours = Math.min(hoursValue, normalLimit);
      overtimeHours = hoursValue - normalHours;
    }

    // Розрахунок заробітку
    const normalEarnings = normalHours * rate * baseCoefficient;
    const overtimeEarnings = overtimeHours * rate * baseCoefficient * 1.5;

    return {
      total: normalEarnings + overtimeEarnings,
      normalHours,
      overtimeHours,
      baseCoefficient
    };
  };

  const earnings = calculateEarnings();
  const totalHoursToday = hoursWorkedToday + (parseFloat(formData.hours) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hoursValue = parseFloat(formData.hours);
    
    if (totalHoursToday > 12) {
      toast({
        title: 'Помилка',
        description: 'Максимум 12 годин на день в сумі по всіх об\'єктах',
        variant: 'destructive'
      });
      return;
    }

    await addHours({
      userId: user?.id || '',
      date: formData.date,
      hours: hoursValue,
      object: formData.object,
      isBusinessTrip: isBusinessTrip,
      salary: earnings.total
    });

    toast({
      title: 'Успішно',
      description: `Записано ${hoursValue} годин. Заробіток: ₴${earnings.total.toFixed(2)}${
        earnings.overtimeHours > 0 ? ` (${earnings.overtimeHours} год понаднормових)` : ''
      }`
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      object: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Записати Робочі Години</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Дата</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          {hoursWorkedToday > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Вже відпрацьовано сьогодні: <span className="font-semibold">{hoursWorkedToday} год</span>
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="object">Об'єкт/Проєкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent>
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name}>
                    <div className="flex items-center gap-2">
                      {obj.name}
                      {obj.isBusinessTrip && (
                        <span className="text-xs text-orange-600">🛫 Відрядження</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isBusinessTrip && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                🛫 Цей об'єкт рахується як відрядження (коефіцієнт 1.2x)
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="businessTrip"
              checked={isBusinessTrip}
              onChange={(e) => setFormData({ ...formData, isBusinessTrip: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="businessTrip" className="cursor-pointer">
              Відрядження (коефіцієнт 1.2x)
            </Label>
          </div>

          <div>
            <Label htmlFor="hours">Відпрацьовано Годин</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              max={12 - hoursWorkedToday}
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="4.0"
              required
              className="mt-1.5"
            />
            <p className="text-xs text-slate-500 mt-1">
              Доступно: {(12 - hoursWorkedToday).toFixed(1)} год (макс. 12 год/день)
            </p>
          </div>

          {formData.hours && formData.object && totalHoursToday <= 12 && (
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Звичайні години:</span>
                    <span className="font-medium">{earnings.normalHours.toFixed(1)} год × ₴{user?.hourlyRate} × {earnings.baseCoefficient}x</span>
                  </div>
                  {earnings.overtimeHours > 0 && (
                    <div className="flex justify-between text-orange-600 dark:text-orange-400">
                      <span>Понаднормові години:</span>
                      <span className="font-medium">{earnings.overtimeHours.toFixed(1)} год × ₴{user?.hourlyRate} × {earnings.baseCoefficient}x × 1.5x</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Очікуваний Заробіток: ₴{earnings.total.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Всього за день: {totalHoursToday.toFixed(1)} год
                  {totalHoursToday > 8 && ` (${(totalHoursToday - 8).toFixed(1)} год понаднормових)`}
                </p>
              </div>
            </div>
          )}

          {totalHoursToday > 12 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Перевищено ліміт! Максимум 12 годин на день
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Скасувати
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500"
              disabled={totalHoursToday > 12}
            >
              Зберегти
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}