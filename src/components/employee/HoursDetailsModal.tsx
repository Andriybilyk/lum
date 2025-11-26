import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import MemoizedHoursCard from '@/components/memoized/MemoizedHoursCard';

interface HoursDetailsModalProps {
  open: boolean;
  onClose: () => void;
  month: string;
  year: string;
}

export default function HoursDetailsModal({ open, onClose, month, year }: HoursDetailsModalProps) {
  const { toast } = useToast();
  const { hours, updateHours, deleteHours, loadFromGoogleSheets } = useData();
  const { user } = useUser();
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingHour, setEditingHour] = useState<string | null>(null);
  const [editHourData, setEditHourData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Фільтруємо години для поточного користувача та місяця
  const monthStr = `${year}-${month}`;
  const userHours = hours.filter(h =>
    h.userId === user?.id && h.date && h.date.startsWith(monthStr)
  );

  const totalHours = userHours.reduce((sum, h) => sum + h.hours, 0);
  const totalEarnings = userHours.reduce((sum, h) => sum + h.salary, 0);

  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const handleEditHour = useCallback((entry: any) => {
    setEditingHour(entry.id);
    setEditHourData({
      date: entry.date,
      hours: entry.hours,
      object: entry.object,
      isBusinessTrip: entry.isBusinessTrip
    });
  }, []);

  const handleDeleteHour = useCallback((hoursId: string) => {
    setDeleteConfirm(hoursId);
  }, []);

  const handleSaveHour = async (entryId: string) => {
    setIsLoading(true);
    try {
      const newHours = typeof editHourData.hours === 'string'
        ? parseFloat(editHourData.hours)
        : editHourData.hours;

      // Validation: Check if total hours for the day will exceed 12 hours
      // Calculate daily hours EXCLUDING the current entry being edited
      const otherHoursOnSameDay = hours
        .filter((h) =>
          h.userId === user?.id &&
          h.date === editHourData.date &&
          h.id !== entryId  // Exclude the current entry
        )
        .reduce((sum, h) => sum + h.hours, 0);

      const totalHoursForDay = otherHoursOnSameDay + newHours;

      if (totalHoursForDay > 12) {
        toast({
          title: 'Помилка',
          description: `Перевищено максимум годин на день. Вже відпрацьовано ${otherHoursOnSameDay.toFixed(1)} год. Максимум 12 год/день.`,
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const rate = user?.hourlyRate || 0;
      const salary = newHours * rate * (editHourData.isBusinessTrip ? 1.2 : 1);

      await updateHours(entryId, {
        date: editHourData.date,
        hours: newHours,
        object: editHourData.object,
        isBusinessTrip: editHourData.isBusinessTrip,
        salary
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadFromGoogleSheets();

      toast({
        title: 'Успішно',
        description: 'Запис годин оновлено'
      });

      setEditingHour(null);
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити запис',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsLoading(true);
    try {
      await deleteHours(deleteConfirm);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadFromGoogleSheets();
      
      toast({ 
        title: 'Успішно', 
        description: 'Запис годин видалено'
      });
      
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити запис',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Відпрацьовані Години - {months[parseInt(month) - 1]} {year.padStart(4, '0')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Загальна статистика */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                <p className="text-xs opacity-80">Всього Годин</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
                <p className="text-xs opacity-80">Заробіток</p>
                <p className="text-2xl font-bold">₴{totalEarnings.toFixed(0)}</p>
              </Card>
            </div>

            {/* Деталі по днях */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Деталі по Днях
              </h3>
              {userHours.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Немає записів годин</p>
              ) : (
                userHours.map((entry) => (
                  editingHour === entry.id ? (
                    <Card key={entry.id} className="p-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`hour-date-${entry.id}`} className="text-xs">Дата</Label>
                            <Input
                              id={`hour-date-${entry.id}`}
                              type="date"
                              value={editHourData.date}
                              onChange={(e) => setEditHourData({...editHourData, date: e.target.value})}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`hour-hours-${entry.id}`} className="text-xs">Години</Label>
                            <Input
                              id={`hour-hours-${entry.id}`}
                              type="number"
                              value={editHourData.hours}
                              onChange={(e) => setEditHourData({...editHourData, hours: parseFloat(e.target.value)})}
                              className="h-8"
                              max={12}
                              min={0.5}
                              step={0.5}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`hour-object-${entry.id}`} className="text-xs">Об'єкт</Label>
                          <Input
                            id={`hour-object-${entry.id}`}
                            value={editHourData.object}
                            onChange={(e) => setEditHourData({...editHourData, object: e.target.value})}
                            className="h-8"
                          />
                        </div>
                        {(() => {
                          // Calculate other hours on the same day (excluding current entry)
                          const otherHoursToday = hours
                            .filter((h) =>
                              h.userId === user?.id &&
                              h.date === editHourData.date &&
                              h.id !== entry.id
                            )
                            .reduce((sum, h) => sum + h.hours, 0);
                          const availableHours = 12 - otherHoursToday;

                          return otherHoursToday > 0 ? (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Інші записи на {editHourData.date}: {otherHoursToday.toFixed(1)} год. Доступно: {availableHours.toFixed(1)} год.
                            </p>
                          ) : null;
                        })()}
                        <div className="flex items-center gap-2">
                          <input
                            id={`hour-trip-${entry.id}`}
                            name={`hour-trip-${entry.id}`}
                            type="checkbox"
                            checked={editHourData.isBusinessTrip}
                            onChange={(e) => setEditHourData({...editHourData, isBusinessTrip: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`hour-trip-${entry.id}`} className="text-xs">Відрядження (1.2x)</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveHour(entry.id)}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Зберегти
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingHour(null)}
                            disabled={isLoading}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <MemoizedHoursCard
                      key={entry.id}
                      hours={entry}
                      onEdit={handleEditHour}
                      onDelete={handleDeleteHour}
                      isLoading={isLoading}
                    />
                  )
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Підтвердження Видалення</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити цей запис? Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}