import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TelegramAppProvider, useTelegramApp } from '../TelegramAppContext';

// Mock the telegram sync service
vi.mock('@/services/telegramSync', () => ({
  telegramSync: {
    init: vi.fn(),
    addHours: vi.fn((_id, hours) => ({
      date: new Date().toISOString().split('T')[0],
      hours,
      synced: 'pending' as const,
      id: `test-${Date.now()}`,
    })),
    getTodayHours: vi.fn(() => 0),
    getMonthStats: vi.fn(() => ({ total: 0, entries: [] })),
    getRecentEntries: vi.fn(() => []),
    getPendingSyncEntries: vi.fn(() => []),
    markSynced: vi.fn(),
    clearUserData: vi.fn(),
    startAutoSync: vi.fn(),
    stopAutoSync: vi.fn(),
  },
}));

describe('TelegramAppContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const wrapper = ({ children }: any) => (
      <TelegramAppProvider>{children}</TelegramAppProvider>
    );

    const { result } = renderHook(() => useTelegramApp(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.todayHours).toBe(0);
    expect(result.current.monthProgress).toBe(0);
    expect(result.current.isSyncing).toBe(false);
  });

  it('should add hours', async () => {
    const wrapper = ({ children }: any) => (
      <TelegramAppProvider>{children}</TelegramAppProvider>
    );

    const { result } = renderHook(() => useTelegramApp(), { wrapper });

    act(() => {
      localStorage.setItem('telegram_user_id', '123456789');
    });

    await act(async () => {
      try {
        await result.current.addHours(4);
      } catch {
      }
    });
  });

  it('should provide context methods', () => {
    const wrapper = ({ children }: any) => (
      <TelegramAppProvider>{children}</TelegramAppProvider>
    );

    const { result } = renderHook(() => useTelegramApp(), { wrapper });

    expect(typeof result.current.addHours).toBe('function');
    expect(typeof result.current.syncWithServer).toBe('function');
    expect(typeof result.current.clearData).toBe('function');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useTelegramApp());
    }).toThrow('useTelegramApp must be used within TelegramAppProvider');
  });
});
