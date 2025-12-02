import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Camera, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import PhotoUpload from '@/components/shared/PhotoUpload';
import PhotoGallery from '@/components/shared/PhotoGallery';
import type { ObjectType, ObjectPhoto } from '@/types';

interface ObjectPhotosManagerProps {
  open: boolean;
  onClose: () => void;
  object: ObjectType;
  onSave: (photos: ObjectPhoto[]) => Promise<void>;
}

export default function ObjectPhotosManager({
  open,
  onClose,
  object,
  onSave
}: ObjectPhotosManagerProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [photos, setPhotos] = useState<ObjectPhoto[]>(object.photos || []);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const [newPhotoLabel, setNewPhotoLabel] = useState('');
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPhoto = () => {
    if (!newPhotoUrl || !newPhotoLabel.trim()) {
      toast({
        title: 'Помилка',
        description: 'Додайте фото та вкажіть підпис',
        variant: 'destructive'
      });
      return;
    }

    const newPhoto: ObjectPhoto = {
      url: newPhotoUrl,
      label: newPhotoLabel.trim(),
      uploadedBy: user?.id || '',
      uploadedAt: new Date().toISOString()
    };

    setPhotos([...photos, newPhoto]);
    setNewPhotoUrl(null);
    setNewPhotoLabel('');
    setIsAddingPhoto(false);

    toast({
      title: 'Успішно',
      description: 'Фото додано'
    });
  };

  const handleDeletePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);

    toast({
      title: 'Успішно',
      description: 'Фото видалено'
    });
  };

  const handleEditLabel = (index: number) => {
    setEditingPhotoIndex(index);
    setEditingLabel(photos[index].label);
  };

  const handleSaveLabel = () => {
    if (editingPhotoIndex === null) return;

    const updatedPhotos = [...photos];
    updatedPhotos[editingPhotoIndex] = {
      ...updatedPhotos[editingPhotoIndex],
      label: editingLabel.trim()
    };

    setPhotos(updatedPhotos);
    setEditingPhotoIndex(null);
    setEditingLabel('');

    toast({
      title: 'Успішно',
      description: 'Підпис оновлено'
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(photos);

      toast({
        title: 'Успішно',
        description: `Збережено ${photos.length} фото для об\'єкта "${object.name}"`
      });

      onClose();
    } catch (error) {
      console.error('Error saving photos:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти фото',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const galleryPhotos = photos.map((photo, index) => ({
    url: photo.url,
    label: `${index + 1}. ${photo.label}`,
    timestamp: photo.uploadedAt
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Camera className="w-6 h-6 text-indigo-600" />
            Фото Об'єкта: {object.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Статистика */}
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Фото об\'єкта</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {photos.length}
                </p>
              </div>
              <Camera className="w-12 h-12 text-indigo-300 dark:text-indigo-700" />
            </div>
            {object.address && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                📍 {object.address}
              </p>
            )}
          </Card>

          {/* Кнопка додати нове фото */}
          {!isAddingPhoto && (
            <Button
              onClick={() => setIsAddingPhoto(true)}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Додати Нове Фото
            </Button>
          )}

          {/* Форма додавання фото */}
          {isAddingPhoto && (
            <Card className="p-4 border-2 border-indigo-300 dark:border-indigo-700">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Нове Фото
              </h3>

              <div className="space-y-4">
                <PhotoUpload
                  label="Виберіть фото"
                  photoUrl={newPhotoUrl || undefined}
                  onPhotoChange={setNewPhotoUrl}
                />

                <div>
                  <Label htmlFor="new-photo-label">
                    Підпис до фото
                  </Label>
                  <Input
                    id="new-photo-label"
                    value={newPhotoLabel}
                    onChange={(e) => setNewPhotoLabel(e.target.value)}
                    placeholder="Наприклад: Фасад будівлі, Інтер'єр, Загальний вигляд..."
                    className="mt-1.5"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddPhoto}
                    disabled={!newPhotoUrl || !newPhotoLabel.trim()}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Додати
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingPhoto(false);
                      setNewPhotoUrl(null);
                      setNewPhotoLabel('');
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Скасувати
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Список фото */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">
                Фото ({photos.length})
              </h3>

              {/* Менеджмент кожного фото */}
              <div className="space-y-2">
                {photos.map((photo, index) => (
                  <Card key={index} className="p-3 border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      {/* Мініатюра */}
                      <div className="flex-shrink-0">
                        <img
                          src={photo.url}
                          alt={photo.label}
                          className="w-20 h-20 object-cover rounded border-2 border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      {/* Інфо та дії */}
                      <div className="flex-1 min-w-0">
                        {editingPhotoIndex === index ? (
                          // Редагування підпису
                          <div className="space-y-2">
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveLabel}
                                className="h-8 bg-green-600 hover:bg-green-700"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Зберегти
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPhotoIndex(null);
                                  setEditingLabel('');
                                }}
                                className="h-8"
                              >
                                Скасувати
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Перегляд
                          <>
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {index + 1}. {photo.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(photo.uploadedAt).toLocaleString('uk-UA', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>

                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditLabel(index)}
                                className="h-8"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Редагувати
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePhoto(index)}
                                className="h-8"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Видалити
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Галерея */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  Попередній перегляд
                </h3>
                <PhotoGallery photos={galleryPhotos} />
              </div>
            </div>
          )}

          {photos.length === 0 && !isAddingPhoto && (
            <Card className="p-8 text-center border-dashed">
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                Немає фото для цього об\'єкта
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Додайте фото об\'єкта для звітності клієнтам
              </p>
            </Card>
          )}

          {/* Кнопки дій */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Збереження...' : 'Зберегти Всі Фото'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
