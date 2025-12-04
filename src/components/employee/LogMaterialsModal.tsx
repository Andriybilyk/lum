import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Package, DollarSign, ArrowLeft } from 'lucide-react';

interface LogMaterialsModalProps {
  open: boolean;
  onClose: () => void;
  preselectedObject?: string;
}

export default function LogMaterialsModal({ open, onClose, preselectedObject }: LogMaterialsModalProps) {
  const { user } = useUser();
  const { objects, addMaterial } = useData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    object: preselectedObject || '',
    materialName: '',
    quantity: '',
    unit: '',
    price: '',
    notes: ''
  });

  // Автоматичний розрахунок загальної вартості
  const totalCost = useMemo(() => {
    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);

    if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
      return quantity * price;
    }
    return null;
  }, [formData.quantity, formData.price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const materialData: any = {
        userId: user?.id || '',
        date: formData.date,
        object: formData.object,
        materialName: formData.materialName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        notes: formData.notes
      };

      // Додаємо ціну, якщо вказана
      if (formData.price && !isNaN(parseFloat(formData.price))) {
        materialData.price = parseFloat(formData.price);
      }

      await addMaterial(materialData);

      const costText = totalCost !== null
        ? ` (₴${totalCost.toFixed(2)})`
        : '';

      toast({
        title: 'Успішно',
        description: `Матеріал "${formData.materialName}" записано: ${formData.quantity} ${formData.unit}${costText}`
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        object: preselectedObject || '',
        materialName: '',
        quantity: '',
        unit: '',
        price: '',
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              📦 Записати Матеріали
            </DialogTitle>
          </div>
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
            <Label htmlFor="price" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Ціна за одиницю (₴) - не обов'язково
            </Label>
            <div className="relative mt-1.5">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="h-11 sm:h-12 text-sm sm:text-base pl-10"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              💡 Вкажіть ціну для автоматичного розрахунку вартості
            </p>
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

          {/* Інфо картка з автоматичним розрахунком */}
          {formData.materialName && formData.quantity && formData.unit && (
            <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
              <div className="space-y-2">
                <p className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100">
                  📦 {formData.materialName}
                </p>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-amber-700 dark:text-amber-300">Кількість:</span>
                  <span className="font-semibold text-amber-900 dark:text-amber-100">
                    {formData.quantity} {formData.unit}
                  </span>
                </div>
                {formData.price && (
                  <>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-amber-700 dark:text-amber-300">Ціна за {formData.unit}:</span>
                      <span className="font-semibold text-amber-900 dark:text-amber-100">
                        ₴{parseFloat(formData.price).toFixed(2)}
                      </span>
                    </div>
                    {totalCost !== null && (
                      <div className="pt-2 mt-2 border-t border-amber-300 dark:border-amber-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Загальна вартість:
                          </span>
                          <span className="text-lg font-bold text-green-700 dark:text-green-400">
                            ₴{totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
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
