import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit2, FileText, Plane, MapPin, Calendar, User, Package, Search, Activity, DollarSign, Users, Clock, Wrench, TrendingUp, ArrowLeft } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import ObjectProcessesModal from './ObjectProcessesModal';
import LogMaterialsModal from '../employee/LogMaterialsModal';
import ObjectsQuickStats from './ObjectsQuickStats';
import type { ObjectType } from '@/types';

interface ManageObjectsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ExtendedObject extends ObjectType {
  plannedBudget?: number;
  materialsCost?: number;
}

export default function ManageObjectsModal({ open, onClose }: ManageObjectsModalProps) {
  const { objects, users, hours, processes, materials, addObject, updateObject, deleteObject } = useData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'low' | 'inactive'>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'hours' | 'budget' | 'deadline'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [newObject, setNewObject] = useState<ExtendedObject>({
    id: '',
    name: '',
    isBusinessTrip: false,
    maxHours: 160,
    address: '',
    managerId: '',
    startDate: '',
    endDate: '',
    plannedBudget: 0,
    materialsCost: 0,
    departmentId: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingObject, setEditingObject] = useState<ExtendedObject>({
    id: '',
    name: '',
    isBusinessTrip: false,
    maxHours: 160,
    address: '',
    managerId: '',
    startDate: '',
    endDate: '',
    plannedBudget: 0,
    materialsCost: 0,
    departmentId: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [detailsObject, setDetailsObject] = useState<{ id: string; name: string } | null>(null);
  const [materialsObject, setMaterialsObject] = useState<{ id: string; name: string } | null>(null);
  const [showWorkers, setShowWorkers] = useState<string | null>(null);

  // Статистика по об'єктах
  const objectStats = useMemo(() => {
    const stats: Record<string, {
      hoursCount: number;
      processCount: number;
      earnings: number;
      workers: Set<string>;
      materialsCost: number;
    }> = {};

    objects.forEach(obj => {
      stats[obj.name] = {
        hoursCount: 0,
        processCount: 0,
        earnings: 0,
        workers: new Set(),
        materialsCost: 0
      };
    });

    // Підрахунок годин
    hours.forEach(h => {
      if (stats[h.object]) {
        stats[h.object].hoursCount += h.hours;
        stats[h.object].earnings += h.salary;
        stats[h.object].workers.add(h.userId);
      }
    });

    // Підрахунок процесів
    processes.forEach(p => {
      if (p.object && stats[p.object]) {
        stats[p.object].processCount += 1;
        stats[p.object].earnings += p.salary;
        stats[p.object].workers.add(p.userId);
      }
    });

    // Підрахунок вартості матеріалів (якщо є)
    if (materials) {
      materials.forEach(m => {
        if (stats[m.object]) {
          // Якщо в матеріалів немає ціни, можна додати поле або використати умовну вартість
          stats[m.object].materialsCost += m.quantity * 10; // Умовно 10 грн за одиницю
        }
      });
    }

    return stats;
  }, [objects, hours, processes, materials]);

  // Список працівників на об'єкті
  const getObjectWorkers = useMemo(() => {
    return (objectName: string) => {
      const workerStats: Record<string, { name: string; hours: number; earnings: number; lastWork: string }> = {};

      hours.forEach(h => {
        if (h.object === objectName) {
          const user = users.find(u => u.id === h.userId);
          if (user) {
            if (!workerStats[h.userId]) {
              workerStats[h.userId] = {
                name: user.name,
                hours: 0,
                earnings: 0,
                lastWork: h.date
              };
            }
            workerStats[h.userId].hours += h.hours;
            workerStats[h.userId].earnings += h.salary;
            if (h.date > workerStats[h.userId].lastWork) {
              workerStats[h.userId].lastWork = h.date;
            }
          }
        }
      });

      processes.forEach(p => {
        if (p.object === objectName) {
          const user = users.find(u => u.id === p.userId);
          if (user) {
            if (!workerStats[p.userId]) {
              workerStats[p.userId] = {
                name: user.name,
                hours: 0,
                earnings: 0,
                lastWork: p.date
              };
            }
            workerStats[p.userId].earnings += p.salary;
            if (p.date > workerStats[p.userId].lastWork) {
              workerStats[p.userId].lastWork = p.date;
            }
          }
        }
      });

      return Object.values(workerStats).sort((a, b) => b.earnings - a.earnings);
    };
  }, [hours, processes, users]);

  // Фільтрація та сортування об'єктів
  const filteredObjects = useMemo(() => {
    let filtered = objects.filter(obj =>
      obj.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Фільтр за статусом
    if (filterStatus !== 'all') {
      filtered = filtered.filter(obj => {
        const status = getObjectStatus(obj);
        return status.status === filterStatus;
      });
    }

    // Фільтр за менеджером
    if (filterManager !== 'all') {
      filtered = filtered.filter(obj => obj.managerId === filterManager);
    }

    // Сортування
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'hours':
          const aHours = objectStats[a.name]?.hoursCount || 0;
          const bHours = objectStats[b.name]?.hoursCount || 0;
          compareValue = aHours - bHours;
          break;
        case 'budget':
          const aBudget = (objectStats[a.name]?.earnings || 0) + (objectStats[a.name]?.materialsCost || 0);
          const bBudget = (objectStats[b.name]?.earnings || 0) + (objectStats[b.name]?.materialsCost || 0);
          compareValue = aBudget - bBudget;
          break;
        case 'deadline':
          const aDate = (a as ExtendedObject).endDate || '9999-12-31';
          const bDate = (b as ExtendedObject).endDate || '9999-12-31';
          compareValue = aDate.localeCompare(bDate);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [objects, searchQuery, filterStatus, filterManager, sortBy, sortOrder, objectStats]);

  // Менеджери для вибору
  const managers = users.filter(u => u.role === 'manager');

  const getObjectStatus = (obj: any) => {
    const stats = objectStats[obj.name];
    if (!stats) return { status: 'inactive', color: 'bg-gray-400', label: 'Неактивний' };

    const totalActivity = stats.hoursCount + stats.processCount;
    if (totalActivity === 0) return { status: 'inactive', color: 'bg-gray-400', label: 'Неактивний' };
    if (totalActivity < 10) return { status: 'low', color: 'bg-yellow-500', label: 'Низька активність' };
    return { status: 'active', color: 'bg-green-500', label: 'Активний' };
  };

  const getHoursProgress = (obj: any) => {
    const stats = objectStats[obj.name];
    const maxHours = obj.maxHours || 160;
    const currentHours = stats?.hoursCount || 0;
    return Math.min((currentHours / maxHours) * 100, 100);
  };

  const getBudgetProgress = (obj: ExtendedObject) => {
    const stats = objectStats[obj.name];
    const planned = obj.plannedBudget || 0;
    const actual = (stats?.earnings || 0) + (stats?.materialsCost || 0);

    if (planned === 0) return { percent: 0, status: 'unknown', actual, planned };

    const percent = (actual / planned) * 100;
    let status = 'good';
    if (percent > 100) status = 'over';
    else if (percent > 80) status = 'warning';

    return { percent: Math.min(percent, 100), status, actual, planned };
  };

  const handleAddObject = async () => {
    if (!newObject.name.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву об\'єкту',
        variant: 'destructive'
      });
      return;
    }

    await addObject({
      name: newObject.name.trim(),
      isBusinessTrip: newObject.isBusinessTrip,
      maxHours: newObject.maxHours,
      address: newObject.address,
      managerId: newObject.managerId,
      startDate: newObject.startDate,
      endDate: newObject.endDate,
      plannedBudget: newObject.plannedBudget,
      materialsCost: newObject.materialsCost
    } as any);

    toast({
      title: 'Успішно',
      description: `Об'єкт "${newObject.name}" додано`
    });

    setNewObject({
      id: '',
      name: '',
      isBusinessTrip: false,
      maxHours: 160,
      address: '',
      managerId: '',
      startDate: '',
      endDate: '',
      plannedBudget: 0,
      materialsCost: 0,
      departmentId: ''
    });
  };

  const handleStartEdit = (obj: any) => {
    setEditingId(obj.id);
    setEditingObject({
      id: obj.id,
      name: obj.name,
      isBusinessTrip: obj.isBusinessTrip || false,
      maxHours: obj.maxHours || 160,
      address: obj.address || '',
      managerId: obj.managerId || '',
      startDate: obj.startDate || '',
      endDate: obj.endDate || '',
      plannedBudget: obj.plannedBudget || 0,
      materialsCost: obj.materialsCost || 0,
      departmentId: obj.departmentId || ''
    });
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

    await updateObject(editingId!, {
      name: editingObject.name.trim(),
      isBusinessTrip: editingObject.isBusinessTrip,
      maxHours: editingObject.maxHours,
      address: editingObject.address,
      managerId: editingObject.managerId,
      startDate: editingObject.startDate,
      endDate: editingObject.endDate,
      plannedBudget: editingObject.plannedBudget,
      materialsCost: editingObject.materialsCost
    } as any);

    toast({
      title: 'Успішно',
      description: `Об'єкт оновлено`
    });

    setEditingId(null);
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
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
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
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                Керування Об'єктами
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Швидка статистика */}
            <ObjectsQuickStats objects={objects} objectStats={objectStats} />

            {/* Пошук */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Пошук об'єктів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Фільтри та Сортування */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Фільтр за статусом */}
              <div>
                <Label className="text-xs mb-1 block">Статус</Label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="all">Всі</option>
                  <option value="active">🟢 Активні</option>
                  <option value="low">🟡 Низька активність</option>
                  <option value="inactive">⚪ Неактивні</option>
                </select>
              </div>

              {/* Фільтр за менеджером */}
              <div>
                <Label className="text-xs mb-1 block">Менеджер</Label>
                <select
                  value={filterManager}
                  onChange={(e) => setFilterManager(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="all">Всі менеджери</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Сортування */}
              <div>
                <Label className="text-xs mb-1 block">Сортувати за</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="name">Назвою</option>
                  <option value="hours">Годинами</option>
                  <option value="budget">Бюджетом</option>
                  <option value="deadline">Дедлайном</option>
                </select>
              </div>

              {/* Порядок сортування */}
              <div>
                <Label className="text-xs mb-1 block">Порядок</Label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-800"
                >
                  <option value="asc">↑ Зростання</option>
                  <option value="desc">↓ Спадання</option>
                </select>
              </div>
            </div>

            {/* Список об'єктів */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Існуючі Об'єкти ({filteredObjects.length})</Label>
              {filteredObjects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {searchQuery ? 'Нічого не знайдено' : 'Немає об\'єктів. Додайте перший!'}
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredObjects.map((obj) => {
                    const status = getObjectStatus(obj);
                    const stats = objectStats[obj.name];
                    const hoursProgress = getHoursProgress(obj);
                    const budgetInfo = getBudgetProgress(obj as ExtendedObject);
                    const isEditing = editingId === obj.id;
                    const manager = managers.find(m => m.id === obj.managerId);
                    const workers = getObjectWorkers(obj.name);

                    return (
                      <Card key={obj.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                        {isEditing ? (
                          // Режим редагування
                          <div className="space-y-3">
                            <Input
                              value={editingObject.name}
                              onChange={(e) => setEditingObject({ ...editingObject, name: e.target.value })}
                              placeholder="Назва об'єкта"
                              className="font-semibold"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Макс. годин</Label>
                                <Input
                                  type="number"
                                  value={editingObject.maxHours || ''}
                                  onChange={(e) => setEditingObject({ ...editingObject, maxHours: Number(e.target.value) })}
                                  placeholder="160"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Бюджет (грн)</Label>
                                <Input
                                  type="number"
                                  value={editingObject.plannedBudget || ''}
                                  onChange={(e) => setEditingObject({ ...editingObject, plannedBudget: Number(e.target.value) })}
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Адреса</Label>
                              <Input
                                value={editingObject.address || ''}
                                onChange={(e) => setEditingObject({ ...editingObject, address: e.target.value })}
                                placeholder="Вул. ..."
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Менеджер</Label>
                              <select
                                value={editingObject.managerId || ''}
                                onChange={(e) => setEditingObject({ ...editingObject, managerId: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                              >
                                <option value="">Не вибрано</option>
                                {managers.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Дата початку</Label>
                                <Input
                                  type="date"
                                  value={editingObject.startDate || ''}
                                  onChange={(e) => setEditingObject({ ...editingObject, startDate: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Дедлайн</Label>
                                <Input
                                  type="date"
                                  value={editingObject.endDate || ''}
                                  onChange={(e) => setEditingObject({ ...editingObject, endDate: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={editingObject.isBusinessTrip || false}
                                onCheckedChange={(checked) => setEditingObject({ ...editingObject, isBusinessTrip: checked as boolean })}
                              />
                              <Label className="text-sm flex items-center gap-1">
                                <Plane className="w-4 h-4" />
                                Відрядження
                              </Label>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                                Зберегти
                              </Button>
                              <Button onClick={() => setEditingId(null)} size="sm" variant="outline" className="flex-1">
                                Скасувати
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Режим перегляду
                          <div className="space-y-3">
                            {/* Заголовок */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{obj.name}</h3>
                                  {obj.isBusinessTrip && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Plane className="w-3 h-3 mr-1" />
                                      Відрядження
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                  <span className="text-xs text-slate-600 dark:text-slate-400">{status.label}</span>
                                </div>
                              </div>
                            </div>

                            {/* Мета-інформація */}
                            {(obj.address || manager) && (
                              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                                {obj.address && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{obj.address}</span>
                                  </div>
                                )}
                                {manager && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>Менеджер: {manager.name}</span>
                                  </div>
                                )}
                                {(obj.startDate || obj.endDate) && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {obj.startDate && new Date(obj.startDate).toLocaleDateString('uk-UA')}
                                      {obj.startDate && obj.endDate && ' - '}
                                      {obj.endDate && new Date(obj.endDate).toLocaleDateString('uk-UA')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Статистика */}
                            <div className="grid grid-cols-4 gap-2">
                              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                </div>
                                <div className="text-lg font-bold text-blue-600">{stats?.hoursCount || 0}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">годин</div>
                              </div>
                              <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Wrench className="w-3 h-3 text-purple-600" />
                                </div>
                                <div className="text-lg font-bold text-purple-600">{stats?.processCount || 0}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">процесів</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                </div>
                                <div className="text-lg font-bold text-green-600">{(stats?.earnings || 0).toFixed(0)}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">грн</div>
                              </div>
                              <div
                                className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                onClick={() => setShowWorkers(showWorkers === obj.name ? null : obj.name)}
                              >
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Users className="w-3 h-3 text-orange-600" />
                                </div>
                                <div className="text-lg font-bold text-orange-600">{stats?.workers.size || 0}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">працівників</div>
                              </div>
                            </div>

                            {/* Список працівників */}
                            {showWorkers === obj.name && workers.length > 0 && (
                              <Card className="p-3 bg-slate-50 dark:bg-slate-800">
                                <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Працівники на об'єкті:
                                </div>
                                <div className="space-y-1">
                                  {workers.map((worker, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                      <span className="font-medium">{worker.name}</span>
                                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <span>{worker.hours}год</span>
                                        <span className="font-semibold text-green-600">{worker.earnings.toFixed(0)} грн</span>
                                        <span className="text-xs">{new Date(worker.lastWork).toLocaleDateString('uk-UA')}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            )}

                            {/* Прогрес годин */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600 dark:text-slate-400">Години</span>
                                <span className="font-semibold">
                                  {stats?.hoursCount || 0} / {obj.maxHours || 160} ({hoursProgress.toFixed(0)}%)
                                </span>
                              </div>
                              <Progress value={hoursProgress} className="h-2" />
                            </div>

                            {/* Бюджет */}
                            {(obj as ExtendedObject).plannedBudget ? (
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Бюджет
                                  </span>
                                  <span className={`font-semibold ${budgetInfo.status === 'over' ? 'text-red-600' : budgetInfo.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {budgetInfo.actual.toFixed(0)} / {budgetInfo.planned.toFixed(0)} грн ({budgetInfo.percent.toFixed(0)}%)
                                  </span>
                                </div>
                                <Progress
                                  value={budgetInfo.percent}
                                  className={`h-2 ${budgetInfo.status === 'over' ? '[&>div]:bg-red-600' : budgetInfo.status === 'warning' ? '[&>div]:bg-yellow-600' : ''}`}
                                />
                                {budgetInfo.status === 'over' && (
                                  <p className="text-xs text-red-600 mt-1">⚠️ Перевищення бюджету на {(budgetInfo.actual - budgetInfo.planned).toFixed(0)} грн</p>
                                )}
                              </div>
                            ) : null}

                            {/* Дії */}
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDetailsObject({ id: obj.id, name: obj.name })}
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Звіт
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMaterialsObject({ id: obj.id, name: obj.name })}
                                className="text-xs"
                              >
                                <Package className="w-3 h-3 mr-1" />
                                Матеріали
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(obj)}
                                className="text-xs"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Редагувати
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm({ id: obj.id, name: obj.name })}
                                className="text-xs"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Видалити
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Форма додавання нового об'єкта */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Додати Новий Об'єкт</Label>
              <div className="space-y-3">
                <div>
                  <Label>Назва об'єкта *</Label>
                  <Input
                    value={newObject.name}
                    onChange={(e) => setNewObject({ ...newObject, name: e.target.value })}
                    placeholder="Наприклад: Квартира №5, Будинок А"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Максимум годин</Label>
                    <Input
                      type="number"
                      value={newObject.maxHours || ''}
                      onChange={(e) => setNewObject({ ...newObject, maxHours: Number(e.target.value) })}
                      placeholder="160"
                    />
                  </div>
                  <div>
                    <Label>Плановий бюджет (грн)</Label>
                    <Input
                      type="number"
                      value={newObject.plannedBudget || ''}
                      onChange={(e) => setNewObject({ ...newObject, plannedBudget: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Адреса</Label>
                  <Input
                    value={newObject.address || ''}
                    onChange={(e) => setNewObject({ ...newObject, address: e.target.value })}
                    placeholder="Вул. Хрещатик, 1"
                  />
                </div>

                <div>
                  <Label>Відповідальний менеджер</Label>
                  <select
                    value={newObject.managerId || ''}
                    onChange={(e) => setNewObject({ ...newObject, managerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Не вибрано</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Дата початку</Label>
                    <Input
                      type="date"
                      value={newObject.startDate || ''}
                      onChange={(e) => setNewObject({ ...newObject, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Дедлайн</Label>
                    <Input
                      type="date"
                      value={newObject.endDate || ''}
                      onChange={(e) => setNewObject({ ...newObject, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newObject.isBusinessTrip || false}
                    onCheckedChange={(checked) => setNewObject({ ...newObject, isBusinessTrip: checked as boolean })}
                  />
                  <Label className="flex items-center gap-1">
                    <Plane className="w-4 h-4" />
                    Відрядження
                  </Label>
                </div>

                <Button onClick={handleAddObject} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Додати Об'єкт
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Діалог видалення */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити об'єкт?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити об'єкт "{deleteConfirm?.name}"? Ця дія незворотна.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteObject}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Модалки деталей та матеріалів */}
      {detailsObject && (
        <ObjectProcessesModal
          open={!!detailsObject}
          onClose={() => setDetailsObject(null)}
          objectId={detailsObject.id}
          objectName={detailsObject.name}
        />
      )}

      {materialsObject && (
        <LogMaterialsModal
          open={!!materialsObject}
          onClose={() => setMaterialsObject(null)}
          preselectedObject={materialsObject.name}
        />
      )}
    </>
  );
}
