import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit2, Copy } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface ObjectProcessesModalProps {
  open: boolean;
  onClose: () => void;
  objectId: string;
  objectName: string;
}

export default function ObjectProcessesModal({
  open,
  onClose,
  objectId,
  objectName
}: ObjectProcessesModalProps) {
  const { processTypes, addProcessType, updateProcessType, deleteProcessType } = useData();
  const { toast } = useToast();
  
  const [newProcess, setNewProcess] = useState({
    name: '',
    rate: '',
    unit: '',
    plannedVolume: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProcess, setEditingProcess] = useState({
    name: '',
    rate: '',
    unit: '',
    plannedVolume: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedStandardProcess, setSelectedStandardProcess] = useState<string>('');

  // Фільтруємо процеси які відносяться до цього об'єкта
  const objectProcesses = processTypes.filter(p => p.object === objectName);

  // Стандартні процеси (без прив'язки до об'єкта)
  const standardProcesses = processTypes.filter(p => !p.object || p.object === '');

  const totalAmount = newProcess.rate && newProcess.plannedVolume 
    ? parseFloat(newProcess.rate) * parseFloat(newProcess.plannedVolume)
    : 0;

  const editTotalAmount = editingProcess.rate && editingProcess.plannedVolume 
    ? parseFloat(editingProcess.rate) * parseFloat(editingProcess.plannedVolume)
    : 0;

  const handleAddProcess = async () => {
    if (!newProcess.name || !newProcess.rate || !newProcess.unit || !newProcess.plannedVolume) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі поля',
        variant: 'destructive'
      });
      return;
    }

    await addProcessType({
      name: newProcess.name,
      object: objectName,
      rate: parseFloat(newProcess.rate),
      unit: newProcess.unit,
      plannedVolume: parseFloat(newProcess.plannedVolume)
    });

    toast({
      title: 'Успішно',
      description: `Процес "${newProcess.name}" додано до об'єкта "${objectName}"\nЗаплановано: ${newProcess.plannedVolume} ${newProcess.unit}\nСума: ₴${totalAmount.toFixed(2)}`
    });

    setNewProcess({ name: '', rate: '', unit: '', plannedVolume: '' });
  };

  const handleAddFromStandard = async () => {
    if (!selectedStandardProcess || !newProcess.plannedVolume) {
      toast({
        title: 'Помилка',
        description: 'Виберіть процес та вкажіть заплановану кількість',
        variant: 'destructive'
      });
      return;
    }

    const standardProcess = standardProcesses.find(p => p.id === selectedStandardProcess);
    if (!standardProcess) return;

    const plannedVolume = parseFloat(newProcess.plannedVolume);
    const totalSum = standardProcess.rate * plannedVolume;

    await addProcessType({
      name: standardProcess.name,
      object: objectName,
      rate: standardProcess.rate,
      unit: standardProcess.unit,
      plannedVolume: plannedVolume
    });

    toast({
      title: 'Успішно',
      description: `Процес "${standardProcess.name}" додано до об'єкта "${objectName}"\nЗаплановано: ${plannedVolume} ${standardProcess.unit}\nСума: ₴${totalSum.toFixed(2)}`
    });

    setSelectedStandardProcess('');
    setNewProcess({ name: '', rate: '', unit: '', plannedVolume: '' });
  };

  const handleSelectStandardProcess = (processId: string) => {
    setSelectedStandardProcess(processId);
    const process = standardProcesses.find(p => p.id === processId);
    if (process) {
      setNewProcess({
        name: process.name,
        rate: process.rate.toString(),
        unit: process.unit,
        plannedVolume: newProcess.plannedVolume
      });
    }
  };

  const handleStartEdit = (process: any) => {
    setEditingId(process.id);
    setEditingProcess({
      name: process.name,
      rate: process.rate.toString(),
      unit: process.unit,
      plannedVolume: (process.plannedVolume || 0).toString()
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProcess.name || !editingProcess.rate || !editingProcess.unit || !editingProcess.plannedVolume) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі поля',
        variant: 'destructive'
      });
      return;
    }

    await updateProcessType(editingId!, {
      name: editingProcess.name,
      object: objectName,
      rate: parseFloat(editingProcess.rate),
      unit: editingProcess.unit,
      plannedVolume: parseFloat(editingProcess.plannedVolume)
    });

    toast({
      title: 'Успішно',
      description: `Процес оновлено`
    });

    setEditingId(null);
    setEditingProcess({ name: '', rate: '', unit: '', plannedVolume: '' });
  };

  const handleDeleteProcess = async () => {
    if (!deleteConfirm) return;

    await deleteProcessType(deleteConfirm.id);
    
    toast({
      title: 'Успішно',
      description: `Процес "${deleteConfirm.name}" видалено`
    });

    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Процеси для об'єкта: <span className="text-blue-600">{objectName}</span></DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Існуючі Процеси</Label>
              {objectProcesses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Немає процесів для цього об'єкта
                </p>
              ) : (
                <div className="space-y-2">
                  {objectProcesses.map((process) => {
                    const plannedVolume = (process as any).plannedVolume || 0;
                    const totalSum = process.rate * plannedVolume;
                    const isEditing = editingId === process.id;
                    
                    return (
                      <div 
                        key={process.id} 
                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-slate-600">Назва процесу</Label>
                              <Input
                                placeholder="Назва процесу"
                                value={editingProcess.name}
                                onChange={(e) => setEditingProcess({ ...editingProcess, name: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-slate-600">Ставка (₴)</Label>
                                <Input
                                  type="number"
                                  placeholder="Ставка"
                                  value={editingProcess.rate}
                                  onChange={(e) => setEditingProcess({ ...editingProcess, rate: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">Одиниця</Label>
                                <Input
                                  placeholder="Одиниця"
                                  value={editingProcess.unit}
                                  onChange={(e) => setEditingProcess({ ...editingProcess, unit: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">Об'єм</Label>
                                <Input
                                  type="number"
                                  placeholder="Об'єм"
                                  value={editingProcess.plannedVolume}
                                  onChange={(e) => setEditingProcess({ ...editingProcess, plannedVolume: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            {editTotalAmount > 0 && (
                              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                💰 Сума: ₴{editTotalAmount.toFixed(2)}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500"
                              >
                                Зберегти
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Скасувати
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-slate-800 dark:text-white">
                                {process.name}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                ₴{process.rate} за {process.unit}
                              </div>
                              {plannedVolume > 0 && (
                                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                  📊 Заплановано: {plannedVolume} {process.unit} = ₴{totalSum.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(process)}
                              className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                              title="Редагувати"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm({
                                id: process.id,
                                name: process.name
                              })}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Видалити"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Label>Додати Процес</Label>
              
              {standardProcesses.length > 0 && (
                <div className="space-y-3 mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm text-blue-900 dark:text-blue-100">
                      Додати зі стандартних процесів
                    </Label>
                  </div>
                  <Select value={selectedStandardProcess} onValueChange={handleSelectStandardProcess}>
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть стандартний процес" />
                    </SelectTrigger>
                    <SelectContent>
                      {standardProcesses.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.name} - ₴{process.rate}/{process.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedStandardProcess && (
                    <>
                      <div>
                        <Label className="text-xs text-slate-600">Заплановано (об'єм)</Label>
                        <Input
                          type="number"
                          placeholder="Кількість для виконання"
                          value={newProcess.plannedVolume}
                          onChange={(e) => setNewProcess({ ...newProcess, plannedVolume: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      
                      {totalAmount > 0 && (
                        <div className="p-2 bg-white dark:bg-slate-900 rounded border border-blue-300 dark:border-blue-700">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            💰 Сума за процес: ₴{totalAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {newProcess.plannedVolume} {newProcess.unit} × ₴{newProcess.rate}
                          </div>
                        </div>
                      )}
                      
                      <Button
                        onClick={handleAddFromStandard}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Додати Процес
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-3 mt-3">
                <Label className="text-sm">Або створити новий процес</Label>
                <div>
                  <Label className="text-xs text-slate-600">Назва процесу</Label>
                  <Input
                    placeholder="Наприклад: Монтаж, Демонтаж..."
                    value={newProcess.name}
                    onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                    className="mt-1"
                    disabled={!!selectedStandardProcess}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-600">Ставка (₴)</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newProcess.rate}
                      onChange={(e) => setNewProcess({ ...newProcess, rate: e.target.value })}
                      className="mt-1"
                      disabled={!!selectedStandardProcess}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Одиниця</Label>
                    <Input
                      placeholder="шт, м², кг..."
                      value={newProcess.unit}
                      onChange={(e) => setNewProcess({ ...newProcess, unit: e.target.value })}
                      className="mt-1"
                      disabled={!!selectedStandardProcess}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-600">Заплановано (об'єм)</Label>
                  <Input
                    type="number"
                    placeholder="Кількість для виконання"
                    value={newProcess.plannedVolume}
                    onChange={(e) => setNewProcess({ ...newProcess, plannedVolume: e.target.value })}
                    className="mt-1"
                    disabled={!!selectedStandardProcess}
                  />
                </div>

                {!selectedStandardProcess && totalAmount > 0 && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      💰 Сума за процес: ₴{totalAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {newProcess.plannedVolume} {newProcess.unit} × ₴{newProcess.rate}
                    </div>
                  </div>
                )}

                {!selectedStandardProcess && (
                  <Button
                    onClick={handleAddProcess}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Додати Новий Процес
                  </Button>
                )}
              </div>
            </div>

            <Button variant="outline" onClick={onClose} className="w-full">
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені що хочете видалити процес "{deleteConfirm?.name}"? 
              Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProcess}
              className="bg-red-600 hover:bg-red-700"
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}