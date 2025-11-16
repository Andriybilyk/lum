import { logger } from '@/utils/logger';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramAppInitData {
  user?: TelegramUser;
  auth_date?: number;
  hash?: string;
  chat_instance?: string;
  chat_type?: string;
}

interface TelegramWebAppInstance {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initDataUnsafe?: TelegramAppInitData;
  colorScheme?: 'light' | 'dark';
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  MainButton?: {
    text?: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    setParams?: (params: Record<string, unknown>) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
}

class TelegramIntegrationService {
  private telegramUser: TelegramUser | null = null;
  private isInTelegram: boolean = false;
  private initialized: boolean = false;

  init(): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;

        // Сповістити Telegram про готовність
        app.ready();
        app.expand();

        // Отримати дані користувача
        const initData = app.initDataUnsafe;
        if (initData?.user) {
          this.telegramUser = initData.user;
          this.isInTelegram = true;
          this.initialized = true;

          logger.info('Telegram Mini App initialized', {
            userId: this.telegramUser.id,
            username: this.telegramUser.username,
          });
        }
      } else {
        this.initialized = true;
        logger.info('Not running in Telegram WebApp');
      }
    } catch (error) {
      logger.error('Telegram initialization error:', error);
      this.initialized = true;
    }
  }

  getTelegramUser(): TelegramUser | null {
    return this.telegramUser;
  }

  isRunningInTelegram(): boolean {
    return this.isInTelegram;
  }

  getColorScheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
      const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
      return (app.colorScheme as 'light' | 'dark') || 'light';
    }
    return 'light';
  }

  expandWebApp(): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        app.expand();
      }
    } catch (error) {
      logger.error('Error expanding WebApp:', error);
    }
  }

  closeWebApp(): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        app.close();
      }
    } catch (error) {
      logger.error('Error closing WebApp:', error);
    }
  }

  showBackButton(callback?: () => void): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        if (app.BackButton) {
          app.BackButton.show();
          if (callback) {
            app.BackButton.onClick(callback);
          }
        }
      }
    } catch (error) {
      logger.error('Error showing back button:', error);
    }
  }

  hideBackButton(): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        if (app.BackButton) {
          app.BackButton.hide();
        }
      }
    } catch (error) {
      logger.error('Error hiding back button:', error);
    }
  }

  setMainButton(
    text: string,
    callback?: () => void,
    options?: { color?: string; textColor?: string }
  ): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        if (app.MainButton) {
          app.MainButton.text = text;

          if (options) {
            app.MainButton.setParams?.(options);
          }

          app.MainButton.show();

          if (callback) {
            app.MainButton.onClick(callback);
          }
        }
      }
    } catch (error) {
      logger.error('Error setting main button:', error);
    }
  }

  hideMainButton(): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        if (app.MainButton) {
          app.MainButton.hide();
        }
      }
    } catch (error) {
      logger.error('Error hiding main button:', error);
    }
  }

  triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light'): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        if (app.HapticFeedback) {
          app.HapticFeedback.impactOccurred(type);
        }
      }
    } catch (error) {
      logger.error('Error triggering haptic feedback:', error);
    }
  }

  showNotification(type: 'success' | 'error' | 'warning' = 'success'): void {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
        const app = window.Telegram.WebApp.instance as TelegramWebAppInstance;
        if (app.HapticFeedback) {
          app.HapticFeedback.notificationOccurred(type);
        }
      }
    } catch (error) {
      logger.error('Error showing notification:', error);
    }
  }

  getUserDisplayName(): string {
    if (!this.telegramUser) return '';

    if (this.telegramUser.first_name && this.telegramUser.last_name) {
      return `${this.telegramUser.first_name} ${this.telegramUser.last_name}`;
    }
    return this.telegramUser.first_name || this.telegramUser.username || 'User';
  }

  getUserId(): string {
    return this.telegramUser?.id.toString() || '';
  }

  getUserUsername(): string {
    return this.telegramUser?.username || '';
  }

  getUserLanguage(): string {
    return this.telegramUser?.language_code || 'en';
  }

  isUserPremium(): boolean {
    return this.telegramUser?.is_premium || false;
  }

  getInitData(): string {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.instance) {
      // Отримати raw init data для верифікації на сервері
      return (window.location.hash?.split('#')[1] || '');
    }
    return '';
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const telegramIntegration = new TelegramIntegrationService();
