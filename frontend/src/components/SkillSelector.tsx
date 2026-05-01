import { useEffect, useMemo, useRef, useState } from 'react';
import { searchSkills } from '../data/skills';

interface Props {
  selected: string[];
  onChange: (skills: string[]) => void;
  max?: number;
  placeholder?: string;
}

export default function SkillSelector({ selected, onChange, max = 20, placeholder = 'Search skills...' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchSkills(query), [query]);

  const showAddCustom =
    query.trim().length > 0 &&
    !results.some((r) => r.skill.toLowerCase() === query.trim().toLowerCase()) &&
    !selected.map((s) => s.toLowerCase()).includes(query.trim().toLowerCase());

  const totalOptions = results.length + (showAddCustom ? 1 : 0);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLLIElement>('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed || selected.includes(trimmed) || selected.length >= max) return;
    onChange([...selected, trimmed]);
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function removeSkill(skill: string) {
    onChange(selected.filter((s) => s !== skill));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && query) { setOpen(true); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalOptions - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (totalOptions === 0) return;
      if (activeIndex < results.length) {
        addSkill(results[activeIndex].skill);
      } else if (showAddCustom) {
        addSkill(query.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      removeSkill(selected[selected.length - 1]);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setActiveIndex(0);
    setOpen(true);
  }

  const atLimit = selected.length >= max;

  // Group results by category for display
  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const { category, skill } of results) {
      if (!map[category]) map[category] = [];
      map[category].push(skill);
    }
    return map;
  }, [results]);

  // Flat ordered list of result skills (to map activeIndex correctly)
  const flatResults = results.map((r) => r.skill);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags + input */}
      <div
        className="min-h-[44px] w-full border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent bg-white transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
              className="text-orange-400 hover:text-orange-600 leading-none ml-0.5 font-bold"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
        {!atLimit && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder-gray-400"
          />
        )}
        {atLimit && (
          <span className="text-xs text-gray-400 ml-1">Max {max} skills reached</span>
        )}
      </div>

      {/* Dropdown */}
      {open && !atLimit && (query.trim().length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {totalOptions === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No skills found</li>
            )}

            {/* Grouped results */}
            {Object.entries(grouped).map(([category, skills]) => (
              <li key={category}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {category}
                </p>
                <ul>
                  {skills.map((skill) => {
                    const idx = flatResults.indexOf(skill);
                    const isSelected = selected.includes(skill);
                    const isActive = idx === activeIndex;
                    return (
                      <li
                        key={skill}
                        data-active={isActive}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => addSkill(skill)}
                        className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors ${
                          isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
                        } ${isSelected ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <span>{skill}</span>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}

            {/* Add custom skill */}
            {showAddCustom && (
              <li
                data-active={activeIndex === results.length}
                role="option"
                onMouseEnter={() => setActiveIndex(results.length)}
                onClick={() => addSkill(query.trim())}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer border-t border-gray-100 transition-colors ${
                  activeIndex === results.length ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add <span className="font-semibold text-gray-900">"{query.trim()}"</span> as new skill
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
