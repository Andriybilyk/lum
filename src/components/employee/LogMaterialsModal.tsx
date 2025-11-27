import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Package } from 'lucide-react';

interface LogMaterialsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogMaterialsModal({ open, onClose }: LogMaterialsModalProps) {
  const { user } = useUser();
  const { objects, addMaterial } = useData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    object: '',
    materialName: '',
    quantity: '',
    unit: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addMaterial({
        userId: user?.id || '',
        date: formData.date,
        object: formData.object,
        materialName: formData.materialName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        notes: formData.notes
      });

      toast({
        title: 'Успішно',
        description: `Матеріал "${formData.materialName}" записано: ${formData.quantity} ${formData.unit}`
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        object: '',
        materialName: '',
        quantity: '',
        unit: '',
        notes: ''
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти матеріал',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            📦 Записати Матеріали
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="date" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Дата
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="object" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Об'єкт
            </Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger id="object" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {objects.map((obj) => (
                  <SelectItem
                    key={obj.id}
                    value={obj.name}
                    className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer"
                  >
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="materialName" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Назва Матеріалу
            </Label>
            <Input
              id="materialName"
              value={formData.materialName}
              onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
              placeholder="Цемент, Цегла, Арматура..."
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <Label htmlFor="quantity" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                Кількість
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                required
                className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="unit" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                Од. вим.
              </Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="кг, м³, шт..."
                required
                className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Примітки (не обов'язково)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Додаткова інформація про матеріали..."
              className="mt-1.5 min-h-[80px] text-sm sm:text-base resize-none"
            />
          </div>

          {formData.materialName && formData.quantity && formData.unit && (
            <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
              <p className="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200">
                📦 {formData.materialName}: {formData.quantity} {formData.unit}
              </p>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 shadow-lg active:scale-95 transition-transform"
              disabled={!formData.object || !formData.materialName || !formData.quantity || !formData.unit}
            >
              ✓ Зберегти
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
