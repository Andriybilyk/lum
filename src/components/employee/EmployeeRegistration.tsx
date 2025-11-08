import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export default function EmployeeRegistration() {
  const { setUser } = useUser();
  const { levels, addUser, isLoading, isConfigured } = useData();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    hourlyRate: ''
  });

  // Логування для діагностики
  useEffect(() => {
    console.log('🔍 EmployeeRegistration - isLoading:', isLoading);
    console.log('🔍 EmployeeRegistration - isConfigured:', isConfigured);
    console.log('🔍 EmployeeRegistration - levels:', levels);
    console.log('🔍 EmployeeRegistration - levels.length:', levels.length);
  }, [isLoading, levels, isConfigured]);

  const handleLevelChange = (value: string) => {
    const selectedLevel = levels.find(l => l.name === value);
    setFormData({ 
      ...formData, 
      level: value,
      hourlyRate: selectedLevel ? selectedLevel.hourlyRate.toString() : formData.hourlyRate
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = Date.now().toString();
    const user = {
      id: userId,
      name: formData.name,
      role: 'employee' as const,
      level: formData.level,
      hourlyRate: parseFloat(formData.hourlyRate)
    };
    
    await addUser(user);
    setUser(user);
    navigate('/employee');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👤</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Реєстрація Працівника</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Введіть свої дані для початку роботи
            </p>
          </div>

          {/* Діагностична інформація */}
          <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs">
            <div>Loading: {isLoading ? '✅' : '❌'}</div>
            <div>Configured: {isConfigured ? '✅' : '❌'}</div>
            <div>Levels count: {levels.length}</div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Завантаження даних...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Повне Ім'я</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Іван Петренко"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="level" className="text-slate-700 dark:text-slate-300">Рівень</Label>
                <Select value={formData.level} onValueChange={handleLevelChange}>
                  <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                    <SelectValue placeholder={levels.length === 0 ? "Немає доступних рівнів" : "Оберіть свій рівень"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        Немає доступних рівнів. Додайте рівні в Google Sheets.
                      </div>
                    ) : (
                      levels.map((level) => (
                        <SelectItem key={level.id} value={level.name}>
                          {level.name} (₴{level.hourlyRate}/год)
                        </SelectItem>
                      ))
                    )}
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
                  placeholder="150"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={levels.length === 0}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl mt-6 disabled:opacity-50"
              >
                Завершити Реєстрацію
              </Button>
            </form>
          )}

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