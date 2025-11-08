import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Moon, Sun, User, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const { syncWithGoogleSheets, loadFromGoogleSheets, isSyncing, isConfigured } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleManualSync = async () => {
    try {
      await syncWithGoogleSheets();
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  const handleLoadData = async () => {
    try {
      await loadFromGoogleSheets();
    } catch (error) {
      console.error('Failed to load data:', error);
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
                  Google Sheets не налаштовано. Дані зберігаються тільки локально.
                  <br />
                  <span className="text-xs mt-2 block">
                    Додайте VITE_GOOGLE_API_KEY, VITE_SPREADSHEET_ID та VITE_GOOGLE_SCRIPT_URL в налаштуваннях проєкту.
                  </span>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-sm font-medium">Налаштовано</span>
                  </div>
                  {isSyncing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleLoadData}
                    disabled={isSyncing}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Завантажити
                  </Button>
                  <Button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Зберегти
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Дані автоматично зберігаються в Google Таблиці при кожній зміні
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
    </div>
  );
}