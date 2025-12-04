import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { getAllUsers, createUser } from '@/services/supabaseService';
import type { User } from '@/types';

interface AuthContextType {
  users: User[];
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  addUser: (user: Omit<User, 'id'> | User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(true); // Always configured with Supabase
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const loadedUsers = await getAllUsers();
        setUsers(loadedUsers);
        logger.info('Users loaded', { count: loadedUsers.length }, 'AuthContext');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load users';
        setError(message);
        logger.error('Failed to initialize auth', err, 'AuthContext');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const addUser = async (user: Omit<User, 'id'> | User) => {
    try {
      await createUser(user);

      const userId = 'id' in user ? user.id : Date.now().toString();
      const newUser: User = {
        id: userId,
        name: user.name,
        role: user.role,
        level: user.level,
        hourlyRate: user.hourlyRate,
        managerId: user.managerId,
        departmentId: user.departmentId,
      };

      setUsers(prev => [...prev, newUser]);
      logger.info('User added', { userId: newUser.id, name: newUser.name }, 'AuthContext');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add user';
      setError(message);
      logger.error('Failed to add user', err, 'AuthContext');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ users, isLoading, isConfigured, error, addUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
