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
  inputProps?: { [key: string]: Any };
  value?: string;
  placeholder?: string;
  className?: string;
}

const CustomAutoComplete = (props: CustomAutoCompleteProps) => {
  const { filter, name, value, onSelectOption, onChange, items, inputProps, selector, onFocus, placeholder, className, ...rest } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Update query when value changes externally
  useEffect(() => {
     if (value !== undefined) {
         setQuery(value);
     }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
      setOpen(true);
      if (onFocus) onFocus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (onChange) onChange(e);
      setOpen(true);
  };

  const filteredItems = (items || []).filter(item => {
      if (!query) return true;
      if (filter) {
          // Note: filter signature in props is (query, optionValue, optionLabel)
          // We pass query, value, label. Assuming selector gives both value and label for simplicity or checking logic.
          return filter(query, item[selector], item[selector]);
      }
      return String(item[selector]).toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div className="relative">
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
      </div>

      {open && filteredItems.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-popover text-popover-foreground shadow-lg">
            {filteredItems.map((item, index) => (
                <div
                    key={index}
                    className="cursor-pointer px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                    onClick={() => {
                        onSelectOption(item);
                        // We don't setQuery here because onSelectOption usually updates the parent state which flows back via props.value
                        // But if uncontrolled, we might want to.
                        // Given usage, it seems controlled.
                        setOpen(false);
                    }}
                >
                    {item[selector]}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomAutoComplete;
