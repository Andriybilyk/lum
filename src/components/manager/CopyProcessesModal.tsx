import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Copy, ArrowRight, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CopyProcessesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CopyProcessesModal({ open, onClose }: CopyProcessesModalProps) {
  const { objects, processTypes, addProcessType } = useData();
  const { toast } = useToast();

  const [sourceObjectId, setSourceObjectId] = useState<string>('');
  const [targetObjectIds, setTargetObjectIds] = useState<string[]>([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);
  const [isCopying, setIsCopying] = useState(false);

  // Процеси обраного вихідного об'єкта
  const sourceProcesses = useMemo(() => {
    if (!sourceObjectId) return [];
    const sourceObject = objects.find(o => o.id === sourceObjectId);
    if (!sourceObject) return [];
    return processTypes.filter(p => p.object === sourceObject.name);
  }, [sourceObjectId, objects, processTypes]);

  // Фільтруємо цільові об'єкти (не можна копіювати в той самий)
  const availableTargetObjects = useMemo(() => {
    return objects.filter(o => o.id !== sourceObjectId);
  }, [objects, sourceObjectId]);

  const handleToggleTargetObject = (objectId: string) => {
    setTargetObjectIds(prev => {
      if (prev.includes(objectId)) {
        return prev.filter(id => id !== objectId);
      }
      return [...prev, objectId];
    });
  };

  const handleToggleProcess = (processId: string) => {
    setSelectedProcessIds(prev => {
      if (prev.includes(processId)) {
        return prev.filter(id => id !== processId);
      }
      return [...prev, processId];
    });
  };

  const handleSelectAllProcesses = () => {
    if (selectedProcessIds.length === sourceProcesses.length) {
      setSelectedProcessIds([]);
    } else {
      setSelectedProcessIds(sourceProcesses.map(p => p.id));
    }
  };

  const handleSelectAllTargets = () => {
    if (targetObjectIds.length === availableTargetObjects.length) {
      setTargetObjectIds([]);
    } else {
      setTargetObjectIds(availableTargetObjects.map(o => o.id));
    }
  };

  const handleCopy = async () => {
    if (selectedProcessIds.length === 0) {
      toast({
        title: 'Помилка',
        description: 'Оберіть хоча б один процес для копіювання',
        variant: 'destructive'
      });
      return;
    }

    if (targetObjectIds.length === 0) {
      toast({
        title: 'Помилка',
        description: 'Оберіть хоча б один цільовий об\'єкт',
        variant: 'destructive'
      });
      return;
    }

    setIsCopying(true);

    try {
      const processToCopy = processTypes.filter(p => selectedProcessIds.includes(p.id));
      const targetObjects = objects.filter(o => targetObjectIds.includes(o.id));

      let copiedCount = 0;

      for (const targetObject of targetObjects) {
        for (const process of processToCopy) {
          // Перевіряємо чи вже існує такий процес
          const existingProcess = processTypes.find(
            p => p.object === targetObject.name && p.name === process.name
          );

          if (!existingProcess) {
            await addProcessType({
              name: process.name,
              rate: process.rate,
              unit: process.unit,
              object: targetObject.name
            });
            copiedCount++;
          }
        }
      }

      toast({
        title: 'Успішно!',
        description: `Скопійовано ${copiedCount} процесів у ${targetObjectIds.length} об'єктів`
      });

      // Скидаємо вибір
      setSelectedProcessIds([]);
      setTargetObjectIds([]);
      onClose();
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося скопіювати процеси',
        variant: 'destructive'
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleReset = () => {
    setSourceObjectId('');
    setTargetObjectIds([]);
    setSelectedProcessIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
              Копіювання Процесів між Об'єктами
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Підказка */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Оберіть об'єкт-джерело, потім процеси для копіювання, і цільові об'єкти
            </p>
          </div>

          {/* Крок 1: Обрати вихідний об'єкт */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Крок 1: Оберіть Об'єкт-Джерело</Label>
            <select
              value={sourceObjectId}
              onChange={(e) => {
                setSourceObjectId(e.target.value);
                setSelectedProcessIds([]);
              }}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800"
            >
              <option value="">-- Оберіть об'єкт --</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Крок 2: Обрати процеси */}
          {sourceObjectId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Крок 2: Оберіть Процеси ({selectedProcessIds.length}/{sourceProcesses.length})
                </Label>
                {sourceProcesses.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAllProcesses}
                  >
                    {selectedProcessIds.length === sourceProcesses.length ? 'Скасувати всі' : 'Обрати всі'}
                  </Button>
                )}
              </div>

              {sourceProcesses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  Немає процесів для копіювання
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {sourceProcesses.map((process) => (
                    <div
                      key={process.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                    >
                      <Checkbox
                        checked={selectedProcessIds.includes(process.id)}
                        onCheckedChange={() => handleToggleProcess(process.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{process.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          ₴{process.rate} за {process.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Крок 3: Обрати цільові об'єкти */}
          {sourceObjectId && selectedProcessIds.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Крок 3: Оберіть Цільові Об'єкти ({targetObjectIds.length}/{availableTargetObjects.length})
                </Label>
                {availableTargetObjects.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAllTargets}
                  >
                    {targetObjectIds.length === availableTargetObjects.length ? 'Скасувати всі' : 'Обрати всі'}
                  </Button>
                )}
              </div>

              {availableTargetObjects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  Немає доступних об'єктів для копіювання
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {availableTargetObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                    >
                      <Checkbox
                        checked={targetObjectIds.includes(obj.id)}
                        onCheckedChange={() => handleToggleTargetObject(obj.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{obj.name}</div>
                        {obj.address && (
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {obj.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Підсумок */}
          {selectedProcessIds.length > 0 && targetObjectIds.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900 dark:text-green-100">
                  Готово до копіювання
                </span>
              </div>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p>
                  • Буде скопійовано <Badge variant="secondary">{selectedProcessIds.length}</Badge> процесів
                </p>
                <p>
                  • У <Badge variant="secondary">{targetObjectIds.length}</Badge> об'єктів
                </p>
                <p>
                  • Загалом буде створено до <Badge variant="secondary">{selectedProcessIds.length * targetObjectIds.length}</Badge> записів
                </p>
                <p className="text-xs mt-2">
                  ℹ️ Процеси з однаковими назвами будуть пропущені
                </p>
              </div>
            </div>
          )}

          {/* Дії */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              disabled={selectedProcessIds.length === 0 || targetObjectIds.length === 0 || isCopying}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
            >
              {isCopying ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Копіювання...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Копіювати Процеси
                  {selectedProcessIds.length > 0 && targetObjectIds.length > 0 && (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isCopying}
            >
              Скинути
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
