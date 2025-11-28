import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import {
  getAllLevels,
  getAllObjects,
  getAllProcessTypes,
  createLevel,
  updateLevel as updateLevelService,
  deleteLevel as deleteLevelService,
  createObject,
  updateObject as updateObjectService,
  deleteObject as deleteObjectService
} from '@/services/supabaseService';
import type { Level, ObjectType, ProcessType } from '@/types';

interface MetaContextType {
  levels: Level[];
  objects: ObjectType[];
  processTypes: ProcessType[];
  isLoading: boolean;
  error: string | null;
  addLevel: (level: Omit<Level, 'id'>) => Promise<void>;
  updateLevel: (id: string, updates: { name?: string; rate?: number }) => Promise<void>;
  deleteLevel: (id: string) => Promise<void>;
  addObject: (object: Omit<ObjectType, 'id'>) => Promise<void>;
  updateObject: (id: string, updates: Partial<Omit<ObjectType, 'id'>>) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const MetaContext = createContext<MetaContextType | undefined>(undefined);

export function MetaProvider({ children }: { children: React.ReactNode }) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = async () => {
    try {
      setIsLoading(true);

      const [loadedLevels, loadedObjects, loadedProcessTypes] = await Promise.all([
        getAllLevels(),
        getAllObjects(),
        getAllProcessTypes(),
      ]);

      setLevels(loadedLevels);
      setObjects(loadedObjects);
      setProcessTypes(loadedProcessTypes);

      logger.info('Metadata loaded', {
        levels: loadedLevels.length,
        objects: loadedObjects.length,
        processTypes: loadedProcessTypes.length,
      }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load metadata';
      setError(message);
      logger.error('Failed to load metadata', err, 'MetaContext');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  const addLevel = async (level: Omit<Level, 'id'>) => {
    try {
      const levelId = Date.now().toString();
      const newLevel: Level = {
        id: levelId,
        ...level,
      };

      await createLevel(newLevel);

      setLevels(prev => [...prev, newLevel]);
      logger.info('Level added', { levelId }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add level';
      setError(message);
      logger.error('Failed to add level', err, 'MetaContext');
      throw err;
    }
  };

  const updateLevel = async (id: string, updates: { name?: string; rate?: number }) => {
    try {
      await updateLevelService(id, updates);

      setLevels(prev => prev.map(l =>
        l.id === id
          ? {
            ...l,
            name: updates.name || l.name,
            hourlyRate: updates.rate || l.hourlyRate,
          }
          : l
      ));
      logger.info('Level updated', { levelId: id }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update level';
      setError(message);
      logger.error('Failed to update level', err, 'MetaContext');
      throw err;
    }
  };

  const deleteLevel = async (id: string) => {
    try {
      await deleteLevelService(id);

      setLevels(prev => prev.filter(l => l.id !== id));
      logger.info('Level deleted', { levelId: id }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete level';
      setError(message);
      logger.error('Failed to delete level', err, 'MetaContext');
      throw err;
    }
  };

  const addObject = async (object: Omit<ObjectType, 'id'>) => {
    try {
      const objectId = Date.now().toString();
      const newObject: ObjectType = {
        id: objectId,
        ...object,
      };

      await createObject(newObject);

      setObjects(prev => [...prev, newObject]);
      logger.info('Object added', { objectId }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add object';
      setError(message);
      logger.error('Failed to add object', err, 'MetaContext');
      throw err;
    }
  };

  const updateObject = async (id: string, updates: Partial<Omit<ObjectType, 'id'>>) => {
    try {
      await updateObjectService(id, updates);

      setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      logger.info('Object updated', { objectId: id }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update object';
      setError(message);
      logger.error('Failed to update object', err, 'MetaContext');
      throw err;
    }
  };

  const deleteObject = async (id: string) => {
    try {
      await deleteObjectService(id);

      setObjects(prev => prev.filter(o => o.id !== id));
      logger.info('Object deleted', { objectId: id }, 'MetaContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete object';
      setError(message);
      logger.error('Failed to delete object', err, 'MetaContext');
      throw err;
    }
  };

  const refresh = async () => {
    await loadMetadata();
  };

  return (
    <MetaContext.Provider
      value={{
        levels,
        objects,
        processTypes,
        isLoading,
        error,
        addLevel,
        updateLevel,
        deleteLevel,
        addObject,
        updateObject,
        deleteObject,
        refresh,
      }}
    >
      {children}
    </MetaContext.Provider>
  );
}

export function useMeta() {
  const context = useContext(MetaContext);
  if (context === undefined) {
    throw new Error('useMeta must be used within MetaProvider');
  }
  return context;
}
