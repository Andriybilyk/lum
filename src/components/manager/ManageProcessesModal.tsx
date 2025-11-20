import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface ManageProcessesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ManageProcessesModal({ open, onClose }: ManageProcessesModalProps) {
  const { processTypes, addProcessType, updateProcessType, deleteProcessType } = useData();
  const { toast } = useToast();
  
  const [newProcess, setNewProcess] = useState({
    name: '',
    rate: '',
    unit: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProcess, setEditingProcess] = useState({
    name: '',
    rate: '',
    unit: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Фільтруємо тільки стандартні процеси (без прив'язки до об'єкта)
  const standardProcesses = processTypes.filter(p => p.name && !p.name.includes(' - '));

  const handleAddProcess = async () => {
    if (!newProcess.name || !newProcess.rate || !newProcess.unit) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі поля',
        variant: 'destructive'
      });
      return;
    }

    await addProcessType({
      name: newProcess.name,
      rate: parseFloat(newProcess.rate),
      unit: newProcess.unit
    });

    toast({
      title: 'Успішно',
      description: `Стандартний процес "${newProcess.name}" додано`
    });

    setNewProcess({ name: '', rate: '', unit: '' });
  };

  const handleStartEdit = (process: any) => {
    setEditingId(process.id);
    setEditingProcess({
      name: process.name,
      rate: process.rate.toString(),
      unit: process.unit
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProcess.name || !editingProcess.rate || !editingProcess.unit) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі поля',
        variant: 'destructive'
      });
      return;
    }

    await updateProcessType(editingId!, {
      name: editingProcess.name,
      rate: parseFloat(editingProcess.rate),
      unit: editingProcess.unit
    });

    toast({
      title: 'Успішно',
      description: `Процес оновлено`
    });

    setEditingId(null);
    setEditingProcess({ name: '', rate: '', unit: '' });
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
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Стандартні Процеси</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 Створюйте стандартні процеси які потім можна додавати до об'єктів
              </p>
            </div>

            <div className="space-y-2">
              <Label>Існуючі Стандартні Процеси</Label>
              {standardProcesses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Немає стандартних процесів. Додайте перший!
                </p>
              ) : (
                <div className="space-y-2">
                  {standardProcesses.map((process) => {
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
                            <div className="grid grid-cols-2 gap-2">
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
                            </div>
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
                              onClick={() => setDeleteConfirm({ id: process.id, name: process.name })}
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
              <Label>Додати Новий Стандартний Процес</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label className="text-xs text-slate-600">Назва процесу</Label>
                  <Input
                    placeholder="Наприклад: Монтаж, Демонтаж..."
                    value={newProcess.name}
                    onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                    className="mt-1"
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
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Одиниця виміру</Label>
                    <Input
                      placeholder="шт, м², кг..."
                      value={newProcess.unit}
                      onChange={(e) => setNewProcess({ ...newProcess, unit: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddProcess}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати Стандартний Процес
                </Button>
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