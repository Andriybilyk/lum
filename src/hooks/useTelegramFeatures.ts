import { useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { logger } from '@/utils/logger';

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
}

export interface TelegramLocation {
  latitude: number;
  longitude: number;
}

export function useTelegramFeatures() {
  // Ініціалізувати Telegram Web App
  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      logger.info('📱 Telegram WebApp initialized', 'TelegramFeatures');
    }
  }, []);

  // Haptic feedback - вібрація
  const vibrate = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    try {
      if (WebApp?.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred(style);
      }
    } catch (error) {
      logger.error('Failed to trigger haptic feedback:', error, 'TelegramFeatures');
    }
  }, []);

  // Haptic notification - різні типи сповіщень
  const notificationFeedback = useCallback((type: 'success' | 'warning' | 'error') => {
    try {
      if (WebApp?.HapticFeedback) {
        WebApp.HapticFeedback.notificationOccurred(type);
      }
    } catch (error) {
      logger.error('Failed to trigger notification feedback:', error, 'TelegramFeatures');
    }
  }, []);

  // Показати popup
  const showPopup = useCallback((params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }>;
  }): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        if (WebApp?.showPopup) {
          WebApp.showPopup(params, (buttonId) => {
            resolve(buttonId);
          });
        } else {
          // Fallback до browser alert
          alert(params.message);
          resolve('ok');
        }
      } catch (error) {
        logger.error('Failed to show popup:', error, 'TelegramFeatures');
        alert(params.message);
        resolve('ok');
      }
    });
  }, []);

  // Показати alert
  const showAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (WebApp?.showAlert) {
          WebApp.showAlert(message, () => resolve());
        } else {
          alert(message);
          resolve();
        }
      } catch (error) {
        logger.error('Failed to show alert:', error, 'TelegramFeatures');
        alert(message);
        resolve();
      }
    });
  }, []);

  // Показати confirm
  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        if (WebApp?.showConfirm) {
          WebApp.showConfirm(message, (confirmed) => {
            resolve(confirmed);
          });
        } else {
          resolve(confirm(message));
        }
      } catch (error) {
        logger.error('Failed to show confirm:', error, 'TelegramFeatures');
        resolve(confirm(message));
      }
    });
  }, []);

  // Сканувати QR код
  const scanQR = useCallback((text: string = 'Скануйте QR код'): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        if (WebApp?.showScanQrPopup) {
          WebApp.showScanQrPopup({ text }, (data) => {
            if (data) {
              WebApp.closeScanQrPopup();
              resolve(data);
            } else {
              resolve(null);
            }
          });
        } else {
          logger.warn('QR scanner not available', 'TelegramFeatures');
          showAlert('QR сканер недоступний в цій версії Telegram');
          resolve(null);
        }
      } catch (error) {
        logger.error('Failed to scan QR:', error, 'TelegramFeatures');
        resolve(null);
      }
    });
  }, [showAlert]);

  // Закрити QR сканер
  const closeScanQR = useCallback(() => {
    try {
      if (WebApp?.closeScanQrPopup) {
        WebApp.closeScanQrPopup();
      }
    } catch (error) {
      logger.error('Failed to close QR scanner:', error, 'TelegramFeatures');
    }
  }, []);

  // Запит контакту користувача
  const requestContact = useCallback((): Promise<TelegramContact | null> => {
    return new Promise((resolve) => {
      try {
        if (WebApp?.requestContact) {
          WebApp.requestContact((sent, contact) => {
            if (sent && contact) {
              resolve(contact as TelegramContact);
            } else {
              resolve(null);
            }
          });
        } else {
          logger.warn('Contact request not available', 'TelegramFeatures');
          showAlert('Запит контакту недоступний в цій версії Telegram');
          resolve(null);
        }
      } catch (error) {
        logger.error('Failed to request contact:', error, 'TelegramFeatures');
        resolve(null);
      }
    });
  }, [showAlert]);

  // Запит локації користувача
  const requestLocation = useCallback((): Promise<TelegramLocation | null> => {
    return new Promise((resolve) => {
      try {
        if (WebApp?.requestLocation) {
          WebApp.requestLocation((sent, location) => {
            if (sent && location) {
              resolve(location as TelegramLocation);
            } else {
              resolve(null);
            }
          });
        } else {
          // Fallback до browser geolocation API
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              () => {
                resolve(null);
              }
            );
          } else {
            logger.warn('Location request not available', 'TelegramFeatures');
            resolve(null);
          }
        }
      } catch (error) {
        logger.error('Failed to request location:', error, 'TelegramFeatures');
        resolve(null);
      }
    });
  }, []);

  // Показати кнопку "Назад"
  const showBackButton = useCallback((onClick: () => void) => {
    try {
      if (WebApp?.BackButton) {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(onClick);
      }
    } catch (error) {
      logger.error('Failed to show back button:', error, 'TelegramFeatures');
    }
  }, []);

  // Приховати кнопку "Назад"
  const hideBackButton = useCallback(() => {
    try {
      if (WebApp?.BackButton) {
        WebApp.BackButton.hide();
      }
    } catch (error) {
      logger.error('Failed to hide back button:', error, 'TelegramFeatures');
    }
  }, []);

  // Показати головну кнопку
  const showMainButton = useCallback((params: {
    text: string;
    color?: string;
    textColor?: string;
    isActive?: boolean;
    isVisible?: boolean;
    onClick: () => void;
  }) => {
    try {
      if (WebApp?.MainButton) {
        WebApp.MainButton.setText(params.text);
        if (params.color) WebApp.MainButton.setParams({ color: params.color });
        if (params.textColor) WebApp.MainButton.setParams({ text_color: params.textColor });
        if (params.isActive !== undefined) {
          params.isActive ? WebApp.MainButton.enable() : WebApp.MainButton.disable();
        }
        WebApp.MainButton.onClick(params.onClick);
        if (params.isVisible !== false) {
          WebApp.MainButton.show();
        }
      }
    } catch (error) {
      logger.error('Failed to show main button:', error, 'TelegramFeatures');
    }
  }, []);

  // Приховати головну кнопку
  const hideMainButton = useCallback(() => {
    try {
      if (WebApp?.MainButton) {
        WebApp.MainButton.hide();
      }
    } catch (error) {
      logger.error('Failed to hide main button:', error, 'TelegramFeatures');
    }
  }, []);

  // Відкрити посилання
  const openLink = useCallback((url: string, options?: { try_instant_view?: boolean }) => {
    try {
      if (WebApp?.openLink) {
        WebApp.openLink(url, options);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      logger.error('Failed to open link:', error, 'TelegramFeatures');
      window.open(url, '_blank');
    }
  }, []);

  // Відкрити Telegram посилання
  const openTelegramLink = useCallback((url: string) => {
    try {
      if (WebApp?.openTelegramLink) {
        WebApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      logger.error('Failed to open Telegram link:', error, 'TelegramFeatures');
      window.open(url, '_blank');
    }
  }, []);

  // Закрити Mini App
  const close = useCallback(() => {
    try {
      if (WebApp?.close) {
        WebApp.close();
      }
    } catch (error) {
      logger.error('Failed to close app:', error, 'TelegramFeatures');
    }
  }, []);

  return {
    // Haptic feedback
    vibrate,
    notificationFeedback,

    // Dialogs
    showPopup,
    showAlert,
    showConfirm,

    // QR Scanner
    scanQR,
    closeScanQR,

    // Permissions
    requestContact,
    requestLocation,

    // UI Controls
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,

    // Navigation
    openLink,
    openTelegramLink,
    close,

    // WebApp object для прямого доступу
    WebApp
  };
}
