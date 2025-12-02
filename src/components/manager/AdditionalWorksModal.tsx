import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Check, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import type { AdditionalWork } from '@/types';

interface AdditionalWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AdditionalWorksModal({ open, onClose }: AdditionalWorksModalProps) {
  const { user } = useUser();
  const { additionalWorks, updateAdditionalWork, users } = useData();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AdditionalWork>>({});

  const pendingWorks = useMemo(() => {
    return additionalWorks.filter(w => w.managerId === user?.id && w.status === 'pending' && w.userId !== user?.id);
  }, [additionalWorks, user?.id]);

  const myApprovedWorks = useMemo(() => {
    return additionalWorks.filter(w => w.managerId === user?.id && w.status === 'approved' && w.userId === user?.id);
  }, [additionalWorks, user?.id]);

  const completedWorks = useMemo(() => {
    return additionalWorks.filter(w => w.managerId === user?.id && w.status !== 'pending' && w.userId !== user?.id);
  }, [additionalWorks, user?.id]);

  const getEmployeeName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Невідомий';
  };

  const handleApprove = async (work: AdditionalWork) => {
    try {
      await updateAdditionalWork(work.id, {
        status: 'approved',
        ...editData
      });

      toast({
        title: 'Успішно',
        description: `"${work.workName}" затверджено. Сума: ₴${work.salary.toFixed(2)}`
      });

      setEditingId(null);
      setEditData({});
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося затвердити роботи',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (work: AdditionalWork) => {
    try {
      await updateAdditionalWork(work.id, { status: 'rejected' });

      toast({
        title: 'Успішно',
        description: `"${work.workName}" відхилено`
      });

      setEditingId(null);
      setEditData({});
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося відхилити роботи',
        variant: 'destructive'
      });
    }
  };

  const handleStartEdit = (work: AdditionalWork) => {
    setEditingId(work.id);
    setEditData({
      workName: work.workName,
      description: work.description,
      unit: work.unit,
      volume: work.volume,
      rate: work.rate,
      salary: work.salary
    });
  };

  const calculateSalary = () => {
    const volume = editData.volume ? parseFloat(editData.volume.toString()) : 0;
    const rate = editData.rate ? parseFloat(editData.rate.toString()) : 0;
    return volume * rate;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            Додаткові Роботи
            {pendingWorks.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-semibold">
                {pendingWorks.length} нових
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {pendingWorks.length === 0 && completedWorks.length === 0 && myApprovedWorks.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-slate-500">
                Немає додаткових робіт
              </p>
            </Card>
          ) : (
            <>
              {pendingWorks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    На затвердження ({pendingWorks.length})
                  </h3>

                  {pendingWorks.map((work) => (
                    <Card key={work.id} className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                      {editingId === work.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`pending-work-name-${editingId}`} className="text-xs">Назва Робіт</Label>
                            <Input
                              id={`pending-work-name-${editingId}`}
                              value={editData.workName || ''}
                              onChange={(e) => setEditData({ ...editData, workName: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`pending-description-${editingId}`} className="text-xs">Опис</Label>
                            <Input
                              id={`pending-description-${editingId}`}
                              value={editData.description || ''}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor={`pending-unit-${editingId}`} className="text-xs">Одиниця</Label>
                              <Input
                                id={`pending-unit-${editingId}`}
                                value={editData.unit || ''}
                                onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`pending-volume-${editingId}`} className="text-xs">Кількість</Label>
                              <Input
                                id={`pending-volume-${editingId}`}
                                type="number"
                                value={editData.volume || ''}
                                onChange={(e) => setEditData({ ...editData, volume: parseFloat(e.target.value) || 0 })}
                                className="mt-1"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`pending-rate-${editingId}`} className="text-xs">Ставка (₴)</Label>
                              <Input
                                id={`pending-rate-${editingId}`}
                                type="number"
                                value={editData.rate || ''}
                                onChange={(e) => setEditData({ ...editData, rate: parseFloat(e.target.value) || 0 })}
                                className="mt-1"
                                step="0.01"
                              />
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-orange-300 dark:border-orange-700">
                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                              💰 Сума: ₴{calculateSalary().toFixed(2)}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(work)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Затвердити
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Скасувати
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(work)}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Відхилити
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {work.workName}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                👤 {getEmployeeName(work.userId)} • 📅 {work.date}
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                {work.unit}: {work.volume} × ₴{work.rate}
                              </p>
                              {work.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  📝 {work.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                ₴{work.salary.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {work.objectName}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(work)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Затвердити
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(work)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Редагувати
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(work)}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Відхилити
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {myApprovedWorks.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Мої Затверджені Роботи ({myApprovedWorks.length})
                  </h3>

                  {myApprovedWorks.map((work) => (
                    <Card key={work.id} className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      {editingId === work.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`approved-work-name-${editingId}`} className="text-xs">Назва Робіт</Label>
                            <Input
                              id={`approved-work-name-${editingId}`}
                              value={editData.workName || ''}
                              onChange={(e) => setEditData({ ...editData, workName: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`approved-description-${editingId}`} className="text-xs">Опис</Label>
                            <Input
                              id={`approved-description-${editingId}`}
                              value={editData.description || ''}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor={`approved-unit-${editingId}`} className="text-xs">Одиниця</Label>
                              <Input
                                id={`approved-unit-${editingId}`}
                                value={editData.unit || ''}
                                onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`approved-volume-${editingId}`} className="text-xs">Кількість</Label>
                              <Input
                                id={`approved-volume-${editingId}`}
                                type="number"
                                value={editData.volume || ''}
                                onChange={(e) => setEditData({ ...editData, volume: parseFloat(e.target.value) || 0 })}
                                className="mt-1"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`approved-rate-${editingId}`} className="text-xs">Ставка (₴)</Label>
                              <Input
                                id={`approved-rate-${editingId}`}
                                type="number"
                                value={editData.rate || ''}
                                onChange={(e) => setEditData({ ...editData, rate: parseFloat(e.target.value) || 0 })}
                                className="mt-1"
                                step="0.01"
                              />
                            </div>
                          </div>

                          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-green-300 dark:border-green-700">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                              💰 Сума: ₴{calculateSalary().toFixed(2)}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(work)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500"
                            >
                              Зберегти
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Скасувати
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {work.workName}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                📅 {work.date}
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                {work.unit}: {work.volume} × ₴{work.rate}
                              </p>
                              {work.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  📝 {work.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                ₴{work.salary.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {work.objectName}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(work)}
                              className="flex-1"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Редагувати
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {completedWorks.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <button
                    onClick={() => setExpandedId(expandedId === 'history' ? null : 'history')}
                    className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      Історія ({completedWorks.length})
                    </h3>
                    {expandedId === 'history' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedId === 'history' && (
                    <div className="space-y-2">
                      {completedWorks.map((work) => (
                        <Card
                          key={work.id}
                          className={`p-3 ${
                            work.status === 'approved'
                              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {work.status === 'approved' ? (
                                  <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                                    ✅ Затверджено
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded">
                                    ❌ Відхилено
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-slate-800 dark:text-white mt-1">
                                {work.workName}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                👤 {getEmployeeName(work.userId)} • 📅 {work.date}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                              ₴{work.salary.toFixed(2)}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full mt-4">
          Закрити
        </Button>
      </DialogContent>
    </Dialog>
  );
}
