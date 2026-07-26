import { cn } from '@web/shared/utils/cn';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  'data-state'?: string;
}

const Checkbox = ({ id, checked, onCheckedChange, className, disabled, ...props }: CheckboxProps) => {
  const indeterminate = props['data-state'] === 'indeterminate';

  return (
    <button
      id={id}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      data-state={checked ? 'checked' : indeterminate ? 'indeterminate' : 'unchecked'}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-md border-2 border-border transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'flex items-center justify-center',
        checked
          ? 'bg-primary border-primary text-primary-foreground shadow-sm'
          : indeterminate
            ? 'bg-primary/60 border-primary/60 text-primary-foreground'
            : 'bg-background hover:border-primary/60',
        className,
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
      {indeterminate && <Minus className="h-3.5 w-3.5 stroke-[3]" />}
    </button>
  );
};

export { Checkbox };
