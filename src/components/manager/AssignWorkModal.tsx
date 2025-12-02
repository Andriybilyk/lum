import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface AssignWorkModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AssignWorkModal({ open, onClose }: AssignWorkModalProps) {
  const { user } = useUser();
  const { users, objects, addAssignment } = useData();
  const { toast } = useToast();
  
  // Фільтруємо працівників + додаємо самого менеджера
  const employees = users.filter(u => u.role === 'employee');
  const assignableUsers = user ? [...employees, user] : employees;

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    object: '',
    description: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedUser = assignableUsers.find(emp => emp.id === formData.employeeId);
    
    await addAssignment({
      employeeId: formData.employeeId,
      managerId: user?.id || '',
      date: formData.date,
      description: `${formData.object}: ${formData.description}`,
      notes: formData.notes,
      status: 'pending'
    });
    
    toast({
      title: 'Роботу Призначено',
      description: `Завдання для ${assignedUser?.name} на ${formData.object} успішно створено`
    });

    setFormData({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      object: '',
      description: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            Призначити Роботу
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="employee" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Працівник</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger id="employee" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Оберіть працівника" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {user && (
                  <SelectItem key={user.id} value={user.id} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    {user.name} (Я - Менеджер)
                  </SelectItem>
                )}
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    {emp.name} ({emp.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Дата Виконання</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="object" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Об'єкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger id="object" className="mt-1.5 h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name} className="h-11 sm:h-12 text-sm sm:text-base cursor-pointer">
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Опис Роботи</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Детальний опис завдання..."
              required
              className="mt-1.5 min-h-[100px] text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Додаткові Примітки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Додаткова інформація..."
              className="mt-1.5 min-h-[80px] text-sm sm:text-base"
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold">
              Скасувати
            </Button>
            <Button type="submit" className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg active:scale-95 transition-transform">
              ✓ Призначити
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}