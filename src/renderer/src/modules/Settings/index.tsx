import React, { useState, useEffect } from 'react';
import { Switch } from '@web/shared/components/ui/switch';
import { Label } from '@web/shared/components/ui/label';
import { Separator } from '@web/shared/components/ui/separator';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import showToast from '@web/shared/functions/showToast';
import { useGetSettings, useUpdateSettings } from '@web/shared/hooks/useSettings';
import { t } from 'i18next';
import { Save, Loader2, Package, X } from 'lucide-react';
import { cn } from '@web/shared/utils/cn';

const TABS = [
  { id: 'stock', label: 'stockTab', icon: Package },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('stock');

  const { data: settings, isFetched } = useGetSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();
  const { toast } = useToast();

  const [allowOutOfStockSales, setAllowOutOfStockSales] = useState(false);
  const [allowOutOfStockOrders, setAllowOutOfStockOrders] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isFetched && settings) {
      setAllowOutOfStockSales(settings.allowOutOfStockSales ?? false);
      setAllowOutOfStockOrders(settings.allowOutOfStockOrders ?? false);
      setDirty(false);
    }
  }, [isFetched, settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        allowOutOfStockSales,
        allowOutOfStockOrders,
      });
      setDirty(false);
      showToast(toast, { title: t('actionPerformed'), description: t('settingsSaved'), status: 'success' });
    } catch {
      showToast(toast, { title: t('error'), description: 'Failed to save settings', status: 'error' });
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 z-[201] h-full w-[520px] max-w-full bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold">{t('settings')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-44 shrink-0 border-r border-border bg-muted/20 p-3 flex flex-col gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left',
                    activeTab === tab.id
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(tab.label)}
                </button>
              );
            })}
          </aside>

          <div className="flex-1 overflow-auto p-5">
            {!isFetched ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">{t('loading')}...</span>
              </div>
            ) : activeTab === 'stock' ? (
              <div className="max-w-md space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('stockManagement')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('stockManagementDesc')}</p>
                </div>
                <Separator />
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="out-of-stock-sales" className="text-sm font-medium">{t('allowOutOfStockSales')}</Label>
                      <p className="text-xs text-muted-foreground">{t('allowOutOfStockSalesDesc')}</p>
                    </div>
                    <Switch
                      id="out-of-stock-sales"
                      checked={allowOutOfStockSales}
                      onCheckedChange={(v) => { setAllowOutOfStockSales(v); setDirty(true); }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="out-of-stock-orders" className="text-sm font-medium">{t('allowOutOfStockOrders')}</Label>
                      <p className="text-xs text-muted-foreground">{t('allowOutOfStockOrdersDesc')}</p>
                    </div>
                    <Switch
                      id="out-of-stock-orders"
                      checked={allowOutOfStockOrders}
                      onCheckedChange={(v) => { setAllowOutOfStockOrders(v); setDirty(true); }}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-3">
                  <Button onClick={handleSave} disabled={!dirty || isPending} className="gap-2">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('save')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsDrawer;
