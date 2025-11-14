import { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GoogleSheetsTest() {
  const { users, hours, processes, levels, objects, processTypes, isLoading, isConfigured, loadFromGoogleSheets } = useData();
  const [config, setConfig] = useState({
    spreadsheetId: '',
    apiKey: '',
    scriptUrl: '',
    fullUrl: ''
  });

  useEffect(() => {
    const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || '';
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
    
    setConfig({
      spreadsheetId,
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'НЕ ВСТАНОВЛЕНО',
      scriptUrl,
      fullUrl: spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : 'N/A'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold mb-4">📊 Конфігурація Google Sheets</h2>
          
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-lg">
              <p className="text-sm text-slate-600 font-semibold">Spreadsheet ID:</p>
              <p className="text-xs font-mono break-all">{config.spreadsheetId || 'НЕ ВСТАНОВЛЕНО'}</p>
            </div>
            
            <div className="p-3 bg-slate-100 rounded-lg">
              <p className="text-sm text-slate-600 font-semibold">API Key:</p>
              <p className="text-xs font-mono">{config.apiKey}</p>
            </div>
            
            <div className="p-3 bg-slate-100 rounded-lg">
              <p className="text-sm text-slate-600 font-semibold">Script URL:</p>
              <p className="text-xs font-mono break-all">{config.scriptUrl || 'НЕ ВСТАНОВЛЕНО'}</p>
            </div>
            
            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold">Повне посилання на таблицю:</p>
              <a 
                href={config.fullUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-600 underline break-all"
              >
                {config.fullUrl}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className={`px-4 py-2 rounded-lg ${isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConfigured ? '✅ Налаштовано' : '❌ Не налаштовано'}
            </div>
            <div className={`px-4 py-2 rounded-lg ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
              {isLoading ? '⏳ Завантаження...' : '✓ Завантажено'}
            </div>
          </div>

          <Button 
            onClick={() => loadFromGoogleSheets()} 
            disabled={isLoading}
            className="w-full mb-6"
          >
            🔄 Перезавантажити дані
          </Button>
        </Card>

        <Card className="p-6 bg-white">
          <h3 className="text-xl font-bold mb-4">📋 Завантажені дані</h3>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Користувачі ({users.length})</h4>
              {users.length === 0 ? (
                <p className="text-slate-500">Немає користувачів</p>
              ) : (
                <ul className="space-y-1">
                  {users.map(user => (
                    <li key={user.id} className="text-sm">
                      • {user.name} ({user.role}) - ₴{user.hourlyRate}/год
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Години ({hours.length})</h4>
              {hours.length === 0 ? (
                <p className="text-slate-500">Немає записів годин</p>
              ) : (
                <ul className="space-y-1 max-h-64 overflow-y-auto">
                  {hours.map(hour => (
                    <li key={hour.id} className="text-sm">
                      • {hour.date}: {hour.hours} год на {hour.object} = ₴{hour.salary}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Процеси ({processes.length})</h4>
              {processes.length === 0 ? (
                <p className="text-slate-500">Немає записів процесів</p>
              ) : (
                <ul className="space-y-1 max-h-64 overflow-y-auto">
                  {processes.map(process => (
                    <li key={process.id} className="text-sm">
                      • {process.date}: {process.processName} на {process.object || 'N/A'} ({process.volume} {process.unit}) = ₴{process.salary}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Рівні ({levels.length})</h4>
              {levels.length === 0 ? (
                <p className="text-red-600">❌ Немає рівнів</p>
              ) : (
                <ul className="space-y-1">
                  {levels.map(level => (
                    <li key={level.id} className="text-sm">
                      • {level.name} - ₴{level.hourlyRate}/год
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Об'єкти ({objects.length})</h4>
              {objects.length === 0 ? (
                <p className="text-slate-500">Немає об'єктів</p>
              ) : (
                <ul className="space-y-1">
                  {objects.map(obj => (
                    <li key={obj.id} className="text-sm">
                      • {obj.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Типи процесів ({processTypes.length})</h4>
              {processTypes.length === 0 ? (
                <p className="text-slate-500">Немає типів процесів</p>
              ) : (
                <ul className="space-y-1">
                  {processTypes.map(pt => (
                    <li key={pt.id} className="text-sm">
                      • {pt.name} - ₴{pt.rate}/{pt.unit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}