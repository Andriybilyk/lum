import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Edit2, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';

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
  const monthStr = `${year}-${month.padStart(2, '0')}`;
  const userHours = hours.filter(h => 
    h.userId === user?.id && h.date.startsWith(monthStr)
  );

  const totalHours = userHours.reduce((sum, h) => sum + h.hours, 0);
  const totalEarnings = userHours.reduce((sum, h) => sum + h.salary, 0);

  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const handleEditHour = (entry: any) => {
    setEditingHour(entry.id);
    setEditHourData({
      date: entry.date,
      hours: entry.hours,
      object: entry.object,
      isBusinessTrip: entry.isBusinessTrip
    });
  };

  const handleSaveHour = async (entryId: string) => {
    setIsLoading(true);
    try {
      const hours = typeof editHourData.hours === 'string' 
        ? parseFloat(editHourData.hours) 
        : editHourData.hours;
      
      const rate = user?.hourlyRate || 0;
      const salary = hours * rate * (editHourData.isBusinessTrip ? 1.2 : 1);
      
      await updateHours(entryId, {
        date: editHourData.date,
        hours,
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
              Відпрацьовані Години - {months[parseInt(month) - 1]} {year}
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
                  <Card key={entry.id} className="p-3">
                    {editingHour === entry.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Дата</Label>
                            <Input
                              type="date"
                              value={editHourData.date}
                              onChange={(e) => setEditHourData({...editHourData, date: e.target.value})}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Години</Label>
                            <Input
                              type="number"
                              value={editHourData.hours}
                              onChange={(e) => setEditHourData({...editHourData, hours: parseFloat(e.target.value)})}
                              className="h-8"
                              max={12}
                              step={0.5}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Об'єкт</Label>
                          <Input
                            value={editHourData.object}
                            onChange={(e) => setEditHourData({...editHourData, object: e.target.value})}
                            className="h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editHourData.isBusinessTrip}
                            onChange={(e) => setEditHourData({...editHourData, isBusinessTrip: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <Label className="text-xs">Відрядження (1.2x)</Label>
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
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {entry.object}
                            {entry.isBusinessTrip && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                Відрядження 1.2x
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.date}</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                            {entry.hours} год • ₴{entry.salary.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditHour(entry)}
                            disabled={isLoading}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600"
                            onClick={() => setDeleteConfirm(entry.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
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