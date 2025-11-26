import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit2, FileText, Plane } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import ObjectProcessesModal from './ObjectProcessesModal';

interface ManageObjectsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ManageObjectsModal({ open, onClose }: ManageObjectsModalProps) {
  const { objects, addObject, updateObject, deleteObject } = useData();
  const { toast } = useToast();
  const [newObject, setNewObject] = useState({ name: '', isBusinessTrip: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingObject, setEditingObject] = useState({ name: '', isBusinessTrip: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [detailsObject, setDetailsObject] = useState<{ id: string; name: string } | null>(null);

  const handleAddObject = async () => {
    if (!newObject.name.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву об\'єкту',
        variant: 'destructive'
      });
      return;
    }

    await addObject({ name: newObject.name.trim(), isBusinessTrip: newObject.isBusinessTrip });

    toast({
      title: 'Успішно',
      description: `Об'єкт "${newObject.name}" додано${newObject.isBusinessTrip ? ' (відрядження)' : ''}`
    });

    setNewObject({ name: '', isBusinessTrip: false });
  };

  const handleStartEdit = (obj: any) => {
    setEditingId(obj.id);
    setEditingObject({ name: obj.name, isBusinessTrip: obj.isBusinessTrip || false });
  };

  const handleSaveEdit = async () => {
    if (!editingObject.name.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву об\'єкту',
        variant: 'destructive'
      });
      return;
    }

    await updateObject(editingId!, { name: editingObject.name.trim(), isBusinessTrip: editingObject.isBusinessTrip });

    toast({
      title: 'Успішно',
      description: `Об'єкт оновлено`
    });

    setEditingId(null);
    setEditingObject({ name: '', isBusinessTrip: false });
  };

  const handleDeleteObject = async () => {
    if (!deleteConfirm) return;

    await deleteObject(deleteConfirm.id);
    
    toast({
      title: 'Успішно',
      description: `Об'єкт "${deleteConfirm.name}" видалено`
    });

    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Керування Об'єктами</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Існуючі Об'єкти</Label>
              {objects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Немає об'єктів. Додайте перший!
                </p>
              ) : (
                objects.map((obj) => (
                  <div key={obj.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {editingId === obj.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-600">Назва об'єкту</Label>
                          <Input
                            value={editingObject.name}
                            onChange={(e) => setEditingObject({ ...editingObject, name: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-trip-${obj.id}`}
                            checked={editingObject.isBusinessTrip}
                            onCheckedChange={(checked) => setEditingObject({ ...editingObject, isBusinessTrip: checked as boolean })}
                          />
                          <Label htmlFor={`edit-trip-${obj.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            Відрядження (коефіцієнт 1.2x)
                          </Label>
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
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 dark:text-white">
                              {obj.name}
                            </span>
                            {obj.isBusinessTrip && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded flex items-center gap-1">
                                <Plane className="w-3 h-3" />
                                Відрядження
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailsObject({ id: obj.id, name: obj.name })}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Деталі та процеси"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(obj)}
                          className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                          title="Редагувати"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({ id: obj.id, name: obj.name })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Видалити"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t">
              <Label>Додати Новий Об'єкт</Label>
              <div className="space-y-3 mt-2">
                <Input
                  placeholder="Назва об'єкту"
                  value={newObject.name}
                  onChange={(e) => setNewObject({ ...newObject, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddObject()}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new-trip"
                    checked={newObject.isBusinessTrip}
                    onCheckedChange={(checked) => setNewObject({ ...newObject, isBusinessTrip: checked as boolean })}
                  />
                  <Label htmlFor="new-trip" className="text-sm cursor-pointer flex items-center gap-1">
                    <Plane className="w-3 h-3" />
                    Відрядження (коефіцієнт 1.2x)
                  </Label>
                </div>
                <Button
                  onClick={handleAddObject}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати Об'єкт
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
              Ви впевнені що хочете видалити об'єкт "{deleteConfirm?.name}"? 
              Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteObject}
              className="bg-red-600 hover:bg-red-700"
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Модальне вікно деталей об'єкта з процесами */}
      {detailsObject && (
        <ObjectProcessesModal
          open={!!detailsObject}
          onClose={() => setDetailsObject(null)}
          objectId={detailsObject.id}
          objectName={detailsObject.name}
        />
      )}
    </>
  );
}