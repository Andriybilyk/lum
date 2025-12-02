import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PhotoUploadProps {
  label: string;
  photoUrl?: string;
  onPhotoChange: (photoUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function PhotoUpload({
  label,
  photoUrl,
  onPhotoChange,
  disabled = false,
  className = ''
}: PhotoUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Конвертуємо файл в base64 для попереднього перегляду та зберігання
  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Обробка завантаження файлу
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Перевірка типу файлу
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, оберіть файл зображення',
        variant: 'destructive'
      });
      return;
    }

    // Перевірка розміру (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'Помилка',
        description: 'Розмір файлу не повинен перевищувати 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Конвертуємо в base64
      const base64 = await convertToBase64(file);

      // Оновлюємо превью
      setPreviewUrl(base64);

      // Відправляємо base64 назад до батьківського компонента
      onPhotoChange(base64);

      toast({
        title: 'Успішно',
        description: 'Фото завантажено'
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити фото',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  }, [convertToBase64, onPhotoChange, toast]);

  // Видалення фото
  const handleRemovePhoto = useCallback(() => {
    setPreviewUrl(null);
    onPhotoChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [onPhotoChange]);

  // Відкрити вибір файлу
  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Відкрити камеру
  const handleOpenCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
        {label}
      </label>

      {previewUrl ? (
        // Показуємо завантажене фото
        <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-700">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemovePhoto}
              disabled={disabled || isUploading}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </Card>
      ) : (
        // Показуємо кнопки для завантаження
        <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Додайте фото {label.toLowerCase()}
            </p>

            <div className="flex gap-2 w-full">
              {/* Кнопка камери (мобільні пристрої) */}
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenCamera}
                disabled={disabled || isUploading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Камера
              </Button>

              {/* Кнопка вибору файлу */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFile}
                disabled={disabled || isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Вибрати
              </Button>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Завантаження...</span>
              </div>
            )}
          </div>

          {/* Прихований input для камери */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {/* Прихований input для вибору файлу */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </Card>
      )}

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Підтримуються: JPG, PNG, WebP (макс. 5MB)
      </p>
    </div>
  );
}
