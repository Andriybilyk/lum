import { logger } from './logger';

export interface TelegramUserData {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window.Telegram as any)?.WebApp || null;
};

export const initTelegramWebApp = () => {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    logger.warn('Telegram WebApp not available');
    return null;
  }

  try {
    logger.info('📱 Initializing Telegram WebApp');

    // Call ready() to notify Telegram that the app is ready
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (webApp as any).ready === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (webApp as any).ready();
      logger.info('✅ WebApp.ready() called');
    }

    // Expand the webApp to full height if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (webApp as any).expand === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (webApp as any).expand();
      logger.info('✅ WebApp.expand() called');
    }

    logger.info('✅ Telegram WebApp initialized successfully');
    return webApp;
  } catch (error) {
    logger.error('❌ Error initializing Telegram WebApp:', error);
    return null;
  }
};

export const getTelegramUser = (): TelegramUserData | null => {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    logger.debug('WebApp not available, cannot get user');
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initDataUnsafe = (webApp as any).initDataUnsafe;

    if (!initDataUnsafe) {
      logger.warn('⚠️ initDataUnsafe not available in WebApp');
      return null;
    }

    const user = initDataUnsafe.user;

    if (!user) {
      logger.warn('⚠️ User data not found in initDataUnsafe');
      return null;
    }

    if (!user.id) {
      logger.warn('⚠️ User ID not found');
      return null;
    }

    logger.info('✅ Telegram user data retrieved:', {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || 'N/A',
      username: user.username || 'N/A'
    });

    return user as TelegramUserData;
  } catch (error) {
    logger.error('❌ Error getting Telegram user:', error);
    return null;
  }
};

export const getTelegramUserId = (): string | null => {
  const user = getTelegramUser();
  if (!user || !user.id) {
    return null;
  }
  return user.id.toString();
};

export const getTelegramUserName = (): string | null => {
  const user = getTelegramUser();
  if (!user) {
    return null;
  }
  const { first_name, last_name } = user;
  return `${first_name}${last_name ? ' ' + last_name : ''}`;
};
