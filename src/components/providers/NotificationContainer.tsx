import { memo } from 'react';
import { Notification } from '@/types';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/contexts/NotificationContext';

interface NotificationContainerProps {
  notifications: Notification[];
}

const NotificationItem = memo(function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const { dismiss } = useNotification();

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-900 dark:text-green-100';
      case 'error':
        return 'text-red-900 dark:text-red-100';
      case 'warning':
        return 'text-yellow-900 dark:text-yellow-100';
      case 'info':
        return 'text-blue-900 dark:text-blue-100';
    }
  };

  return (
    <div
      className={`${getBackgroundColor()} ${getTextColor()} border rounded-lg p-4 shadow-lg animate-in slide-in-from-top-4 duration-300 max-w-md`}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{notification.title}</h3>
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          {notification.action && (
            <Button
              size="sm"
              variant="ghost"
              onClick={notification.action.onClick}
              className="mt-2"
            >
              {notification.action.label}
            </Button>
          )}
        </div>
        <button
          onClick={() => dismiss(notification.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

export const NotificationContainer = memo(function NotificationContainer({
  notifications,
}: NotificationContainerProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem notification={notification} />
        </div>
      ))}
    </div>
  );
});

export default NotificationContainer;
