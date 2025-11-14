import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Briefcase, DollarSign, Edit2, Save, X, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, EditHourData, EditProcessData } from '@/types';

interface EmployeeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  employee: User;
}

export default function EmployeeDetailsModal({ open, onClose, employee }: EmployeeDetailsModalProps) {
  const { toast } = useToast();
  const { hours, processes, objects, processTypes, updateHours, deleteHours, updateProcess, deleteProcess, loadFromGoogleSheets } = useData();
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'hour' | 'process', id: string } | null>(null);
  const [editingHour, setEditingHour] = useState<string | null>(null);
  const [editingProcess, setEditingProcess] = useState<string | null>(null);
  const [editHourData, setEditHourData] = useState<EditHourData>({ date: '', hours: 0, object: '', isBusinessTrip: false });
  const [editProcessData, setEditProcessData] = useState<EditProcessData>({ date: '', processName: '', object: '', volume: 0, unit: '', rate: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const empHours = hours.filter(h => h.userId === employee.id);
  const empProcesses = processes.filter(p => p.userId === employee.id);
  const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);
  const totalHourEarnings = empHours.reduce((sum, h) => sum + h.salary, 0);
  const totalProcessEarnings = empProcesses.reduce((sum, p) => sum + p.salary, 0);
  const totalEarnings = totalHourEarnings + totalProcessEarnings;

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
      const hours = editHourData.hours;
      const rate = employee.hourlyRate;

      const salary = hours * rate * (editHourData.isBusinessTrip ? 1.2 : 1);

      await updateHours(entryId, {
        date: editHourData.date,
        hours,
        object: editHourData.object,
        isBusinessTrip: editHourData.isBusinessTrip,
        salary
      });

      // Даємо час на запис в Google Sheets (запит вже відправлено)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEditingHour(null);

      toast({
        title: 'Успішно',
        description: 'Запис годин оновлено та синхронізовано'
      });
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

  const handleEditProcess = (entry: any) => {
    setEditingProcess(entry.id);
    setEditProcessData({
      date: entry.date,
      processName: entry.processName,
      object: entry.object || '',
      volume: entry.volume,
      unit: entry.unit,
      rate: entry.salary / entry.volume
    });
  };

  const handleSaveProcess = async (entryId: string) => {
    setIsLoading(true);
    try {
      const volume = editProcessData.volume;
      const rate = editProcessData.rate;

      const salary = volume * rate;

      await updateProcess(entryId, {
        date: editProcessData.date,
        processName: editProcessData.processName,
        object: editProcessData.object,
        volume,
        unit: editProcessData.unit,
        salary
      });

      // Даємо час на запис в Google Sheets (запит вже відправлено)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEditingProcess(null);

      toast({
        title: 'Успішно',
        description: 'Запис процесу оновлено та синхронізовано'
      });
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
      const type = deleteConfirm.type;

      if (deleteConfirm.type === 'hour') {
        await deleteHours(deleteConfirm.id);
      } else {
        await deleteProcess(deleteConfirm.id);
      }

      // Даємо час на запис в Google Sheets (запит вже відправлено)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDeleteConfirm(null);

      toast({
        title: 'Успішно',
        description: `Запис ${type === 'hour' ? 'годин' : 'процесу'} видалено та синхронізовано`
      });
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

  const handleManualSync = async () => {
    if (editingHour || editingProcess) {
      toast({
        title: 'Увага',
        description: 'Завершіть редагування перед синхронізацією',
        variant: 'destructive'
      });
      return;
    }

    setIsSyncing(true);
    try {
      await loadFromGoogleSheets();
      toast({
        title: 'Синхронізовано',
        description: 'Дані успішно оновлено з Google Sheets'
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося синхронізувати дані',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                Детальна Інформація - {employee.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing || !!editingHour || !!editingProcess}
                className="gap-2"
                title={editingHour || editingProcess ? 'Завершіть редагування перед синхронізацією' : 'Оновити дані з Google Sheets'}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Синхронізація...' : 'Оновити'}
              </Button>
            </div>
          </DialogHeader>

          {/* Загальна статистика */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
              <Clock className="w-4 h-4 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
              <p className="text-xs opacity-80">Годин</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
              <Briefcase className="w-4 h-4 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{empProcesses.length}</p>
              <p className="text-xs opacity-80">Процесів</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
              <DollarSign className="w-4 h-4 mb-1 opacity-80" />
              <p className="text-2xl font-bold">₴{(totalEarnings / 1000).toFixed(1)}k</p>
              <p className="text-xs opacity-80">Заробіток</p>
            </Card>
          </div>

          <Tabs defaultValue="hours" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hours">Години</TabsTrigger>
              <TabsTrigger value="processes">Процеси</TabsTrigger>
            </TabsList>

            <TabsContent value="hours" className="space-y-2 mt-4">
              {empHours.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Немає записів годин</p>
              ) : (
                empHours.map((entry) => {
                  const selectedObject = objects.find(o => o.name === editHourData.object);
                  const isBusinessTrip = selectedObject?.isBusinessTrip || false;

                  return (
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
                            <Select
                              value={editHourData.object}
                              onValueChange={(value) => {
                                const obj = objects.find(o => o.name === value);
                                setEditHourData({
                                  ...editHourData, 
                                  object: value,
                                  isBusinessTrip: obj?.isBusinessTrip || false
                                });
                              }}
                            >
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue placeholder="Оберіть об'єкт" />
                              </SelectTrigger>
                              <SelectContent>
                                {objects.map((obj) => (
                                  <SelectItem key={obj.id} value={obj.name}>
                                    <div className="flex items-center gap-2">
                                      {obj.name}
                                      {obj.isBusinessTrip && (
                                        <span className="text-xs text-orange-600">🛫</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isBusinessTrip && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                🛫 Відрядження (коефіцієнт 1.2x)
                              </p>
                            )}
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
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {entry.date}
                            </p>
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
                              onClick={() => setDeleteConfirm({ type: 'hour', id: entry.id })}
                              disabled={isLoading}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="processes" className="space-y-2 mt-4">
              {empProcesses.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Немає записів процесів</p>
              ) : (
                empProcesses.map((entry) => (
                  <Card key={entry.id} className="p-3">
                    {editingProcess === entry.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Дата</Label>
                            <Input
                              type="date"
                              value={editProcessData.date}
                              onChange={(e) => setEditProcessData({...editProcessData, date: e.target.value})}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Об'єкт</Label>
                            <Select
                              value={editProcessData.object}
                              onValueChange={(value) => setEditProcessData({
                                ...editProcessData,
                                object: value,
                                processName: '',
                                unit: '',
                                rate: 0
                              })}
                            >
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue placeholder="Оберіть об'єкт" />
                              </SelectTrigger>
                              <SelectContent>
                                {objects.map((obj) => (
                                  <SelectItem key={obj.id} value={obj.name}>
                                    {obj.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Процес</Label>
                          <Select
                            value={editProcessData.processName}
                            onValueChange={(value) => {
                              const process = processTypes.find(p => p.name === value);
                              if (process) {
                                setEditProcessData({
                                  ...editProcessData,
                                  processName: value,
                                  unit: process.unit,
                                  rate: process.rate
                                });
                              }
                            }}
                            disabled={!editProcessData.object}
                          >
                            <SelectTrigger className="h-8 mt-1">
                              <SelectValue placeholder={editProcessData.object ? "Оберіть процес" : "Спочатку оберіть об'єкт"} />
                            </SelectTrigger>
                            <SelectContent>
                              {processTypes
                                .filter(p => !editProcessData.object || p.object === editProcessData.object)
                                .map((process) => (
                                  <SelectItem key={process.id} value={process.name}>
                                    {process.name} - ₴{process.rate}/{process.unit}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Обсяг</Label>
                            <Input
                              type="number"
                              value={editProcessData.volume}
                              onChange={(e) => setEditProcessData({...editProcessData, volume: parseFloat(e.target.value)})}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Одиниця</Label>
                            <Input
                              value={editProcessData.unit}
                              readOnly
                              className="h-8 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Ставка</Label>
                            <Input
                              type="number"
                              value={editProcessData.rate}
                              readOnly
                              className="h-8 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveProcess(entry.id)}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Зберегти
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingProcess(null)}
                            disabled={isLoading}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{entry.processName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {entry.date}{entry.object ? ` • ${entry.object}` : ''}
                          </p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                            {entry.volume} {entry.unit} × ₴{entry.rate?.toFixed(2) || (entry.volume ? (entry.salary / entry.volume).toFixed(2) : 0)} = ₴{entry.salary}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditProcess(entry)}
                            disabled={isLoading}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600"
                            onClick={() => setDeleteConfirm({ type: 'process', id: entry.id })}
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
            </TabsContent>
          </Tabs>

          <Button onClick={onClose} className="w-full mt-4">
            Закрити
          </Button>
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