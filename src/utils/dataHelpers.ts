/**
 * Utility functions for data processing
 */

/**
 * Clean ID by removing quotes, backticks, spaces and commas
 * Used for cleaning IDs from Google Sheets data
 */
export const cleanId = (rawId: string | number | undefined): string => {
  if (!rawId) return '';
  const str = String(rawId);
  return str.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
};

/**
 * Clean and validate manager ID
 * Returns undefined if empty or invalid
 */
export const cleanManagerId = (rawManagerId: string | number | undefined): string | undefined => {
  if (!rawManagerId) return undefined;
  const cleaned = cleanId(rawManagerId);
  return cleaned || undefined;
};

/**
 * Parse float with fallback to 0
 */
export const parseFloatSafe = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Check if environment is development
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};
