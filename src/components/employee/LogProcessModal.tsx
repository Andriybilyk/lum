import { logger } from '@/utils/logger';
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
  const { objects, processTypes, addProcess, addAdditionalWork, loadFromGoogleSheets, users } = useData();
  const { toast } = useToast();

  const [mode, setMode] = useState<'standard' | 'additional'>('standard');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    object: '',
    processName: '',
    volume: '',
    unit: '',
    rate: ''
  });

  const [additionalWorkData, setAdditionalWorkData] = useState({
    date: new Date().toISOString().split('T')[0],
    object: '',
    workName: '',
    description: '',
    unit: '',
    volume: '',
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

  const availableProcesses = formData.object
    ? processTypes.filter(p => p.object === formData.object)
    : processTypes;

  const handleAdditionalWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const volume = parseFloat(additionalWorkData.volume);
    const rate = parseFloat(additionalWorkData.rate);
    const salary = volume * rate;

    // Для менеджера - автоматичне затвердження
    const isManager = user?.role === 'manager';
    const managerId = isManager ? user?.id : user?.managerId;

    if (!managerId) {
      toast({
        title: 'Помилка',
        description: 'Помилка з менеджером. Зв\'яжіться з адміністратором.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addAdditionalWork({
        userId: user?.id || '',
        managerId: managerId,
        objectName: additionalWorkData.object,
        date: additionalWorkData.date,
        workName: additionalWorkData.workName,
        description: additionalWorkData.description,
        unit: additionalWorkData.unit,
        volume,
        rate,
        salary,
        status: isManager ? 'approved' : 'pending'
      });

      if (isManager) {
        toast({
          title: 'Успішно',
          description: `Додаткові роботи затверджено. Сума: ₴${salary.toFixed(2)}`
        });
      } else {
        const manager = users.find(u => u.id === managerId);
        toast({
          title: 'Успішно',
          description: `Додаткові роботи надіслано менеджеру "${manager?.name}". Сума: ₴${salary.toFixed(2)}`
        });
      }

      setAdditionalWorkData({
        date: new Date().toISOString().split('T')[0],
        object: '',
        workName: '',
        description: '',
        unit: '',
        volume: '',
        rate: ''
      });

      setMode('standard');
      onClose();
    } catch (error) {
      logger.error('Error submitting additional work:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося надіслати додаткові роботи',
        variant: 'destructive'
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
      object: formData.object,
      volume,
      unit: formData.unit,
      rate: parseFloat(formData.rate),
      salary
    });

    // Даємо час на запис в Google Sheets (запит вже відправлено)
    await new Promise(resolve => setTimeout(resolve, 1000));

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

        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'standard' ? 'default' : 'outline'}
            onClick={() => setMode('standard')}
            className="flex-1"
          >
            📋 Стандартний Процес
          </Button>
          <Button
            type="button"
            variant={mode === 'additional' ? 'default' : 'outline'}
            onClick={() => setMode('additional')}
            className="flex-1"
          >
            ⭐ Додаткові Роботи
          </Button>
        </div>

        {mode === 'standard' ? (
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
              onValueChange={(value) => setFormData({ ...formData, object: value, processName: '', volume: '', unit: '', rate: '' })}
            >
              <SelectTrigger id="object" className="mt-1.5">
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
              disabled={!formData.object}
            >
              <SelectTrigger id="processName" className="mt-1.5">
                <SelectValue placeholder={formData.object ? "Оберіть процес" : "Спочатку оберіть об'єкт"} />
              </SelectTrigger>
              <SelectContent>
                {availableProcesses.map((process) => (
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
        ) : (
        <form onSubmit={handleAdditionalWorkSubmit} className="space-y-4">
          <div>
            <Label htmlFor="aw-date">Дата</Label>
            <Input
              id="aw-date"
              type="date"
              value={additionalWorkData.date}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="aw-object">Об'єкт</Label>
            <Select
              value={additionalWorkData.object}
              onValueChange={(value) => setAdditionalWorkData({ ...additionalWorkData, object: value })}
            >
              <SelectTrigger id="aw-object" className="mt-1.5">
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
            <Label htmlFor="aw-workName">Назва Робіт</Label>
            <Input
              id="aw-workName"
              value={additionalWorkData.workName}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, workName: e.target.value })}
              placeholder="Наприклад: Вивіз сміття, Прибирання..."
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="aw-description">Опис (опціонально)</Label>
            <Input
              id="aw-description"
              value={additionalWorkData.description}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, description: e.target.value })}
              placeholder="Додаткові деталі про роботи..."
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="aw-unit">Одиниця</Label>
              <Input
                id="aw-unit"
                value={additionalWorkData.unit}
                onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, unit: e.target.value })}
                placeholder="шт, м², кг..."
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="aw-volume">Кількість</Label>
              <Input
                id="aw-volume"
                type="number"
                step="0.01"
                value={additionalWorkData.volume}
                onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, volume: e.target.value })}
                placeholder="10"
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="aw-rate">Ставка за Одиницю (₴)</Label>
            <Input
              id="aw-rate"
              type="number"
              step="0.01"
              value={additionalWorkData.rate}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, rate: e.target.value })}
              placeholder="100"
              required
              className="mt-1.5"
            />
          </div>

          {additionalWorkData.volume && additionalWorkData.rate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Сума для затвердження: ₴{(parseFloat(additionalWorkData.volume) * parseFloat(additionalWorkData.rate)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-500"
              disabled={!additionalWorkData.object || !additionalWorkData.workName || !additionalWorkData.unit || !additionalWorkData.volume || !additionalWorkData.rate}
            >
              Надіслати
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}