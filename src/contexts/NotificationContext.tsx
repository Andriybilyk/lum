import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  show: (notification: Omit<Notification, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  success: (title: string, message: string, duration?: number) => string;
  error: (title: string, message: string, duration?: number) => string;
  warning: (title: string, message: string, duration?: number) => string;
  info: (title: string, message: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const show = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    if (newNotification.duration !== Infinity) {
      setTimeout(() => dismiss(id), newNotification.duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const success = useCallback(
    (title: string, message: string, duration?: number): string =>
      show({ type: 'success', title, message, duration }),
    [show]
  );

  const error = useCallback(
    (title: string, message: string, duration?: number): string =>
      show({ type: 'error', title, message, duration }),
    [show]
  );

  const warning = useCallback(
    (title: string, message: string, duration?: number): string =>
      show({ type: 'warning', title, message, duration }),
    [show]
  );

  const info = useCallback(
    (title: string, message: string, duration?: number): string =>
      show({ type: 'info', title, message, duration }),
    [show]
  );

  const value: NotificationContextType = {
    notifications,
    show,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
