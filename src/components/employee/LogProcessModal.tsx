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
import PhotoUpload from '@/components/shared/PhotoUpload';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LogProcessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogProcessModal({ open, onClose }: LogProcessModalProps) {
  const { user } = useUser();
  const { objects, processTypes, addProcess, addAdditionalWork, users } = useData();
  const { toast } = useToast();

  const [mode, setMode] = useState<'standard' | 'additional'>('standard');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    object: '',
    processName: '',
    volume: '',
    unit: '',
    rate: '',
    photoBefore: null as string | null,
    photoDuring: null as string | null,
    photoAfter: null as string | null
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
      salary,
      photoBefore: formData.photoBefore || undefined,
      photoDuring: formData.photoDuring || undefined,
      photoAfter: formData.photoAfter || undefined
    });

    // Даємо час на запис в Google Sheets (запит вже відправлено)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const photoCount = [formData.photoBefore, formData.photoDuring, formData.photoAfter].filter(Boolean).length;
    const photoText = photoCount > 0 ? ` з ${photoCount} фото` : '';

    toast({
      title: 'Успішно',
      description: `Процес записано на ${formData.object}${photoText}. Заробіток: ₴${salary.toFixed(2)}`
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      object: '',
      processName: '',
      volume: '',
      unit: '',
      rate: '',
      photoBefore: null,
      photoDuring: null,
      photoAfter: null
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">📋 Записати Процес</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'standard' ? 'default' : 'outline'}
            onClick={() => setMode('standard')}
            className="flex-1 h-11 sm:h-12 text-xs sm:text-sm md:text-base font-semibold px-2 sm:px-4"
          >
            <span className="hidden xs:inline">📋 Стандартний</span>
            <span className="xs:hidden">📋 Процес</span>
          </Button>
          <Button
            type="button"
            variant={mode === 'additional' ? 'default' : 'outline'}
            onClick={() => setMode('additional')}
            className="flex-1 h-11 sm:h-12 text-xs sm:text-sm md:text-base font-semibold px-2 sm:px-4"
          >
            <span className="hidden xs:inline">⭐ Додаткові</span>
            <span className="xs:hidden">⭐ Роботи</span>
          </Button>
        </div>

        {mode === 'standard' ? (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="date" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Дата</Label>
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
            <Label htmlFor="object" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Об'єкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value, processName: '', volume: '', unit: '', rate: '' })}
            >
              <SelectTrigger id="object" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="processName" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Назва Процесу</Label>
            <Select
              value={formData.processName}
              onValueChange={handleProcessSelect}
              disabled={!formData.object}
            >
              <SelectTrigger id="processName" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder={formData.object ? "Оберіть процес" : "Спочатку оберіть об'єкт"} />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {availableProcesses.map((process) => (
                  <SelectItem key={process.id} value={process.name} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 py-1">
                      <span className="font-medium">{process.name}</span>
                      <span className="text-xs sm:text-sm text-slate-500">₴{process.rate}/{process.unit}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.processName && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label htmlFor="volume" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Обсяг</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    placeholder="10"
                    required
                    className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="unit" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Од.</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    readOnly
                    className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rate" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Ставка (₴)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  readOnly
                  className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {formData.volume && formData.rate && (
                <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <p className="text-sm sm:text-base font-bold text-green-800 dark:text-green-200">
                    💰 Заробіток: ₴{(parseFloat(formData.volume) * parseFloat(formData.rate)).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Секція фото - опціонально */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="photos" className="border-0">
                  <AccordionTrigger className="px-4 hover:no-underline text-sm sm:text-base font-semibold">
                    📸 Додати Фото (не обов'язково)
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <PhotoUpload
                        label="Фото ПЕРЕД початком роботи"
                        photoUrl={formData.photoBefore || undefined}
                        onPhotoChange={(url) => setFormData({ ...formData, photoBefore: url })}
                      />
                      <PhotoUpload
                        label="Фото ПІД ЧАС виконання"
                        photoUrl={formData.photoDuring || undefined}
                        onPhotoChange={(url) => setFormData({ ...formData, photoDuring: url })}
                      />
                      <PhotoUpload
                        label="Фото ПІСЛЯ завершення"
                        photoUrl={formData.photoAfter || undefined}
                        onPhotoChange={(url) => setFormData({ ...formData, photoAfter: url })}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        💡 Фото допомагають контролювати якість робіт
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold">
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg active:scale-95 transition-transform"
              disabled={!formData.object || !formData.processName || !formData.volume}
            >
              ✓ Зберегти
            </Button>
          </div>
        </form>
        ) : (
        <form onSubmit={handleAdditionalWorkSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="aw-date" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Дата</Label>
            <Input
              id="aw-date"
              type="date"
              value={additionalWorkData.date}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, date: e.target.value })}
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="aw-object" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Об'єкт</Label>
            <Select
              value={additionalWorkData.object}
              onValueChange={(value) => setAdditionalWorkData({ ...additionalWorkData, object: value })}
            >
              <SelectTrigger id="aw-object" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="aw-workName" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Назва Робіт</Label>
            <Input
              id="aw-workName"
              value={additionalWorkData.workName}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, workName: e.target.value })}
              placeholder="Вивіз сміття, Прибирання..."
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="aw-description" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Опис (не обов'язково)</Label>
            <Input
              id="aw-description"
              value={additionalWorkData.description}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, description: e.target.value })}
              placeholder="Додаткові деталі..."
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <Label htmlFor="aw-unit" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Од.</Label>
              <Input
                id="aw-unit"
                value={additionalWorkData.unit}
                onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, unit: e.target.value })}
                placeholder="шт, м²..."
                required
                className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="aw-volume" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Кільк.</Label>
              <Input
                id="aw-volume"
                type="number"
                step="0.01"
                value={additionalWorkData.volume}
                onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, volume: e.target.value })}
                placeholder="10"
                required
                className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="aw-rate" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Ставка (₴)</Label>
            <Input
              id="aw-rate"
              type="number"
              step="0.01"
              value={additionalWorkData.rate}
              onChange={(e) => setAdditionalWorkData({ ...additionalWorkData, rate: e.target.value })}
              placeholder="100"
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          {additionalWorkData.volume && additionalWorkData.rate && (
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm sm:text-base font-bold text-blue-800 dark:text-blue-200">
                ⭐ Сума: ₴{(parseFloat(additionalWorkData.volume) * parseFloat(additionalWorkData.rate)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold">
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 shadow-lg active:scale-95 transition-transform"
              disabled={!additionalWorkData.object || !additionalWorkData.workName || !additionalWorkData.unit || !additionalWorkData.volume || !additionalWorkData.rate}
            >
              ✓ Надіслати
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}