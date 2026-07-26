import { cn } from '@web/shared/utils/cn';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Separator = ({ className, orientation = 'horizontal' }: SeparatorProps) => (
  <div
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
  />
);

export { Separator };
