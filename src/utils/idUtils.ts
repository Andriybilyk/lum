/**
 * ID utility functions for cleaning and validating IDs
 * All IDs are stored as clean numeric strings without decimals
 */

/**
 * Clean an ID by removing prefixes and whitespace
 * Converts to string and removes apostrophes, backticks, spaces, and commas
 */
export const cleanId = (id: string | number | undefined): string => {
  if (id === undefined || id === null) {
    return '';
  }

  return String(id)
    .replace(/^['`]/, '') // Remove leading quote/backtick
    .replace(/[\s,]/g, '') // Remove spaces and commas
    .trim();
};

/**
 * Convert to numeric format for Google Sheets
 * Ensures ID is stored as integer without decimals
 */
export const toNumericId = (id: string | number): number => {
  const cleaned = cleanId(id);
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate if ID is in correct format
 */
export const isValidId = (id: string): boolean => {
  const cleaned = cleanId(id);
  if (!cleaned) return false;
  return /^\d+$/.test(cleaned);
};

/**
 * Generate a new numeric ID based on timestamp
 * Used for creating new records
 */
export const generateId = (): string => {
  return Date.now().toString();
};

/**
 * Compare two IDs ignoring format differences
 */
export const idsEqual = (id1: string | number | undefined, id2: string | number | undefined): boolean => {
  return cleanId(id1) === cleanId(id2);
};
