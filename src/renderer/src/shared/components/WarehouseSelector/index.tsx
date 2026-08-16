import { useState, useEffect } from 'react';
import { useAvailableWarehouses } from '@web/shared/hooks/useWarehouses';
import { useSwitchWarehouse } from '@web/shared/hooks/useUsersEnhanced';
import { Button } from '@web/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@web/shared/components/ui/dropdown-menu';
import { Warehouse, Check } from 'lucide-react';
import { cn } from '@web/shared/utils/cn';
import { t } from 'i18next';

interface WarehouseSelectorProps {
  value?: string;
  onChange?: (warehouseId: string) => void;
  showAll?: boolean;
  size?: 'sm' | 'default';
}

const WarehouseSelector = ({ value, onChange, showAll = true, size = 'default' }: WarehouseSelectorProps) => {
  const { allowed, defaultId, accessMode } = useAvailableWarehouses();
  const { mutateAsync: switchWarehouse } = useSwitchWarehouse();
  const [selected, setSelected] = useState(value || defaultId || '');

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  const handleSelect = async (warehouseId: string) => {
    setSelected(warehouseId);
    if (onChange) onChange(warehouseId);
    else await switchWarehouse(warehouseId);
  };

  if (allowed.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          className={cn(
            'gap-2 border-border/60',
            size === 'sm' ? 'h-8 text-xs' : 'h-9'
          )}
        >
          <Warehouse className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span className="truncate max-w-[120px]">
            {selected
              ? allowed.find((w: any) => w._id === selected)?.name || t('selectWarehouse')
              : t('selectWarehouse')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('warehouses')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showAll && accessMode === 'all' && (
          <DropdownMenuItem onClick={() => handleSelect('')}>
            <div className="flex items-center gap-2 w-full">
              <Warehouse className="h-4 w-4 text-muted-foreground" />
              <span>{t('allWarehouses')}</span>
              {!selected && <Check className="h-4 w-4 ml-auto text-primary" />}
            </div>
          </DropdownMenuItem>
        )}
        {allowed.map((warehouse: any) => (
          <DropdownMenuItem key={warehouse._id} onClick={() => handleSelect(warehouse._id)}>
            <div className="flex items-center gap-2 w-full">
              <Warehouse className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm">{warehouse.name}</span>
                <span className="text-xs text-muted-foreground">{warehouse.code}</span>
              </div>
              {selected === warehouse._id && <Check className="h-4 w-4 ml-auto text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WarehouseSelector;
