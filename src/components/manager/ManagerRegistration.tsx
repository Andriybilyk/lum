import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function ManagerRegistration() {
  const { setUser } = useUser();
  const { levels, addUser } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    hourlyRate: '',
    password: ''
  });

  const handleLevelChange = (value: string) => {
    const selectedLevel = levels.find(l => l.name === value);
    
    setFormData({ 
      ...formData, 
      level: value,
      hourlyRate: selectedLevel ? selectedLevel.hourlyRate.toString() : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Перевірка пароля
    if (formData.password !== '6323') {
      toast({
        title: 'Помилка',
        description: 'Невірний пароль для реєстрації менеджера',
        variant: 'destructive'
      });
      return;
    }
    
    const userId = Date.now().toString();
    const user = {
      id: userId,
      name: formData.name,
      role: 'manager' as const,
      level: formData.level,
      hourlyRate: parseFloat(formData.hourlyRate)
    };
    
    await addUser(user);
    setUser(user);
    navigate('/manager');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-400 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👔</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Реєстрація Менеджера</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Введіть свої дані для початку роботи
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Повне Ім'я</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Марія Коваль"
                required
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="level" className="text-slate-700 dark:text-slate-300">Рівень</Label>
              <Select value={formData.level} onValueChange={handleLevelChange}>
                <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                  <SelectValue placeholder="Оберіть свій рівень" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.name}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rate" className="text-slate-700 dark:text-slate-300">Погодинна Ставка (₴)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="400"
                required
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Введіть пароль"
                required
                className="mt-1.5 h-12 rounded-xl"
              />
              <p className="text-xs text-slate-500 mt-1">Пароль для доступу до панелі менеджера</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-xl mt-6"
            >
              Завершити Реєстрацію
            </Button>
          </form>

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full mt-4 text-slate-600 dark:text-slate-400"
          >
            Назад на Головну
          </Button>
        </div>
      </motion.div>
    </div>
  );
}