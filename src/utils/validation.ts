/**
 * Data validation schemas using Zod
 * Ensures data integrity before saving to Google Sheets
 */

import { z } from 'zod';

// User validation
export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Ім\'я повинно бути мінімум 2 символи').max(100),
  role: z.enum(['employee', 'manager']),
  level: z.string().min(1, 'Рівень обов\'язковий'),
  hourlyRate: z.number().positive('Почасова ставка повинна бути більше 0'),
  managerId: z.string().optional().nullable(),
});

export type User = z.infer<typeof UserSchema>;

// Hours validation
export const HoursSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID обов\'язковий'),
  date: z.string().date('Дата повинна бути у форматі YYYY-MM-DD'),
  hours: z.number().positive('Години повинні бути більше 0').max(24, 'Години не можуть бути більше 24'),
  object: z.string().min(1, 'Об\'єкт обов\'язковий'),
  isBusinessTrip: z.boolean().default(false),
  salary: z.number().nonnegative('Зарплата не може бути негативною'),
});

export type Hours = z.infer<typeof HoursSchema>;

// Process validation
export const ProcessSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID обов\'язковий'),
  date: z.string().date('Дата повинна бути у форматі YYYY-MM-DD'),
  processName: z.string().min(1, 'Назва процесу обов\'язкова'),
  object: z.string().optional(),
  volume: z.number().positive('Об\'єм повинен бути більше 0'),
  unit: z.string().min(1, 'Одиниця обов\'язкова'),
  rate: z.number().positive('Ставка повинна бути більше 0'),
  salary: z.number().nonnegative('Зарплата не може бути негативною'),
});

export type Process = z.infer<typeof ProcessSchema>;

// Level validation
export const LevelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Назва рівня обов\'язкова'),
  hourlyRate: z.number().positive('Почасова ставка повинна бути більше 0'),
});

export type Level = z.infer<typeof LevelSchema>;

// Object validation
export const ObjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Назва об\'єкта обов\'язкова'),
  isBusinessTrip: z.boolean().default(false),
});

export type SheetObject = z.infer<typeof ObjectSchema>;

// Assignment validation
export const AssignmentSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'ID працівника обов\'язковий'),
  managerId: z.string().min(1, 'ID менеджера обов\'язковий'),
  date: z.string().date('Дата повинна бути у форматі YYYY-MM-DD'),
  description: z.string().min(1, 'Опис обов\'язковий'),
  notes: z.string().optional().default(''),
  status: z.enum(['pending', 'confirmed', 'declined', 'employee_confirmed', 'manager_confirmed']),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

// Additional Work validation
export const AdditionalWorkSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID обов\'язковий'),
  managerId: z.string().min(1, 'Manager ID обов\'язковий'),
  objectName: z.string().min(1, 'Назва об\'єкта обов\'язкова'),
  date: z.string().date('Дата повинна бути у форматі YYYY-MM-DD'),
  workName: z.string().min(1, 'Назва роботи обов\'язкова'),
  description: z.string().optional().default(''),
  unit: z.string().min(1, 'Одиниця обов\'язкова'),
  volume: z.number().positive('Об\'єм повинен бути більше 0'),
  rate: z.number().positive('Ставка повинна бути більше 0'),
  salary: z.number().nonnegative('Зарплата не може бути негативною'),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AdditionalWork = z.infer<typeof AdditionalWorkSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Sanitize string input to prevent XSS and ensure data integrity
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 255);
};

// Sanitize all string fields in an object
const sanitizeFields = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Enhanced validation with sanitization
export const validateFormData = <T>(
  schema: z.ZodSchema,
  data: unknown
): ValidationResult<T> => {
  try {
    const dataObj = typeof data === 'object' && data !== null ? data as Record<string, any> : {};
    const sanitized = sanitizeFields(dataObj);
    const validated = schema.parse(sanitized);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Невідома помилка валідації' };
  }
};

// Legacy validation helper function (kept for backwards compatibility)
export const validateData = <T>(
  schema: z.ZodSchema,
  data: unknown
): ValidationResult<T> => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Невідома помилка валідації' };
  }
};

// Helper to extract error messages from validation result
export const getErrorMessage = (result: ValidationResult<any>): string => {
  return result.error || 'Невідома помилка';
};
