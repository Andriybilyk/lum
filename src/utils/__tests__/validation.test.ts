import { describe, it, expect } from 'vitest';
import { UserSchema, HoursSchema, ProcessSchema, LevelSchema, validateData } from '../validation';

describe('User Validation', () => {
  it('should validate correct user data', () => {
    const { success, data } = validateData(UserSchema, {
      name: 'Іван Петренко',
      role: 'employee',
      level: 'Junior',
      hourlyRate: 150,
    } as any);

    expect(success).toBe(true);
    expect((data as any)?.name).toBe('Іван Петренко');
    expect((data as any)?.hourlyRate).toBe(150);
  });

  it('should reject invalid hourly rate (negative)', () => {
    const { success, error } = validateData(UserSchema, {
      name: 'Іван',
      role: 'employee',
      level: 'Junior',
      hourlyRate: -50,
    });

    expect(success).toBe(false);
    expect(error).toContain('більше 0');
  });

  it('should reject short names', () => {
    const { success } = validateData(UserSchema, {
      name: 'І',
      role: 'employee',
      level: 'Junior',
      hourlyRate: 150,
    });

    expect(success).toBe(false);
  });

  it('should reject invalid role', () => {
    const { success } = validateData(UserSchema, {
      name: 'Іван Петренко',
      role: 'invalid_role',
      level: 'Junior',
      hourlyRate: 150,
    });

    expect(success).toBe(false);
  });

  it('should accept optional managerId', () => {
    const { success, data } = validateData(UserSchema, {
      name: 'Іван Петренко',
      role: 'employee',
      level: 'Junior',
      hourlyRate: 150,
      managerId: 'manager-123',
    } as any);

    expect(success).toBe(true);
    expect((data as any)?.managerId).toBe('manager-123');
  });

  it('should reject missing required fields', () => {
    const { success, error } = validateData(UserSchema, {
      name: 'Іван Петренко',
      // Missing role, level, hourlyRate
    });

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });
});

describe('Hours Validation', () => {
  it('should validate correct hours data', () => {
    const { success, data } = validateData(HoursSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      hours: 8,
      object: 'Project A',
      isBusinessTrip: false,
      salary: 1200,
    } as any);

    expect(success).toBe(true);
    expect((data as any)?.hours).toBe(8);
    expect((data as any)?.date).toBe('2024-11-13');
  });

  it('should reject invalid date format', () => {
    const { success } = validateData(HoursSchema, {
      userId: 'user-123',
      date: '13-11-2024',
      hours: 8,
      object: 'Project A',
      isBusinessTrip: false,
      salary: 1200,
    });

    expect(success).toBe(false);
  });

  it('should reject hours > 24', () => {
    const { success, error } = validateData(HoursSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      hours: 25,
      object: 'Project A',
      isBusinessTrip: false,
      salary: 1200,
    });

    expect(success).toBe(false);
    expect(error).toContain('24');
  });

  it('should reject negative hours', () => {
    const { success } = validateData(HoursSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      hours: -5,
      object: 'Project A',
      isBusinessTrip: false,
      salary: 1200,
    });

    expect(success).toBe(false);
  });

  it('should accept business trip flag', () => {
    const { success, data } = validateData(HoursSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      hours: 8,
      object: 'Project A',
      isBusinessTrip: true,
      salary: 1440,
    } as any);

    expect(success).toBe(true);
    expect((data as any)?.isBusinessTrip).toBe(true);
  });
});

describe('Process Validation', () => {
  it('should validate correct process data', () => {
    const { success, data } = validateData(ProcessSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      processName: 'Feature Development',
      object: 'Project A',
      volume: 100,
      unit: 'lines of code',
      rate: 50,
      salary: 5000,
    } as any);

    expect(success).toBe(true);
    expect((data as any)?.processName).toBe('Feature Development');
  });

  it('should reject invalid date', () => {
    const { success } = validateData(ProcessSchema, {
      userId: 'user-123',
      date: 'invalid-date',
      processName: 'Feature Development',
      volume: 100,
      unit: 'lines of code',
      rate: 50,
      salary: 5000,
    });

    expect(success).toBe(false);
  });

  it('should reject zero volume', () => {
    const { success } = validateData(ProcessSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      processName: 'Feature Development',
      volume: 0,
      unit: 'lines of code',
      rate: 50,
      salary: 5000,
    });

    expect(success).toBe(false);
  });

  it('should reject negative rate', () => {
    const { success } = validateData(ProcessSchema, {
      userId: 'user-123',
      date: '2024-11-13',
      processName: 'Feature Development',
      volume: 100,
      unit: 'lines of code',
      rate: -50,
      salary: 5000,
    });

    expect(success).toBe(false);
  });
});

describe('Level Validation', () => {
  it('should validate correct level data', () => {
    const { success, data } = validateData(LevelSchema, {
      name: 'Senior Developer',
      hourlyRate: 250,
    } as any);

    expect(success).toBe(true);
    expect((data as any)?.name).toBe('Senior Developer');
  });

  it('should reject empty name', () => {
    const { success } = validateData(LevelSchema, {
      name: '',
      hourlyRate: 250,
    });

    expect(success).toBe(false);
  });

  it('should reject zero hourly rate', () => {
    const { success } = validateData(LevelSchema, {
      name: 'Junior Developer',
      hourlyRate: 0,
    });

    expect(success).toBe(false);
  });

  it('should reject negative hourly rate', () => {
    const { success } = validateData(LevelSchema, {
      name: 'Junior Developer',
      hourlyRate: -100,
    });

    expect(success).toBe(false);
  });
});
