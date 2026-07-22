import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@web/shared/utils/cn';
import Any from '@web/shared/types/any';
import { Input } from '@web/shared/components/ui/input';

interface CustomAutoCompleteProps {
  filter?: (query: string, optionValue: string, optionLabel: string) => boolean;
  onSelectOption: (s: Any) => void;
  name: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  items: Any[];
  onFocus?: () => void;
  selector: string;
  renderItem?: (item: Any) => React.ReactNode;
  inputProps?: { [key: string]: Any };
  value?: string;
  placeholder?: string;
  className?: string;
}

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-primary">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
};

const CustomAutoComplete = (props: CustomAutoCompleteProps) => {
  const { filter, name, value, onSelectOption, onChange, items, inputProps, selector, renderItem, onFocus, placeholder, className } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     if (value !== undefined) {
         setQuery(value);
     }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
      if (query.length >= 0) setOpen(true);
      if (onFocus) onFocus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (onChange) onChange(e);
      setOpen(val.length >= 0);
  };

  const filteredItems = (items || []).filter(item => {
      if (filter) {
          return filter(query, item[selector], item[selector]);
      }
      return String(item[selector]).toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Input
          name={name}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn("w-full text-center rounded-xl bg-background border-input", inputProps?.className)}
          autoComplete="off"
          {...inputProps}
      />

      {open && filteredItems.length > 0 && (
        <div
            className="autocomplete-dropdown absolute left-0 right-0 top-full mt-1 z-[9999] max-h-60 overflow-auto rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
            {filteredItems.map((item, index) => (
                <div
                    key={index}
                    className="cursor-pointer px-4 py-2.5 text-sm text-start transition-colors hover:bg-accent hover:text-accent-foreground border-b border-border/50 last:border-b-0"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectOption(item);
                        setOpen(false);
                    }}
                >
                    {renderItem ? renderItem(item) : highlightMatch(String(item[selector]), query)}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomAutoComplete;
