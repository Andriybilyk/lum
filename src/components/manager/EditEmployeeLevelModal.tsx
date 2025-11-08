import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface EditEmployeeLevelModalProps {
  open: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    level: string;
    hourlyRate: number;
  };
}

export default function EditEmployeeLevelModal({ open, onClose, employee }: EditEmployeeLevelModalProps) {
  const { toast } = useToast();
  const { levels, updateUserLevel } = useData();
  const [selectedLevel, setSelectedLevel] = useState(employee.level);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const selectedLevelData = levels.find(l => l.name === selectedLevel);
  const currentLevelData = levels.find(l => l.name === employee.level);

  const handleSave = () => {
    if (selectedLevel === employee.level) {
      toast({
        title: 'Інформація',
        description: 'Рівень не змінено'
      });
      onClose();
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    const newRate = selectedLevelData?.hourlyRate || employee.hourlyRate;
    
    await updateUserLevel(employee.id, selectedLevel, newRate);

    toast({
      title: 'Успішно',
      description: `Рівень ${employee.name} змінено на "${selectedLevelData?.name}"`
    });

    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редагування Рівня</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Працівник: <span className="font-semibold text-slate-800 dark:text-white">{employee.name}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Поточний рівень: <span className="font-semibold text-slate-800 dark:text-white">{currentLevelData?.name} ({Number(employee.hourlyRate).toFixed(0)} грн/год)</span>
              </p>
            </div>

            <div>
              <Label>Новий Рівень</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.name}>
                      {level.name} - {Number(level.hourlyRate).toFixed(0)} грн/год
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLevel !== employee.level && selectedLevelData && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Нова ставка: <span className="font-semibold">{Number(selectedLevelData.hourlyRate).toFixed(0)} грн/год</span>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Різниця: {selectedLevelData.hourlyRate > employee.hourlyRate ? '+' : ''}
                  {Number(selectedLevelData.hourlyRate - employee.hourlyRate).toFixed(0)} грн/год
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Скасувати
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500">
                Зберегти
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Підтвердження Зміни Рівня</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете змінити рівень працівника <strong>{employee.name}</strong> з "{currentLevelData?.name}" на "{selectedLevelData?.name}"?
              <br /><br />
              <strong>Нова ставка:</strong> {selectedLevelData ? Number(selectedLevelData.hourlyRate).toFixed(0) : 0} грн/год
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Підтвердити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}