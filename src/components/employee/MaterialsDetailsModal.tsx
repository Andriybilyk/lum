import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface MaterialsDetailsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  month: string;
  year: string;
}

export default function MaterialsDetailsModal({ open, onClose, userId, month, year }: MaterialsDetailsModalProps) {
  const { materials, deleteMaterial } = useData();
  const { toast } = useToast();

  const userMaterials = useMemo(() => {
    return materials.filter(m => {
      if (m.userId !== userId) return false;
      const materialDate = new Date(m.date);
      const materialMonth = (materialDate.getMonth() + 1).toString().padStart(2, '0');
      const materialYear = materialDate.getFullYear().toString();
      return materialMonth === month && materialYear === year;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [materials, userId, month, year]);

  const handleDelete = async (id: string, materialName: string) => {
    if (confirm(`Видалити матеріал "${materialName}"?`)) {
      try {
        await deleteMaterial(id);
        toast({
          title: 'Успішно',
          description: `Матеріал "${materialName}" видалено`
        });
      } catch (error) {
        toast({
          title: 'Помилка',
          description: 'Не вдалося видалити матеріал',
          variant: 'destructive'
        });
      }
    }
  };

  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" />
            <span className="truncate">📦 Матеріали - {months[parseInt(month) - 1]} {year}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 sm:space-y-3">
          {userMaterials.length === 0 ? (
            <Card className="p-6 sm:p-8">
              <div className="text-center">
                <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  Немає записів про матеріали за цей місяць
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                <p className="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200">
                  📦 Всього записів: {userMaterials.length}
                </p>
              </div>

              {userMaterials.map((material) => (
                <Card
                  key={material.id}
                  className="p-3 sm:p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                            {material.materialName}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            📅 {material.date} • 🏢 {material.object}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                        <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400">
                          {material.quantity} {material.unit}
                        </p>
                      </div>

                      {material.notes && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            📝 {material.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material.id, material.materialName)}
                      className="text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20 h-9 sm:h-10 px-3 sm:px-4 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Видалити</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
