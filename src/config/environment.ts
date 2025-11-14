/**
 * Environment Configuration Management
 * Centralized configuration for different environments
 */

export interface EnvironmentConfig {
  // App settings
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production' | 'test';

  // API settings
  apiBaseUrl: string;
  apiTimeout: number;

  // Google Sheets
  googleSheetsApiKey?: string;
  googleSheetsSpreadsheetId?: string;

  // Feature flags
  features: {
    offline: boolean;
    sync: boolean;
    advancedReports: boolean;
    darkMode: boolean;
    debug: boolean;
  };

  // Logging
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    maxLogs: number;
  };

  // Cache settings
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };

  // Monitoring
  monitoring: {
    enabled: boolean;
    sampleRate: number;
    errorReportingUrl?: string;
  };
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvironmentConfig {
    let env = 'development';
    try {
      env = (import.meta.env?.MODE as string) || 'development';
    } catch {
      // In test environment, import.meta might not be available
      env = 'development';
    }

    const apiBaseUrl = this.getApiUrlForEnv(env);

    const baseConfig: EnvironmentConfig = {
      appName: 'HR Management System',
      appVersion: '1.0.0',
      environment: (env as any) || 'development',
      apiBaseUrl,
      apiTimeout: 30000,
      googleSheetsApiKey: this.getEnvVar('VITE_GOOGLE_SHEETS_API_KEY'),
      googleSheetsSpreadsheetId: this.getEnvVar('VITE_GOOGLE_SHEETS_SPREADSHEET_ID'),
      features: {
        offline: true,
        sync: true,
        advancedReports: true,
        darkMode: true,
        debug: env === 'development',
      },
      logging: {
        enabled: true,
        level: (env as string) === 'production' ? 'warn' : 'debug',
        maxLogs: (env as string) === 'production' ? 100 : 500,
      },
      cache: {
        enabled: true,
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        maxSize: 50,
      },
      monitoring: {
        enabled: (env as string) === 'production',
        sampleRate: (env as string) === 'production' ? 0.1 : 1.0,
        errorReportingUrl: this.getEnvVar('VITE_ERROR_REPORTING_URL'),
      },
    };

    return baseConfig;
  }

  private getEnvVar(key: string): string | undefined {
    try {
      return (import.meta.env as any)?.[key];
    } catch {
      return undefined;
    }
  }

  private getApiUrlForEnv(env: string): string {
    const apiUrl = this.getEnvVar('VITE_API_URL');

    switch (env) {
      case 'production':
        return apiUrl || 'https://api.hr-system.com';
      case 'staging':
        return apiUrl || 'https://staging-api.hr-system.com';
      default:
        return apiUrl || 'http://localhost:3000/api';
    }
  }

  /**
   * Get entire configuration
   */
  getConfig(): EnvironmentConfig {
    return this.config;
  }

  /**
   * Get specific config value with dot notation
   * Example: getConfigValue('features.offline')
   */
  getConfigValue<T = any>(path: string): T | undefined {
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature] ?? false;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Get API base URL
   */
  getApiUrl(): string {
    return this.config.apiBaseUrl;
  }

  /**
   * Log current configuration (for debugging)
   */
  logConfig(): void {
    if (this.config.features.debug) {
      console.log('Environment Configuration:', {
        environment: this.config.environment,
        appVersion: this.config.appVersion,
        features: this.config.features,
        apiUrl: this.config.apiBaseUrl,
      });
    }
  }
}

export const environmentConfig = new EnvironmentManager();
