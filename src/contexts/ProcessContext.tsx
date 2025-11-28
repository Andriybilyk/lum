import React, { createContext, useContext, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { createProcess as createProcessService, updateProcess as updateProcessService, deleteProcess as deleteProcessService } from '@/services/supabaseService';
import type { Process } from '@/types';

interface ProcessContextType {
  processes: Process[];
  isLoading: boolean;
  error: string | null;
  addProcess: (process: Omit<Process, 'id'>) => Promise<void>;
  updateProcess: (id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  getProcessesByUser: (userId: string) => Process[];
  getProcessesByDateRange: (startDate: string, endDate: string) => Process[];
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

export function ProcessProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addProcess = useCallback(async (processData: Omit<Process, 'id'>) => {
    try {
      setIsLoading(true);

      const processId = Date.now().toString();
      const newProcess: Process = {
        id: processId,
        ...processData,
      };

      await createProcessService(processData);

      setProcesses(prev => [...prev, newProcess]);
      logger.info('Process added', { processId }, 'ProcessContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add process';
      setError(message);
      logger.error('Failed to add process', err, 'ProcessContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProcess = useCallback(async (id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) => {
    try {
      setIsLoading(true);

      await updateProcessService(id, updates);

      setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      logger.info('Process updated', { processId: id }, 'ProcessContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update process';
      setError(message);
      logger.error('Failed to update process', err, 'ProcessContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProcess = useCallback(async (id: string) => {
    try {
      setIsLoading(true);

      await deleteProcessService(id);

      setProcesses(prev => prev.filter(p => p.id !== id));
      logger.info('Process deleted', { processId: id }, 'ProcessContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete process';
      setError(message);
      logger.error('Failed to delete process', err, 'ProcessContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProcessesByUser = useCallback((userId: string) => {
    return processes.filter(p => p.userId === userId);
  }, [processes]);

  const getProcessesByDateRange = useCallback((startDate: string, endDate: string) => {
    return processes.filter(p => p.date >= startDate && p.date <= endDate);
  }, [processes]);

  return (
    <ProcessContext.Provider
      value={{
        processes,
        isLoading,
        error,
        addProcess,
        updateProcess,
        deleteProcess,
        getProcessesByUser,
        getProcessesByDateRange,
      }}
    >
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcess() {
  const context = useContext(ProcessContext);
  if (context === undefined) {
    throw new Error('useProcess must be used within ProcessProvider');
  }
  return context;
}
