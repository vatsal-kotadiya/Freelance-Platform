import { useEffect, useRef, useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  getSuggestions: (q: string) => Promise<string[]> | string[];
  onSearch: (q: string) => void;
  compact?: boolean;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-orange-500 font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function SearchBar({ placeholder = 'Search...', getSuggestions, onSearch, compact = false }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions with 250ms debounce whenever input changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!inputValue.trim()) {
      setSuggestions([]);
      setOpen(false);
      if (compact) onSearch('');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await getSuggestions(inputValue.trim());
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
      if (compact) onSearch(inputValue.trim());
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function commit(value: string) {
    const trimmed = value.trim();
    setInputValue(trimmed);
    setSuggestions([]);
    setOpen(false);       // always hide on search / suggestion click
    setActiveIndex(-1);
    onSearch(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'Enter') commit(inputValue);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(activeIndex >= 0 ? suggestions[activeIndex] : inputValue);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleClear() {
    setInputValue('');
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className={`flex items-start gap-3 ${compact ? '' : 'mb-6'}`}>
      {/* Input + dropdown anchored here */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white border border-gray-200 rounded-full px-5 py-2.5 pr-9 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
        />

        {/* Clear button */}
        {inputValue && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 text-lg leading-none transition-colors"
            aria-label="Clear"
          >
            ×
          </button>
        )}

        {/* Suggestions dropdown — anchored to width of input */}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={s} className={i < suggestions.length - 1 ? 'border-b border-gray-100' : ''}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); commit(s); }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors ${
                    i === activeIndex ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="text-gray-800 truncate">
                    <HighlightMatch text={s} query={inputValue} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Search button — hidden in compact mode */}
      {!compact && (
        <button
          onMouseDown={(e) => { e.preventDefault(); commit(inputValue); }}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md whitespace-nowrap"
        >
          Search
        </button>
      )}
    </div>
  );
}
