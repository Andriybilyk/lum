import React, { createContext, useContext, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { Hours } from '@/types';

interface HoursContextType {
  hours: Hours[];
  isLoading: boolean;
  error: string | null;
  addHours: (hours: Omit<Hours, 'id'>) => Promise<void>;
  updateHours: (id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) => Promise<void>;
  deleteHours: (id: string) => Promise<void>;
  getHoursByUser: (userId: string) => Hours[];
  getHoursByDateRange: (startDate: string, endDate: string) => Hours[];
}

const HoursContext = createContext<HoursContextType | undefined>(undefined);

export function HoursProvider({ children }: { children: React.ReactNode }) {
  const [hours, setHours] = useState<Hours[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addHours = useCallback(async (hoursData: Omit<Hours, 'id'>) => {
    try {
      setIsLoading(true);
      const { appendSheet } = await import('@/services/googleSheets');

      const hoursId = Date.now().toString();
      const newHours: Hours = {
        id: hoursId,
        ...hoursData,
      };

      await appendSheet('Hours!A:G', [[
        hoursId,
        hoursData.userId,
        hoursData.date,
        hoursData.hours,
        hoursData.object,
        hoursData.isBusinessTrip ? 1 : 0,
        hoursData.salary,
      ]]);

      setHours(prev => [...prev, newHours]);
      logger.info('Hours entry added', { hoursId }, 'HoursContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add hours';
      setError(message);
      logger.error('Failed to add hours', err, 'HoursContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateHours = useCallback(async (id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) => {
    try {
      setIsLoading(true);
      const { updateHourEntry } = await import('@/services/googleSheets');

      await updateHourEntry(id, updates);

      setHours(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
      logger.info('Hours entry updated', { hoursId: id }, 'HoursContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update hours';
      setError(message);
      logger.error('Failed to update hours', err, 'HoursContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteHours = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const { deleteHourEntry } = await import('@/services/googleSheets');

      await deleteHourEntry(id);

      setHours(prev => prev.filter(h => h.id !== id));
      logger.info('Hours entry deleted', { hoursId: id }, 'HoursContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete hours';
      setError(message);
      logger.error('Failed to delete hours', err, 'HoursContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHoursByUser = useCallback((userId: string) => {
    return hours.filter(h => h.userId === userId);
  }, [hours]);

  const getHoursByDateRange = useCallback((startDate: string, endDate: string) => {
    return hours.filter(h => h.date >= startDate && h.date <= endDate);
  }, [hours]);

  return (
    <HoursContext.Provider
      value={{
        hours,
        isLoading,
        error,
        addHours,
        updateHours,
        deleteHours,
        getHoursByUser,
        getHoursByDateRange,
      }}
    >
      {children}
    </HoursContext.Provider>
  );
}

export function useHours() {
  const context = useContext(HoursContext);
  if (context === undefined) {
    throw new Error('useHours must be used within HoursProvider');
  }
  return context;
}
