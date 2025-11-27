import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Briefcase, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import MemoizedProcessCard from '@/components/memoized/MemoizedProcessCard';

interface ProcessDetailsModalProps {
  open: boolean;
  onClose: () => void;
  month: string;
  year: string;
}

export default function ProcessDetailsModal({ open, onClose, month, year }: ProcessDetailsModalProps) {
  const { toast } = useToast();
  const { processes, updateProcess, deleteProcess, loadFromGoogleSheets } = useData();
  const { user } = useUser();
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingProcess, setEditingProcess] = useState<string | null>(null);
  const [editProcessData, setEditProcessData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Фільтруємо процеси для поточного користувача та місяця
  const monthStr = `${year}-${month}`;
  const userProcesses = processes.filter(p =>
    p.userId === user?.id && p.date && p.date.startsWith(monthStr)
  );

  const totalProcesses = userProcesses.length;
  const totalEarnings = userProcesses.reduce((sum, p) => sum + p.salary, 0);

  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const handleEditProcess = useCallback((entry: any) => {
    setEditingProcess(entry.id);
    setEditProcessData({
      date: entry.date,
      processName: entry.processName,
      object: entry.object || '',
      volume: entry.volume,
      unit: entry.unit,
      rate: entry.rate
    });
  }, []);

  const handleDeleteProcess = useCallback((processId: string) => {
    setDeleteConfirm(processId);
  }, []);

  const handleSaveProcess = async (entryId: string) => {
    setIsLoading(true);
    try {
      const volume = typeof editProcessData.volume === 'string' 
        ? parseFloat(editProcessData.volume) 
        : editProcessData.volume;
      const rate = typeof editProcessData.rate === 'string' 
        ? parseFloat(editProcessData.rate) 
        : editProcessData.rate;
      
      const salary = volume * rate;
      
      await updateProcess(entryId, {
        date: editProcessData.date,
        processName: editProcessData.processName,
        object: editProcessData.object,
        volume,
        unit: editProcessData.unit,
        rate,
        salary
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadFromGoogleSheets();
      
      toast({
        title: 'Успішно',
        description: 'Запис процесу оновлено'
      });
      
      setEditingProcess(null);
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
      await deleteProcess(deleteConfirm);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadFromGoogleSheets();
      
      toast({ 
        title: 'Успішно', 
        description: 'Запис процесу видалено'
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
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
              <span className="truncate">Виконані Процеси - {months[parseInt(month) - 1]} {year.padStart(4, '0')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* Загальна статистика */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
                <p className="text-[10px] sm:text-xs opacity-80">Всього Процесів</p>
                <p className="text-xl sm:text-2xl font-bold">{totalProcesses}</p>
              </Card>
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
                <p className="text-[10px] sm:text-xs opacity-80">Заробіток</p>
                <p className="text-xl sm:text-2xl font-bold">₴{totalEarnings.toFixed(0)}</p>
              </Card>
            </div>

            {/* Деталі по процесах */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                Деталі по Процесах
              </h3>
              {userProcesses.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Немає записів процесів</p>
              ) : (
                userProcesses.map((entry) => (
                  editingProcess === entry.id ? (
                    <Card key={entry.id} className="p-4 sm:p-5 border-2 border-purple-200 dark:border-purple-700">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`date-${entry.id}`} className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Дата</Label>
                            <Input
                              id={`date-${entry.id}`}
                              type="date"
                              value={editProcessData.date}
                              onChange={(e) => setEditProcessData({...editProcessData, date: e.target.value})}
                              className="h-11 sm:h-12 mt-1.5 text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`process-${entry.id}`} className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Процес</Label>
                            <Input
                              id={`process-${entry.id}`}
                              value={editProcessData.processName}
                              onChange={(e) => setEditProcessData({...editProcessData, processName: e.target.value})}
                              className="h-11 sm:h-12 mt-1.5 text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`object-${entry.id}`} className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Об'єкт</Label>
                            <Input
                              id={`object-${entry.id}`}
                              value={editProcessData.object || ''}
                              onChange={(e) => setEditProcessData({...editProcessData, object: e.target.value})}
                              className="h-11 sm:h-12 mt-1.5 text-base"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`volume-${entry.id}`} className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Обсяг</Label>
                            <Input
                              id={`volume-${entry.id}`}
                              type="number"
                              value={editProcessData.volume}
                              onChange={(e) => setEditProcessData({...editProcessData, volume: parseFloat(e.target.value)})}
                              className="h-11 sm:h-12 mt-1.5 text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`unit-${entry.id}`} className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Од.</Label>
                            <Input
                              id={`unit-${entry.id}`}
                              value={editProcessData.unit}
                              onChange={(e) => setEditProcessData({...editProcessData, unit: e.target.value})}
                              className="h-11 sm:h-12 mt-1.5 text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`rate-${entry.id}`} className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">Ставка</Label>
                            <Input
                              id={`rate-${entry.id}`}
                              type="number"
                              value={editProcessData.rate}
                              onChange={(e) => setEditProcessData({...editProcessData, rate: parseFloat(e.target.value)})}
                              className="h-11 sm:h-12 mt-1.5 text-base"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={() => handleSaveProcess(entry.id)}
                            disabled={isLoading}
                            className="flex-1 h-11 sm:h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                          >
                            <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Зберегти
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingProcess(null)}
                            disabled={isLoading}
                            className="h-11 sm:h-12 px-4"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <MemoizedProcessCard
                      key={entry.id}
                      process={entry}
                      onEdit={handleEditProcess}
                      onDelete={handleDeleteProcess}
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