import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  isSearching?: boolean;
  disabled?: boolean;
}

const SearchBar = memo(function SearchBar({
  value,
  onChange,
  placeholder = 'Пошук...',
  onClear,
  isSearching = false,
  disabled = false,
}: SearchBarProps) {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-1"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      {isSearching && (
        <div className="absolute right-12">
          <div className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full" />
        </div>
      )}
    </div>
  );
});

export default SearchBar;
