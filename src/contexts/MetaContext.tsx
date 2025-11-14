import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config/constants';
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
      const { readSheet } = await import('@/services/googleSheets');

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const levelsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS);
      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      const objectsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS);
      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      const processTypesData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESS_TYPES);

      if (levelsData && levelsData.length > 1) {
        const loadedLevels = levelsData.slice(1).map((row: any) => ({
          id: String(row[0]),
          name: String(row[1]),
          hourlyRate: parseFloat(row[2]) || 0,
        }));
        setLevels(loadedLevels);
      }

      if (objectsData && objectsData.length > 1) {
        const loadedObjects = objectsData.slice(1).map((row: any) => ({
          id: String(row[0]),
          name: String(row[1]),
          isBusinessTrip: row[2] === 1 || row[2] === true,
        }));
        setObjects(loadedObjects);
      }

      if (processTypesData && processTypesData.length > 1) {
        const loadedProcessTypes = processTypesData.slice(1).map((row: any) => ({
          id: String(row[0]),
          name: String(row[1]),
          object: String(row[2] || ''),
          rate: parseFloat(row[3]) || 0,
          unit: String(row[4] || ''),
          plannedVolume: parseFloat(row[5]) || 0,
        }));
        setProcessTypes(loadedProcessTypes);
      }

      logger.info('Metadata loaded', {
        levels: levels.length,
        objects: objects.length,
        processTypes: processTypes.length,
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
      const { appendSheet } = await import('@/services/googleSheets');

      const levelId = Date.now().toString();
      const newLevel: Level = {
        id: levelId,
        ...level,
      };

      await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS, [[
        levelId,
        level.name,
        level.hourlyRate,
      ]]);

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
      const { appendSheet } = await import('@/services/googleSheets');

      const objectId = Date.now().toString();
      const newObject: ObjectType = {
        id: objectId,
        ...object,
      };

      await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS, [[
        objectId,
        object.name,
        object.isBusinessTrip ? 1 : 0,
      ]]);

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
