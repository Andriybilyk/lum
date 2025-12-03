import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Calendar, User, MapPin, Filter, Plus, Edit2, Image } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import PhotoGallery from '@/components/shared/PhotoGallery';
import PhotoUpload from '@/components/shared/PhotoUpload';
import type { Process } from '@/types';

interface PhotoReportsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PhotoReportsModal({ open, onClose }: PhotoReportsModalProps) {
  const { processes, users, objects, updateProcess } = useData();
  const { toast } = useToast();

  // Фільтри
  const [filterObject, setFilterObject] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30'); // днів

  // Стан для редагування фото процесу
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [photoBefore, setPhotoBefore] = useState<string | null>(null);
  const [photoDuring, setPhotoDuring] = useState<string | null>(null);
  const [photoAfter, setPhotoAfter] = useState<string | null>(null);

  // Отримуємо всі процеси (з фото та без)
  const filteredProcesses = useMemo(() => {
    const now = new Date();
    const periodDays = parseInt(filterPeriod);
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return processes.filter(p => {
      // Фільтр по об'єкту
      if (filterObject !== 'all' && p.object !== filterObject) return false;

      // Фільтр по користувачу
      if (filterUser !== 'all' && p.userId !== filterUser) return false;

      // Фільтр по періоду
      const processDate = new Date(p.date);
      if (processDate < cutoffDate) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [processes, filterObject, filterUser, filterPeriod]);

  // Процеси з фото та без фото
  const processesWithPhotos = filteredProcesses.filter(p => p.photoBefore || p.photoDuring || p.photoAfter);
  const processesWithoutPhotos = filteredProcesses.filter(p => !p.photoBefore && !p.photoDuring && !p.photoAfter);

  // Збираємо всі фото для галереї
  const allPhotos = useMemo(() => {
    const photos: Array<{
      url: string;
      label: string;
      timestamp?: string;
    }> = [];

    processesWithPhotos.forEach((process) => {
      const user = users.find(u => u.id === process.userId);
      const userName = user?.name || 'Невідомий';
      const processDate = new Date(process.date).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      if (process.photoBefore) {
        photos.push({
          url: process.photoBefore,
          label: `📍 ${process.object} | 👤 ${userName} | ${process.processName} - ДО ПОЧАТКУ (${processDate})`,
          timestamp: process.photosUploadedAt
        });
      }

      if (process.photoDuring) {
        photos.push({
          url: process.photoDuring,
          label: `📍 ${process.object} | 👤 ${userName} | ${process.processName} - ПІД ЧАС (${processDate})`,
          timestamp: process.photosUploadedAt
        });
      }

      if (process.photoAfter) {
        photos.push({
          url: process.photoAfter,
          label: `📍 ${process.object} | 👤 ${userName} | ${process.processName} - ПІСЛЯ (${processDate})`,
          timestamp: process.photosUploadedAt
        });
      }
    });

    // Сортуємо за датою (найновіші спочатку)
    return photos.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });
  }, [processesWithPhotos, users]);

  // Статистика
  const stats = useMemo(() => {
    return {
      totalPhotos: allPhotos.length,
      processesWithPhotos: processesWithPhotos.length,
      processesWithoutPhotos: processesWithoutPhotos.length,
      totalProcesses: filteredProcesses.length
    };
  }, [allPhotos, processesWithPhotos, processesWithoutPhotos, filteredProcesses]);

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process);
    setPhotoBefore(process.photoBefore || null);
    setPhotoDuring(process.photoDuring || null);
    setPhotoAfter(process.photoAfter || null);
  };

  const handleSavePhotos = async () => {
    if (!editingProcess) return;

    try {
      await updateProcess(editingProcess.id, {
        photoBefore: photoBefore || undefined,
        photoDuring: photoDuring || undefined,
        photoAfter: photoAfter || undefined,
        photosUploadedAt: new Date().toISOString()
      });

      const photoCount = [photoBefore, photoDuring, photoAfter].filter(Boolean).length;

      toast({
        title: 'Успішно',
        description: `Фото оновлено (${photoCount} фото)`
      });

      setEditingProcess(null);
      setPhotoBefore(null);
      setPhotoDuring(null);
      setPhotoAfter(null);
    } catch (error) {
      console.error('Error saving photos:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти фото',
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingProcess(null);
    setPhotoBefore(null);
    setPhotoDuring(null);
    setPhotoAfter(null);
  };

  return (
    <>
      <Dialog open={open && !editingProcess} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <Camera className="w-6 h-6 text-purple-600" />
              Фото Робіт
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="processes" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="processes" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Фото Процесів
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Загальні Фото
              </TabsTrigger>
            </TabsList>

            <TabsContent value="processes" className="space-y-4">
            {/* Статистика */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Card className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Camera className="w-5 h-5 mb-1 opacity-80" />
                <p className="text-2xl font-bold">{stats.totalPhotos}</p>
                <p className="text-xs opacity-90">Всього Фото</p>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                <Calendar className="w-5 h-5 mb-1 opacity-80" />
                <p className="text-2xl font-bold">{stats.processesWithPhotos}</p>
                <p className="text-xs opacity-90">З Фото</p>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <MapPin className="w-5 h-5 mb-1 opacity-80" />
                <p className="text-2xl font-bold">{stats.processesWithoutPhotos}</p>
                <p className="text-xs opacity-90">Без Фото</p>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <User className="w-5 h-5 mb-1 opacity-80" />
                <p className="text-2xl font-bold">{stats.totalProcesses}</p>
                <p className="text-xs opacity-90">Всього</p>
              </Card>
            </div>

            {/* Фільтри */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Фільтри
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Фільтр по об'єкту */}
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                    Об'єкт
                  </label>
                  <Select value={filterObject} onValueChange={setFilterObject}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі об'єкти</SelectItem>
                      {objects.map((obj) => (
                        <SelectItem key={obj.id} value={obj.name}>
                          {obj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Фільтр по користувачу */}
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                    Працівник
                  </label>
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі працівники</SelectItem>
                      {users
                        .filter(u => u.role === 'employee')
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Фільтр по періоду */}
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                    Період
                  </label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Останні 7 днів</SelectItem>
                      <SelectItem value="30">Останні 30 днів</SelectItem>
                      <SelectItem value="90">Останні 3 місяці</SelectItem>
                      <SelectItem value="365">Останній рік</SelectItem>
                      <SelectItem value="9999">Весь час</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterObject('all');
                    setFilterUser('all');
                    setFilterPeriod('30');
                  }}
                  className="text-xs"
                >
                  Скинути фільтри
                </Button>
              </div>
            </Card>

            {/* Процеси без фото */}
            {processesWithoutPhotos.length > 0 && (
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <h3 className="text-sm font-semibold mb-3 text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Процеси Без Фото ({processesWithoutPhotos.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {processesWithoutPhotos.slice(0, 10).map((process) => {
                    const user = users.find(u => u.id === process.userId);
                    return (
                      <div
                        key={process.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {process.processName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            📍 {process.object} | 👤 {user?.name} | 📅 {new Date(process.date).toLocaleDateString('uk-UA')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProcess(process)}
                          className="ml-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Додати Фото
                        </Button>
                      </div>
                    );
                  })}
                  {processesWithoutPhotos.length > 10 && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
                      Показано 10 з {processesWithoutPhotos.length}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Процеси з фото */}
            {processesWithPhotos.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Процеси З Фото ({processesWithPhotos.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {processesWithPhotos.slice(0, 10).map((process) => {
                    const user = users.find(u => u.id === process.userId);
                    const photoCount = [process.photoBefore, process.photoDuring, process.photoAfter].filter(Boolean).length;
                    return (
                      <div
                        key={process.id}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {process.processName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            📍 {process.object} | 👤 {user?.name} | 📅 {new Date(process.date).toLocaleDateString('uk-UA')} | 📸 {photoCount} фото
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProcess(process)}
                          className="ml-2"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Редагувати
                        </Button>
                      </div>
                    );
                  })}
                  {processesWithPhotos.length > 10 && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
                      Показано 10 з {processesWithPhotos.length}
                    </p>
                  )}
                </div>

                {/* Галерея всіх фото */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Всі Фото ({allPhotos.length})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Натисніть для збільшення
                    </p>
                  </div>
                  <PhotoGallery photos={allPhotos} />
                </div>
              </Card>
            )}

            {/* Порожній стан */}
            {filteredProcesses.length === 0 && (
              <Card className="p-8 text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  Немає процесів за обраними фільтрами
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Спробуйте змінити фільтри
                </p>
              </Card>
            )}
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <Card className="p-8 text-center">
                <Image className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">
                  Загальні Фото Робіт
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Тут будуть відображатися загальні фото з об'єктів, які не прив'язані до конкретних процесів
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  💡 Працівники зможуть завантажувати фото загального стану роботи, прогресу, проблем тощо
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Модальне вікно редагування фото процесу */}
      {editingProcess && (
        <Dialog open={true} onOpenChange={handleCancelEdit}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                📸 Фото для Процесу
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Інформація про процес */}
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                  {editingProcess.processName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  📍 {editingProcess.object} | 📅 {new Date(editingProcess.date).toLocaleDateString('uk-UA')}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  👤 {users.find(u => u.id === editingProcess.userId)?.name}
                </p>
              </Card>

              {/* Завантаження фото */}
              <div className="space-y-4">
                <PhotoUpload
                  label="Фото ПЕРЕД початком роботи"
                  photoUrl={photoBefore || undefined}
                  onPhotoChange={setPhotoBefore}
                />
                <PhotoUpload
                  label="Фото ПІД ЧАС виконання"
                  photoUrl={photoDuring || undefined}
                  onPhotoChange={setPhotoDuring}
                />
                <PhotoUpload
                  label="Фото ПІСЛЯ завершення"
                  photoUrl={photoAfter || undefined}
                  onPhotoChange={setPhotoAfter}
                />
              </div>

              {/* Підказка */}
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                💡 Фото допомагають контролювати якість робіт та документувати прогрес
              </p>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Скасувати
                </Button>
                <Button
                  onClick={handleSavePhotos}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Зберегти Фото
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
