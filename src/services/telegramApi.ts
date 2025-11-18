import { logger } from '@/utils/logger';

export interface SyncRequest {
  userId: string;
  entries: Array<{
    date: string;
    hours: number;
    synced: 'synced' | 'pending' | 'error';
    id?: string;
  }>;
  timestamp: string;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedAt?: string;
  entriesSynced?: number;
  googleSheetsSynced?: boolean;
  entries?: SyncRequest['entries'];
  [key: string]: any;
}

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  createdAt: string;
  lastActivity: string;
}

class TelegramApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/telegram';
  }

  async syncHours(request: SyncRequest): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-User-ID': request.userId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`);
      }

      const data: SyncResponse = await response.json();
      logger.info('Telegram sync successful:', { userId: request.userId });
      return data;
    } catch (error) {
      logger.error('Telegram sync error:', error);
      throw error;
    }
  }

  async getHours(userId: string, month?: string): Promise<SyncResponse> {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);

      const response = await fetch(
        `${this.baseUrl}/hours/${userId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'X-Telegram-User-ID': userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Get hours failed with status ${response.status}`);
      }

      const data: SyncResponse = await response.json();
      return data;
    } catch (error) {
      logger.error('Get hours error:', error);
      throw error;
    }
  }

  async addHours(userId: string, hours: number, date?: string): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/hours/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-User-ID': userId,
        },
        body: JSON.stringify({
          hours,
          date: date || new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error(`Add hours failed with status ${response.status}`);
      }

      const data: SyncResponse = await response.json();
      logger.info('Hours added:', { userId, hours });
      return data;
    } catch (error) {
      logger.error('Add hours error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'X-Telegram-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete user failed with status ${response.status}`);
      }

      const data: SyncResponse = await response.json();
      logger.info('User deleted:', userId);
      return data;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<{ success: boolean; user: TelegramUser }> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'GET',
        headers: {
          'X-Telegram-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Get user failed with status ${response.status}`);
      }

      const data = await response.json();
      logger.info('User retrieved:', userId);
      return data;
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  async createUser(userId: string, userData: Omit<TelegramUser, 'id' | 'createdAt' | 'lastActivity'>): Promise<{ success: boolean; user: TelegramUser; googleSheetsSynced: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-User-ID': userId,
        },
        body: JSON.stringify({
          id: userId,
          ...userData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Create user failed with status ${response.status}`);
      }

      const data = await response.json();
      logger.info('User created:', { userId, ...userData });
      return data;
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<Omit<TelegramUser, 'id' | 'createdAt' | 'lastActivity'>>): Promise<{ success: boolean; user: TelegramUser }> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-User-ID': userId,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Update user failed with status ${response.status}`);
      }

      const data = await response.json();
      logger.info('User updated:', userId);
      return data;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }
}

export const telegramApi = new TelegramApiService();
