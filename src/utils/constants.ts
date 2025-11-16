export const WORK_HOURS = {
  MAX_DAILY_HOURS: 16,
  NORMAL_HOURS_LIMIT: 8,
  OVERTIME_MULTIPLIER: 1.5,
  BUSINESS_TRIP_MULTIPLIER: 1.2,
  HOUR_STEP: 0.5,
} as const;

export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_MONTH: 'YYYY-MM',
  DISPLAY_DATE: 'DD.MM.YYYY',
  DISPLAY_MONTH: 'MMMM YYYY',
} as const;

export const VALIDATION = {
  MIN_HOURLY_RATE: 0,
  MAX_HOURLY_RATE: 10000,
  MIN_HOURS: 0,
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
} as const;

export const MESSAGES = {
  SUCCESS: {
    HOURS_LOGGED: 'Години успішно записано',
    PROCESS_LOGGED: 'Процес успішно записано',
    DATA_UPDATED: 'Дані оновлено',
    DATA_DELETED: 'Дані видалено',
  },
  ERROR: {
    MAX_HOURS_EXCEEDED: 'Перевищено максимум годин на день',
    INVALID_DATA: 'Некоректні дані',
    NETWORK_ERROR: 'Помилка з\'єднання',
    GOOGLE_SHEETS_ERROR: 'Помилка синхронізації з Google Sheets',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  EMPLOYEE: '/employee',
  MANAGER: '/manager',
} as const;
