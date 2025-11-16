import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Призначити Роботу</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Працівник</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger id="employee" className="mt-1.5">
                <SelectValue placeholder="Оберіть працівника" />
              </SelectTrigger>
              <SelectContent>
                {user && (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} (Я - Менеджер)
                  </SelectItem>
                )}
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Дата Виконання</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="object">Об'єкт</Label>
            <Select
              value={formData.object}
              onValueChange={(value) => setFormData({ ...formData, object: value })}
            >
              <SelectTrigger id="object" className="mt-1.5">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent>
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name}>
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Опис Роботи</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Детальний опис завдання..."
              required
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="notes">Додаткові Примітки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Додаткова інформація..."
              className="mt-1.5 min-h-[60px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Скасувати
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500">
              Призначити
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}