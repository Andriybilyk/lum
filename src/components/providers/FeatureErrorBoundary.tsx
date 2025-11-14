import React, { ReactNode } from 'react';
import { logger } from '@/utils/logger';
import ErrorBoundary from '../ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function FeatureErrorBoundary({
  children,
  featureName,
  fallback,
  onError,
}: FeatureErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error(`Feature "${featureName}" crashed`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }, 'FeatureErrorBoundary');

    if (onError) {
      onError(error, errorInfo);
    }

    if (typeof window !== 'undefined' && window.__errorReporting) {
      window.__errorReporting({
        feature: featureName,
        error: error.message,
        stack: error.stack,
      });
    }
  };

  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Помилка в {featureName}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          На жаль, щось пішло не так у цьому розділі. Спробуйте перезавантажити сторінку або
          повернутися на попередню сторінку.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Перезавантажити
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Назад
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

declare global {
  interface Window {
    __errorReporting?: (error: any) => void;
  }
}
