import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface Photo {
  url: string;
  label: string;
  timestamp?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  className?: string;
}

export default function PhotoGallery({ photos, className = '' }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevPhoto();
    if (e.key === 'ArrowRight') handleNextPhoto();
    if (e.key === 'Escape') setSelectedPhotoIndex(null);
  };

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
        {photos.map((photo, index) => (
          <Card
            key={index}
            className="relative overflow-hidden cursor-pointer group border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <div className="relative">
              <img
                src={photo.url}
                alt={photo.label}
                className="w-full h-32 sm:h-40 object-cover"
              />

              {/* Оверлей при ховері */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Лейбл */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">
                  {photo.label}
                </p>
                {photo.timestamp && (
                  <p className="text-white/70 text-[10px]">
                    {new Date(photo.timestamp).toLocaleString('uk-UA', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Модальне вікно з повним розміром фото */}
      <Dialog
        open={selectedPhotoIndex !== null}
        onOpenChange={() => setSelectedPhotoIndex(null)}
      >
        <DialogContent
          className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {selectedPhotoIndex !== null && (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              {/* Закрити */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhotoIndex(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Попереднє фото */}
              {selectedPhotoIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12 p-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {/* Наступне фото */}
              {selectedPhotoIndex < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12 p-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Фото */}
              <img
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].label}
                className="max-w-full max-h-full object-contain"
              />

              {/* Інфо внизу */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6">
                <p className="text-white text-lg font-semibold">
                  {photos[selectedPhotoIndex].label}
                </p>
                {photos[selectedPhotoIndex].timestamp && (
                  <p className="text-white/80 text-sm mt-1">
                    {new Date(photos[selectedPhotoIndex].timestamp).toLocaleString('uk-UA', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-2">
                  Фото {selectedPhotoIndex + 1} з {photos.length}
                  {selectedPhotoIndex > 0 && ' • ← Попереднє'}
                  {selectedPhotoIndex < photos.length - 1 && ' • Наступне →'}
                  {' • ESC - Закрити'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
