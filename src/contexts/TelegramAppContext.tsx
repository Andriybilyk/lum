import React, { createContext, useContext, useState, useEffect } from 'react';
import { telegramSync, type TimeEntry } from '@/services/telegramSync';
import { logger } from '@/utils/logger';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        instance?: {
          ready: () => void;
          expand: () => void;
          initDataUnsafe?: { user: TelegramUserData };
        };
      };
    };
  }
}

interface TelegramUserData {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramAppContextType {
  user: TelegramUser | null;
  isInitialized: boolean;
  todayHours: number;
  monthTotal: number;
  monthProgress: number;
  recentEntries: TimeEntry[];
  isSyncing: boolean;
  addHours: (hours: number) => Promise<void>;
  syncWithServer: () => Promise<void>;
  clearData: () => void;
}

const TelegramAppContext = createContext<TelegramAppContextType | undefined>(undefined);

export const TelegramAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [monthProgress, setMonthProgress] = useState(0);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadUserData = (userId: string) => {
    try {
      const todayHoursValue = telegramSync.getTodayHours(userId);
      const { total } = telegramSync.getMonthStats(userId);
      const recent = telegramSync.getRecentEntries(userId);

      setTodayHours(todayHoursValue);
      setMonthTotal(total);
      setMonthProgress(Math.round((total / 160) * 100));
      setRecentEntries(recent);
    } catch (error) {
      logger.error('Error loading user data:', error);
    }
  };

  const setupAutoSync = (userId: string) => {
    telegramSync.startAutoSync(userId, async () => {
      await syncWithServer();
    });
  };

  useEffect(() => {
    const initTelegram = async () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
          const app = window.Telegram.WebApp.instance;
          app.ready();
          app.expand();

          const tgUser = app.initDataUnsafe?.user;
          if (tgUser) {
            setUser(tgUser as TelegramUser);
            localStorage.setItem('telegram_user_id', tgUser.id.toString());
            localStorage.setItem('telegram_user_name', tgUser.first_name);

            telegramSync.init();
            loadUserData(tgUser.id.toString());
            setupAutoSync(tgUser.id.toString());
          }
        }
        setIsInitialized(true);
      } catch (error) {
        logger.error('Telegram initialization error:', error);
        setIsInitialized(true);
      }
    };
    initTelegram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addHours = async (hours: number) => {
    if (!user) return;

    try {
      telegramSync.addHours(user.id.toString(), hours);
      loadUserData(user.id.toString());

      await syncWithServer();
    } catch (error) {
      logger.error('Error adding hours:', error);
      throw error;
    }
  };

  const syncWithServer = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const userId = user.id.toString();
      const pendingEntries = telegramSync.getPendingSyncEntries(userId);

      if (pendingEntries.length > 0) {
        const response = await fetch('/api/telegram/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            entries: pendingEntries,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          const entryIds = pendingEntries.map(e => e.id || '').filter(Boolean);
          telegramSync.markSynced(userId, entryIds);
          logger.info('Sync successful for Telegram user:', userId);
        } else {
          const entryIds = pendingEntries.map(e => e.id || '').filter(Boolean);
          telegramSync.markSyncFailed(userId, entryIds);
          logger.error('Sync failed for Telegram user:', userId);
        }
      }

      loadUserData(userId);
    } catch (error) {
      logger.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearData = () => {
    if (!user) return;
    telegramSync.clearUserData(user.id.toString());
    setTodayHours(0);
    setMonthTotal(0);
    setMonthProgress(0);
    setRecentEntries([]);
  };

  const value: TelegramAppContextType = {
    user,
    isInitialized,
    todayHours,
    monthTotal,
    monthProgress,
    recentEntries,
    isSyncing,
    addHours,
    syncWithServer,
    clearData,
  };

  return (
    <TelegramAppContext.Provider value={value}>
      {children}
    </TelegramAppContext.Provider>
  );
};

export const useTelegramApp = (): TelegramAppContextType => {
  const context = useContext(TelegramAppContext);
  if (!context) {
    throw new Error('useTelegramApp must be used within TelegramAppProvider');
  }
  return context;
};
