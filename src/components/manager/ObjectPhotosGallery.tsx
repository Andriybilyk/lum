import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, MapPin, Filter, Image as ImageIcon } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import PhotoGallery from '@/components/shared/PhotoGallery';

interface ObjectPhotosGalleryProps {
  open: boolean;
  onClose: () => void;
}

export default function ObjectPhotosGallery({ open, onClose }: ObjectPhotosGalleryProps) {
  const { objects } = useData();

  // Фільтри
  const [filterObject, setFilterObject] = useState<string>('all');

  // Збираємо всі фото з усіх об'єктів
  const allPhotos = useMemo(() => {
    const photos: Array<{
      url: string;
      label: string;
      timestamp?: string;
      objectId: string;
      objectName: string;
    }> = [];

    objects.forEach((obj) => {
      if (!obj.photos || obj.photos.length === 0) return;

      // Фільтр по об'єкту
      if (filterObject !== 'all' && obj.id !== filterObject) return;

      obj.photos.forEach((photo) => {
        photos.push({
          url: photo.url,
          label: `📍 ${obj.name} | ${photo.label}`,
          timestamp: photo.uploadedAt,
          objectId: obj.id,
          objectName: obj.name
        });
      });
    });

    // Сортуємо за датою (найновіші спочатку)
    return photos.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });
  }, [objects, filterObject]);

  // Статистика
  const stats = useMemo(() => {
    const objectsWithPhotos = objects.filter(
      obj => obj.photos && obj.photos.length > 0
    );

    const totalPhotos = objects.reduce(
      (sum, obj) => sum + (obj.photos?.length || 0),
      0
    );

    return {
      totalPhotos,
      objectsWithPhotos: objectsWithPhotos.length,
      totalObjects: objects.length
    };
  }, [objects]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Camera className="w-6 h-6 text-indigo-600" />
            Галерея Фото Об'єктів
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <Card className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
              <Camera className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{stats.totalPhotos}</p>
              <p className="text-xs opacity-90">Всього Фото</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <MapPin className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">{stats.objectsWithPhotos}</p>
              <p className="text-xs opacity-90">Об'єктів з Фото</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <ImageIcon className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-2xl font-bold">
                {stats.objectsWithPhotos > 0
                  ? Math.round(stats.totalPhotos / stats.objectsWithPhotos)
                  : 0}
              </p>
              <p className="text-xs opacity-90">Середньо/Об'єкт</p>
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

            <div className="flex gap-3 items-end">
              {/* Фільтр по об'єкту */}
              <div className="flex-1">
                <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                  Об'єкт
                </label>
                <Select value={filterObject} onValueChange={setFilterObject}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Всі об'єкти ({stats.totalObjects})
                    </SelectItem>
                    {objects
                      .filter(obj => obj.photos && obj.photos.length > 0)
                      .map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.name} ({obj.photos?.length || 0} фото)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Кнопка скидання */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterObject('all')}
                className="h-10"
              >
                Скинути
              </Button>
            </div>
          </Card>

          {/* Галерея фото */}
          {allPhotos.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                {filterObject === 'all'
                  ? 'Немає фото для об'єктів'
                  : 'Немає фото для обраного об'єкта'}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Додайте фото через "Керування Об'єктами" → кнопка "📸 Фото"
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

          {/* Підказка */}
          {stats.objectsWithPhotos === 0 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Порада:</strong> Додавайте фото об'єктів для звітності клієнтам.
                Фото допоможуть документувати прогрес робіт та показувати результати.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Фото об'єктів зберігаються окремо від фото процесів працівників.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
