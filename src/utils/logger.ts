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

// Store original console methods to prevent recursion
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
};

const formatMessage = (_level: LogLevel, message: string, context?: string): string => {
  const timestamp = new Date().toLocaleTimeString();
  const contextStr = context ? ` [${context}]` : '';
  return `${timestamp}${contextStr} - ${message}`;
};

// Safe logger that prevents recursion by not logging in production
export const logger = {
  debug: (message: string, data?: any, context?: string) => {
    if (!shouldLog('debug') || !isDevelopment) return;

    try {
      const formatted = formatMessage('debug', message, context);
      originalConsoleLog(`%c${formatted}`, COLORS.debug);
      if (data) originalConsoleLog(data);
    } catch {
      // Silently ignore any logging errors to prevent recursion
    }
  },

  info: (message: string, data?: any, context?: string) => {
    if (!shouldLog('info') || !isDevelopment) return;

    try {
      const formatted = formatMessage('info', message, context);
      originalConsoleLog(`%c${formatted}`, COLORS.info);
      if (data) originalConsoleLog(data);
    } catch {
      // Silently ignore any logging errors to prevent recursion
    }
  },

  warn: (message: string, data?: any, context?: string) => {
    if (!shouldLog('warn') || !isDevelopment) return;

    try {
      const formatted = formatMessage('warn', message, context);
      originalConsoleWarn(`%c${formatted}`, COLORS.warn);
      if (data) originalConsoleWarn(data);
    } catch {
      // Silently ignore any logging errors to prevent recursion
    }
  },

  error: (message: string, data?: any, context?: string) => {
    if (!shouldLog('error') || !isDevelopment) return;

    try {
      const formatted = formatMessage('error', message, context);
      originalConsoleError(`%c${formatted}`, COLORS.error);
      if (data) originalConsoleError(data);
    } catch {
      // Silently ignore any logging errors to prevent recursion
    }
  },

  group: (label: string, fn: () => void) => {
    if (!shouldLog('debug') || !isDevelopment) {
      fn();
      return;
    }

    try {
      originalConsoleLog(`%c${label}`, COLORS.debug);
      fn();
      originalConsoleLog('groupEnd');
    } catch {
      // Silently ignore any logging errors
      fn();
    }
  },
};

// Prevent console spam in development by intercepting native console if needed
if (!isDevelopment) {
  // In production, disable console for better performance
  const noop = () => {};
  window.console.log = noop;
  window.console.debug = noop;
  window.console.info = noop;
  window.console.warn = noop;
  window.console.error = noop;
}
