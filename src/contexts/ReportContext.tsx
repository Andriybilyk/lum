import React, { createContext, useContext, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  createAdditionalWork as createAdditionalWorkService,
  updateAdditionalWork as updateAdditionalWorkService,
  createAssignment as createAssignmentService,
  updateAssignment as updateAssignmentService
} from '@/services/supabaseService';
import type { AdditionalWork, Assignment } from '@/types';

interface ReportContextType {
  additionalWorks: AdditionalWork[];
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  addAdditionalWork: (work: Omit<AdditionalWork, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAdditionalWork: (id: string, updates: Partial<Omit<AdditionalWork, 'id' | 'createdAt'>>) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (id: string, status: 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed') => Promise<void>;
  getAdditionalWorksByUser: (userId: string) => AdditionalWork[];
  getAssignmentsByUser: (userId: string) => Assignment[];
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAdditionalWork = useCallback(async (work: Omit<AdditionalWork, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);

      const workId = Date.now().toString();
      const now = new Date().toISOString();
      const newWork: AdditionalWork = {
        id: workId,
        ...work,
        createdAt: now,
        updatedAt: now,
      };

      await createAdditionalWorkService(newWork);

      setAdditionalWorks(prev => [...prev, newWork]);
      logger.info('Additional work added', { workId }, 'ReportContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add additional work';
      setError(message);
      logger.error('Failed to add additional work', err, 'ReportContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAdditionalWork = useCallback(async (id: string, updates: Partial<Omit<AdditionalWork, 'id' | 'createdAt'>>) => {
    try {
      setIsLoading(true);

      const updatedWork = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateAdditionalWorkService(id, updates);

      setAdditionalWorks(prev => prev.map(w => w.id === id ? { ...w, ...updatedWork } : w));
      logger.info('Additional work updated', { workId: id }, 'ReportContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update additional work';
      setError(message);
      logger.error('Failed to update additional work', err, 'ReportContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
    try {
      setIsLoading(true);

      const assignmentId = Date.now().toString();
      const now = new Date().toISOString();
      const newAssignment: Assignment = {
        id: assignmentId,
        ...assignment,
      };

      await createAssignmentService({ ...newAssignment, createdAt: now, updatedAt: now });

      setAssignments(prev => [...prev, newAssignment]);
      logger.info('Assignment added', { assignmentId }, 'ReportContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add assignment';
      setError(message);
      logger.error('Failed to add assignment', err, 'ReportContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAssignment = useCallback(async (id: string, status: 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed') => {
    try {
      setIsLoading(true);

      await updateAssignmentService(id, { status });

      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      logger.info('Assignment updated', { assignmentId: id, status }, 'ReportContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update assignment';
      setError(message);
      logger.error('Failed to update assignment', err, 'ReportContext');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAdditionalWorksByUser = useCallback((userId: string) => {
    return additionalWorks.filter(w => w.userId === userId);
  }, [additionalWorks]);

  const getAssignmentsByUser = useCallback((userId: string) => {
    return assignments.filter(a => a.employeeId === userId);
  }, [assignments]);

  return (
    <ReportContext.Provider
      value={{
        additionalWorks,
        assignments,
        isLoading,
        error,
        addAdditionalWork,
        updateAdditionalWork,
        addAssignment,
        updateAssignment,
        getAdditionalWorksByUser,
        getAssignmentsByUser,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within ReportProvider');
  }
  return context;
}
