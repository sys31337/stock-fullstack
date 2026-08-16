import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from 'i18next';
import { Warehouse } from 'lucide-react';
import { Button } from '@web/shared/components/ui/button';
import { cn } from '@web/shared/utils/cn';
import { useAvailableWarehouses } from '@web/shared/hooks/useWarehouses';
import { useSwitchWarehouse } from '@web/shared/hooks/useUsersEnhanced';

const WarehouseChooser = () => {
  const { mode, allowed, defaultId, isLoading } = useAvailableWarehouses();
  const { mutateAsync: switchWarehouse, isPending } = useSwitchWarehouse();
  const [selected, setSelected] = useState('');

  const needsChoice = mode === 'multi' && !isLoading && !!allowed.length && (!defaultId || !allowed.some((w: any) => w._id === defaultId));

  useEffect(() => {
    if (needsChoice && !selected) {
      setSelected(defaultId || allowed[0]?._id || '');
    }
  }, [needsChoice, defaultId, allowed, selected]);

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      await switchWarehouse(selected);
    } catch {
      // keep the chooser open so the user can retry
    }
  };

  if (!needsChoice) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-popover p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t('chooseWarehouse')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('chooseWarehouseMessage')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {(allowed as any[]).map((wh: any) => (
            <button
              key={wh._id}
              type="button"
              onClick={() => setSelected(wh._id)}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                selected === wh._id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-accent'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{wh.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{wh.code}</p>
                </div>
                <div className={cn(
                  'h-4 w-4 rounded-full border shrink-0',
                  selected === wh._id ? 'border-primary bg-primary' : 'border-input'
                )} />
              </div>
            </button>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleConfirm}
          disabled={!selected || isPending}
        >
          {isPending ? '...' : t('continue')}
        </Button>
      </div>
    </div>,
    document.body
  );
};

export default WarehouseChooser;
