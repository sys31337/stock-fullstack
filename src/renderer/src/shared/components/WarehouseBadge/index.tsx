import { Warehouse } from 'lucide-react';
import { cn } from '@web/shared/utils/cn';

interface WarehouseBadgeProps {
  name: string;
  code?: string;
  className?: string;
}

const WarehouseBadge = ({ name, code, className }: WarehouseBadgeProps) => (
  <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 bg-primary/5 text-primary rounded-md text-xs font-medium', className)}>
    <Warehouse className="h-3 w-3" />
    <span>{name}</span>
    {code && <span className="text-primary/60">({code})</span>}
  </div>
);

export default WarehouseBadge;
