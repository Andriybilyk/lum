import { useRef, useCallback } from 'react';

/**
 * Hook для оптимістичного оновлення даних
 * Запобігає перезапису локальних змін під час синхронізації
 */
export const useOptimisticUpdate = () => {
  const pendingUpdates = useRef<Set<string>>(new Set());

  const markPending = useCallback((id: string) => {
    pendingUpdates.current.add(id);
  }, []);

  const markComplete = useCallback((id: string) => {
    pendingUpdates.current.delete(id);
  }, []);

  const isPending = useCallback((id: string) => {
    return pendingUpdates.current.has(id);
  }, []);

  const clearAll = useCallback(() => {
    pendingUpdates.current.clear();
  }, []);

  return {
    markPending,
    markComplete,
    isPending,
    clearAll,
  };
};
