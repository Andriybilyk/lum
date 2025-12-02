import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Calendar, User, MapPin, Filter } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import PhotoGallery from '@/components/shared/PhotoGallery';

interface PhotoReportsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PhotoReportsModal({ open, onClose }: PhotoReportsModalProps) {
  const { processes, users, objects } = useData();

  // Фільтри
  const [filterObject, setFilterObject] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30'); // днів

  // Отримуємо всі процеси з фото
  const processesWithPhotos = useMemo(() => {
    const now = new Date();
    const periodDays = parseInt(filterPeriod);
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return processes.filter(p => {
      // Має фото
      const hasPhotos = p.photoBefore || p.photoDuring || p.photoAfter;
      if (!hasPhotos) return false;

      // Фільтр по об'єкту
      if (filterObject !== 'all' && p.object !== filterObject) return false;

      // Фільтр по користувачу
      if (filterUser !== 'all' && p.userId !== filterUser) return false;

      // Фільтр по періоду
      const processDate = new Date(p.date);
      if (processDate < cutoffDate) return false;

      return true;
    });
  }, [processes, filterObject, filterUser, filterPeriod]);

  // Збираємо всі фото
  const allPhotos = useMemo(() => {
    const photos: Array<{
      url: string;
      label: string;
      timestamp?: string;
      processId: string;
      userId: string;
      object: string;
      date: string;
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
          label: `📍 ${process.object} | 👤 ${userName} | ${process.processName} - ДО ПОЧАТКУ`,
          timestamp: process.photosUploadedAt,
          processId: process.id,
          userId: process.userId,
          object: process.object || '',
          date: processDate
        });
      }

      if (process.photoDuring) {
        photos.push({
          url: process.photoDuring,
          label: `📍 ${process.object} | 👤 ${userName} | ${process.processName} - ПІД ЧАС`,
          timestamp: process.photosUploadedAt,
          processId: process.id,
          userId: process.userId,
          object: process.object || '',
          date: processDate
        });
      }

      if (process.photoAfter) {
        photos.push({
          url: process.photoAfter,
          label: `📍 ${process.object} | 👤 ${userName} | ${process.processName} - ПІСЛЯ`,
          timestamp: process.photosUploadedAt,
          processId: process.id,
          userId: process.userId,
          object: process.object || '',
          date: processDate
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
    const uniqueProcesses = new Set(allPhotos.map(p => p.processId)).size;
    const uniqueUsers = new Set(allPhotos.map(p => p.userId)).size;
    const uniqueObjects = new Set(allPhotos.map(p => p.object)).size;

    return {
      totalPhotos: allPhotos.length,
      uniqueProcesses,
      uniqueUsers,
      uniqueObjects
    };
  }, [allPhotos]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Camera className="w-6 h-6 text-purple-600" />
            Фото Звіти з Об'єктів
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Camera className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{stats.totalPhotos}</p>
              <p className="text-xs opacity-90">Всього Фото</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Calendar className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{stats.uniqueProcesses}</p>
              <p className="text-xs opacity-90">Процесів</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <User className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              <p className="text-xs opacity-90">Працівників</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <MapPin className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{stats.uniqueObjects}</p>
              <p className="text-xs opacity-90">Об'єктів</p>
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

          {/* Галерея фото */}
          {allPhotos.length === 0 ? (
            <Card className="p-8 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                Немає фото за обраними фільтрами
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Спробуйте змінити фільтри або попросіть працівників додавати фото до процесів
              </p>
            </Card>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Фото ({allPhotos.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Натисніть на фото для збільшення
                </p>
              </div>
              <PhotoGallery photos={allPhotos} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
