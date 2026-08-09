import React, { useState, useEffect } from 'react';
import { Switch } from '@web/shared/components/ui/switch';
import { Label } from '@web/shared/components/ui/label';
import { Separator } from '@web/shared/components/ui/separator';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { useToast } from '@web/shared/components/ui/use-toast';
import showToast from '@web/shared/functions/showToast';
import { useGetSettings, useUpdateSettings } from '@web/shared/hooks/useSettings';
import { t } from 'i18next';
import { Save, Loader2, Package, Building2, LayoutDashboard, X } from 'lucide-react';
import { cn } from '@web/shared/utils/cn';

const TABS = [
  { id: 'stock', label: 'stockTab', icon: Package },
  { id: 'company', label: 'companyTab', icon: Building2 },
  { id: 'dashboard', label: 'dashboardTab', icon: LayoutDashboard },
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
  const [dashboardStatsEnabled, setDashboardStatsEnabled] = useState(true);
  const [dashboardStatsBlurred, setDashboardStatsBlurred] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [ai, setAi] = useState('');
  const [nis, setNis] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [rib, setRib] = useState('');
  const [articleNumber, setArticleNumber] = useState('');
  const [stamp, setStamp] = useState(0);
  const [tva, setTva] = useState(19);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isFetched && settings) {
      setAllowOutOfStockSales(settings.allowOutOfStockSales ?? false);
      setAllowOutOfStockOrders(settings.allowOutOfStockOrders ?? false);
      setDashboardStatsEnabled(settings.dashboardStatsEnabled ?? true);
      setDashboardStatsBlurred(settings.dashboardStatsBlurred ?? false);
      setCompanyName(settings.companyName ?? '');
      setRc(settings.rc ?? '');
      setNif(settings.nif ?? '');
      setAi(settings.ai ?? '');
      setNis(settings.nis ?? '');
      setCompanyAddress(settings.companyAddress ?? '');
      setCompanyPhone(settings.companyPhone ?? '');
      setMobile(settings.mobile ?? '');
      setWebsite(settings.website ?? '');
      setEmail(settings.email ?? '');
      setWilaya(settings.wilaya ?? '');
      setAccountNumber(settings.accountNumber ?? '');
      setRib(settings.rib ?? '');
      setArticleNumber(settings.articleNumber ?? '');
      setStamp(settings.stamp ?? 0);
      setTva(settings.tva ?? 19);
      setDirty(false);
    }
  }, [isFetched, settings]);

  const buildPayload = () => {
    if (activeTab === 'stock') {
      return { allowOutOfStockSales, allowOutOfStockOrders };
    }
    if (activeTab === 'dashboard') {
      return { dashboardStatsEnabled, dashboardStatsBlurred };
    }
    if (activeTab === 'company') {
      return { companyName, rc, nif, ai, nis, companyAddress, companyPhone, mobile, website, email, wilaya, accountNumber, rib, articleNumber, stamp, tva };
    }
    return {};
  };

  const handleSave = async () => {
    try {
      await updateSettings(buildPayload());
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
            ) : activeTab === 'dashboard' ? (
              <div className="max-w-md space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('dashboardStatistics')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('dashboardStatisticsDesc')}</p>
                </div>
                <Separator />
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="stats-enabled" className="text-sm font-medium">{t('showDashboardStats')}</Label>
                      <p className="text-xs text-muted-foreground">{t('showDashboardStatsDesc')}</p>
                    </div>
                    <Switch
                      id="stats-enabled"
                      checked={dashboardStatsEnabled}
                      onCheckedChange={(v) => { setDashboardStatsEnabled(v); setDirty(true); }}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="stats-blurred" className="text-sm font-medium">{t('blurDashboardStats')}</Label>
                      <p className="text-xs text-muted-foreground">{t('blurDashboardStatsDesc')}</p>
                    </div>
                    <Switch
                      id="stats-blurred"
                      checked={dashboardStatsBlurred}
                      disabled={!dashboardStatsEnabled}
                      onCheckedChange={(v) => { setDashboardStatsBlurred(v); setDirty(true); }}
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
            ) : activeTab === 'company' ? (
              <div className="max-w-md space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('companyInfo')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('companyInfoDesc')}</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">{t('companyName')}</Label>
                    <Input value={companyName} onChange={(e) => { setCompanyName(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">RC</Label>
                      <Input value={rc} onChange={(e) => { setRc(e.target.value); setDirty(true); }} className="mt-1" placeholder="RC" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">NIF</Label>
                      <Input value={nif} onChange={(e) => { setNif(e.target.value); setDirty(true); }} className="mt-1" placeholder="NIF" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">AI</Label>
                      <Input value={ai} onChange={(e) => { setAi(e.target.value); setDirty(true); }} className="mt-1" placeholder="AI" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">NIS</Label>
                      <Input value={nis} onChange={(e) => { setNis(e.target.value); setDirty(true); }} className="mt-1" placeholder="NIS" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('address')}</Label>
                    <Input value={companyAddress} onChange={(e) => { setCompanyAddress(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('phone')}</Label>
                    <Input value={companyPhone} onChange={(e) => { setCompanyPhone(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('mobile')}</Label>
                    <Input value={mobile} onChange={(e) => { setMobile(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('website')}</Label>
                    <Input value={website} onChange={(e) => { setWebsite(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('email')}</Label>
                    <Input value={email} onChange={(e) => { setEmail(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('wilaya')}</Label>
                    <Input value={wilaya} onChange={(e) => { setWilaya(e.target.value); setDirty(true); }} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">{t('account')}</Label>
                      <Input value={accountNumber} onChange={(e) => { setAccountNumber(e.target.value); setDirty(true); }} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('rib')}</Label>
                      <Input value={rib} onChange={(e) => { setRib(e.target.value); setDirty(true); }} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('article_number')}</Label>
                      <Input value={articleNumber} onChange={(e) => { setArticleNumber(e.target.value); setDirty(true); }} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('stamp')}</Label>
                      <Input type="number" value={stamp} onChange={(e) => { setStamp(Number(e.target.value)); setDirty(true); }} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t('tva')}</Label>
                      <Input type="number" value={tva} onChange={(e) => { setTva(Number(e.target.value)); setDirty(true); }} className="mt-1" />
                    </div>
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
