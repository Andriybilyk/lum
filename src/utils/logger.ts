/**
 * Logger utility for development and production
 * Replaces console.log/error with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;
const LOG_LEVEL: LogLevel = isDevelopment ? 'debug' : 'info';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: 'color: #6B7280; font-weight: bold;',
  info: 'color: #3B82F6; font-weight: bold;',
  warn: 'color: #F59E0B; font-weight: bold;',
  error: 'color: #EF4444; font-weight: bold;',
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
};

const formatMessage = (_level: LogLevel, message: string, context?: string): string => {
  const timestamp = new Date().toLocaleTimeString();
  const contextStr = context ? ` [${context}]` : '';
  return `${timestamp}${contextStr} - ${message}`;
};

export const logger = {
  debug: (message: string, data?: any, context?: string) => {
    if (!shouldLog('debug')) return;

    const formatted = formatMessage('debug', message, context);
    console.log(`%c${formatted}`, COLORS.debug);
    if (data) console.log(data);
  },

  info: (message: string, data?: any, context?: string) => {
    if (!shouldLog('info')) return;

    const formatted = formatMessage('info', message, context);
    console.log(`%c${formatted}`, COLORS.info);
    if (data) console.log(data);
  },

  warn: (message: string, data?: any, context?: string) => {
    if (!shouldLog('warn')) return;

    const formatted = formatMessage('warn', message, context);
    console.warn(`%c${formatted}`, COLORS.warn);
    if (data) console.warn(data);
  },

  error: (message: string, data?: any, context?: string) => {
    if (!shouldLog('error')) return;

    const formatted = formatMessage('error', message, context);
    console.error(`%c${formatted}`, COLORS.error);
    if (data) console.error(data);

    // In production, you could send errors to a service here
    if (!isDevelopment) {
      // Example: sendToErrorTracking(message, data, context);
    }
  },

  group: (label: string, fn: () => void) => {
    if (!shouldLog('debug')) {
      fn();
      return;
    }

    console.group(`%c${label}`, COLORS.debug);
    fn();
    console.groupEnd();
  },
};

// Prevent console spam in development by intercepting native console if needed
if (isDevelopment) {
  // Keep console methods available in dev
} else {
  // In production, disable console for better performance
  const noop = () => {};
  window.console.log = noop;
  window.console.debug = noop;
  window.console.info = noop;
  window.console.warn = (msg: string, ...args: any[]) => {
    if (msg.includes('React')) logger.warn(msg, args);
  };
  window.console.error = (msg: string, ...args: any[]) => {
    logger.error(msg, args);
  };
}
