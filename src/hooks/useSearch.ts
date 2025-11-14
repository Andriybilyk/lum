import { useState, useMemo, useCallback } from 'react';

interface UseSearchOptions<T> {
  fields: (keyof T)[];
  debounce?: number;
  caseSensitive?: boolean;
  matchType?: 'includes' | 'startsWith' | 'exact';
}

export interface UseSearchResult<T> {
  searchTerm: string;
  results: T[];
  totalResults: number;
  handleSearch: (term: string) => void;
  clear: () => void;
  isSearching: boolean;
}

const debounceHelper = <T extends any[]>(
  fn: (...args: T) => void,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const useSearch = <T extends Record<string, any>>(
  items: T[],
  options: UseSearchOptions<T>
): UseSearchResult<T> => {
  const {
    fields,
    debounce = 300,
    caseSensitive = false,
    matchType = 'includes',
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const normalizeString = useCallback(
    (str: string) => (caseSensitive ? str : str.toLowerCase()),
    [caseSensitive]
  );

  const matchesFilter = useCallback(
    (value: string, searchString: string): boolean => {
      const normalized = normalizeString(value);
      const normalizedSearch = normalizeString(searchString);

      switch (matchType) {
        case 'exact':
          return normalized === normalizedSearch;
        case 'startsWith':
          return normalized.startsWith(normalizedSearch);
        case 'includes':
        default:
          return normalized.includes(normalizedSearch);
      }
    },
    [caseSensitive, matchType, normalizeString]
  );

  const results = useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }

    return items.filter(item =>
      fields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) {
          return false;
        }

        const stringValue = String(value);
        return matchesFilter(stringValue, searchTerm);
      })
    );
  }, [items, searchTerm, fields, matchesFilter]);

  const debouncedSearch = useCallback(
    debounceHelper((term: string) => {
      setSearchTerm(term);
      setIsSearching(false);
    }, debounce),
    [debounce]
  );

  const handleSearch = useCallback(
    (term: string) => {
      setIsSearching(true);
      debouncedSearch(term);
    },
    [debouncedSearch]
  );

  const clear = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    results,
    totalResults: results.length,
    handleSearch,
    clear,
    isSearching,
  };
};
