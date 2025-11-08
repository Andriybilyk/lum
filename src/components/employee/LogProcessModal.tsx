import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface LogProcessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogProcessModal({ open, onClose }: LogProcessModalProps) {
  const { user } = useUser();
  const { objects, processTypes, addProcess } = useData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    object: '',
    processName: '',
    volume: '',
    unit: '',
    rate: ''
  });

  const handleProcessSelect = (processName: string) => {
    const process = processTypes.find(p => p.name === processName);
    if (process) {
      setFormData({
        ...formData,
        processName,
        unit: process.unit,
        rate: process.rate.toString()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const volume = parseFloat(formData.volume);
    const rate = parseFloat(formData.rate);
    const salary = volume * rate;

    await addProcess({
      userId: user?.id || '',
      date: formData.date,
      processName: formData.processName,
      volume,
      unit: formData.unit,
      salary
    });

    toast({
      title: 'Успішно',
      description: `Процес записано на ${formData.object}. Заробіток: ₴${salary.toFixed(2)}`
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      object: '',
      processName: '',
      volume: '',
      unit: '',
      rate: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Записати Процес</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Дата</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="object">Об'єкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger className="mt-1.5">
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

          <div>
            <Label htmlFor="processName">Назва Процесу</Label>
            <Select
              value={formData.processName}
              onValueChange={handleProcessSelect}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Оберіть процес" />
              </SelectTrigger>
              <SelectContent>
                {processTypes.map((process) => (
                  <SelectItem key={process.id} value={process.name}>
                    {process.name} - ₴{process.rate}/{process.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.processName && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="volume">Обсяг</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    placeholder="10"
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Одиниця</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    readOnly
                    className="mt-1.5 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rate">Ставка за Одиницю (₴)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  readOnly
                  className="mt-1.5 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {formData.volume && formData.rate && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Очікуваний Заробіток: ₴{(parseFloat(formData.volume) * parseFloat(formData.rate)).toFixed(2)}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Скасувати
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500"
              disabled={!formData.object || !formData.processName || !formData.volume}
            >
              Зберегти
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}