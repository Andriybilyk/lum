import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Edit, Save, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface EditLevelsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditLevelsModal({ open, onClose }: EditLevelsModalProps) {
  const { levels, addLevel, updateLevel, deleteLevel } = useData();
  const { toast } = useToast();
  const [newLevel, setNewLevel] = useState({ name: '', rate: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ name: string; rate: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleAddLevel = async () => {
    if (!newLevel.name || !newLevel.rate) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі поля',
        variant: 'destructive'
      });
      return;
    }

    await addLevel({
      name: newLevel.name,
      hourlyRate: parseFloat(newLevel.rate)
    });

    toast({
      title: 'Успішно',
      description: `Рівень "${newLevel.name}" додано`
    });

    setNewLevel({ name: '', rate: '' });
  };

  const handleStartEdit = (level: { id: string; name: string; hourlyRate: number }) => {
    setEditingId(level.id);
    setEditingData({ name: level.name, rate: level.hourlyRate });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingData) return;

    await updateLevel(id, { name: editingData.name, rate: editingData.rate });
    
    setEditingId(null);
    setEditingData(null);
    
    toast({
      title: 'Успішно',
      description: 'Рівень оновлено'
    });
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    await deleteLevel(deleteConfirm.id);
    
    toast({
      title: 'Успішно',
      description: `Рівень "${deleteConfirm.name}" видалено`
    });

    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Керування Рівнями</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Існуючі Рівні</Label>
              {levels.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Немає рівнів. Додайте перший!
                </p>
              ) : (
                levels.map((level) => {
                  const isEditing = editingId === level.id;
                  
                  return (
                    <div key={level.id} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={isEditing && editingData ? editingData.name : level.name}
                          onChange={(e) => {
                            if (isEditing && editingData) {
                              setEditingData({ ...editingData, name: e.target.value });
                            }
                          }}
                          placeholder="Назва рівня"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-white dark:bg-slate-700' : ''}
                        />
                        <Input
                          type="number"
                          value={isEditing && editingData ? editingData.rate : level.hourlyRate}
                          onChange={(e) => {
                            if (isEditing && editingData) {
                              setEditingData({ ...editingData, rate: parseFloat(e.target.value) || 0 });
                            }
                          }}
                          placeholder="Ставка (₴/год)"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-white dark:bg-slate-700' : ''}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(level.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(level)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(level.id, level.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t">
              <Label>Додати Новий Рівень</Label>
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Назва рівня"
                  value={newLevel.name}
                  onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Ставка (₴/год)"
                  value={newLevel.rate}
                  onChange={(e) => setNewLevel({ ...newLevel, rate: e.target.value })}
                />
                <Button
                  onClick={handleAddLevel}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати Рівень
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={onClose} className="w-full">
              Закри��и
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити рівень "{deleteConfirm?.name}"? 
              Цю дію не можна буде скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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