import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Moon, Sun, User, LogOut, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ManageProcessesModal from './manager/ManageProcessesModal';

interface SettingsProps {
  onLogout?: () => void;
}

export default function Settings({ onLogout }: SettingsProps = {}) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const { isConfigured } = useData();
  const navigate = useNavigate();
  const [showManageProcesses, setShowManageProcesses] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="pt-4 pb-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            ⚙️ Налаштування
          </h2>
        </div>

        {/* Google Sheets Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Google Таблиці
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConfigured ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Supabase не налаштовано. Дані зберігаються тільки локально.
                  <br />
                  <span className="text-xs mt-2 block">
                    Додайте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY в налаштуваннях проєкту.
                  </span>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-sm font-medium">Підключено до Supabase</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Дані автоматично зберігаються в Supabase при кожній зміні
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Профіль */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Профіль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ім'я</p>
              <p className="text-base font-medium text-slate-800 dark:text-white">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Роль</p>
              <p className="text-base font-medium text-slate-800 dark:text-white">
                {user?.role === 'employee' ? 'Працівник' : 'Менеджер'}
              </p>
            </div>
            {user?.role === 'employee' && (
              <>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Рівень</p>
                  <p className="text-base font-medium text-slate-800 dark:text-white capitalize">{user?.level}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Погодинна Ставка</p>
                  <p className="text-base font-medium text-slate-800 dark:text-white">₴{user?.hourlyRate}/год</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Глобальні процеси - тільки для менеджерів */}
        {user?.role === 'manager' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Стандартні Процеси
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Керуйте глобальними процесами, які можна використовувати як шаблони для всіх об'єктів
              </p>
              <Button
                onClick={() => setShowManageProcesses(true)}
                className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Керувати Стандартними Процесами
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Тема */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Зовнішній Вигляд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                ) : (
                  <Sun className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                )}
                <div>
                  <Label htmlFor="theme" className="font-medium">Темна Тема</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {theme === 'dark' ? 'Увімкнено' : 'Вимкнено'}
                  </p>
                </div>
              </div>
              <Switch
                id="theme"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Вихід */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Вийти з Акаунту
        </Button>
      </div>

      {/* Модальне вікно стандартних процесів */}
      <ManageProcessesModal
        open={showManageProcesses}
        onClose={() => setShowManageProcesses(false)}
      />
    </div>
  );
}