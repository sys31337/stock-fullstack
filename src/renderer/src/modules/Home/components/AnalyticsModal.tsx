import React, { useState } from 'react';
import CustomModal from '@web/shared/components/CustomModal';
import { TrendChart, DonutChart } from '@web/shared/components/Charts';
import { t } from 'i18next';
import { format } from 'date-fns';
import { cn } from '@web/shared/utils/cn';
import { price } from '@web/shared/functions/words';
import { useDashboardAnalytics } from '@web/shared/hooks/useDashboard';
import { useGetAllWarehouses } from '@web/shared/hooks/useWarehouses';
import { Combobox } from '@web/shared/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import { Button } from '@web/shared/components/ui/button';
import {
  Package, Users, Factory, ShoppingCart, ShoppingBag, Clock, AlertTriangle,
  Warehouse, UserRound, Wallet, Banknote, BarChart3, TrendingUp, SlidersHorizontal, Trophy,
} from 'lucide-react';

const PERIODS = [
  { days: 7, label: 'last7Days' },
  { days: 30, label: 'last30Days' },
  { days: 90, label: 'last90Days' },
];

interface KpiItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  tone: string;
  amount?: boolean;
}

const KPIS: KpiItem[] = [
  { key: 'totalProducts', label: 'totalProducts', icon: <Package className="h-4 w-4" />, tone: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'totalCustomers', label: 'totalCustomers', icon: <Users className="h-4 w-4" />, tone: 'bg-sky-500/10 text-sky-600' },
  { key: 'totalSuppliers', label: 'totalSuppliers', icon: <Factory className="h-4 w-4" />, tone: 'bg-violet-500/10 text-violet-600' },
  { key: 'todaySales', label: 'todaySales', icon: <ShoppingCart className="h-4 w-4" />, tone: 'bg-amber-500/10 text-amber-600' },
  { key: 'todaySalesAmount', label: 'todaySalesAmount', icon: <Banknote className="h-4 w-4" />, tone: 'bg-amber-500/10 text-amber-600', amount: true },
  { key: 'todayPurchases', label: 'todayPurchases', icon: <ShoppingBag className="h-4 w-4" />, tone: 'bg-rose-500/10 text-rose-600' },
  { key: 'todayPurchasesAmount', label: 'todayPurchasesAmount', icon: <Banknote className="h-4 w-4" />, tone: 'bg-rose-500/10 text-rose-600', amount: true },
  { key: 'pendingOrders', label: 'pendingOrders', icon: <Clock className="h-4 w-4" />, tone: 'bg-indigo-500/10 text-indigo-600' },
  { key: 'lowStockProducts', label: 'lowStockProducts', icon: <AlertTriangle className="h-4 w-4" />, tone: 'bg-red-500/10 text-red-600' },
  { key: 'totalWarehouses', label: 'totalWarehouses', icon: <Warehouse className="h-4 w-4" />, tone: 'bg-teal-500/10 text-teal-600' },
  { key: 'totalUsers', label: 'totalUsers', icon: <UserRound className="h-4 w-4" />, tone: 'bg-blue-500/10 text-blue-600' },
  { key: 'totalSalesAmount', label: 'totalRevenue', icon: <Wallet className="h-4 w-4" />, tone: 'bg-emerald-500/10 text-emerald-600', amount: true },
  { key: 'todayCashCollected', label: 'todayCashCollected', icon: <Banknote className="h-4 w-4" />, tone: 'bg-sky-500/10 text-sky-600', amount: true },
  { key: 'profitThisMonth', label: 'profitThisMonth', icon: <TrendingUp className="h-4 w-4" />, tone: 'bg-violet-500/10 text-violet-600', amount: true },
  { key: 'profitThisYear', label: 'profitThisYear', icon: <Trophy className="h-4 w-4" />, tone: 'bg-indigo-500/10 text-indigo-600', amount: true },
  { key: 'employeeDebt', label: 'employeeDebt', icon: <UserRound className="h-4 w-4" />, tone: 'bg-rose-500/10 text-rose-600', amount: true },
];

const movementTone: Record<string, string> = {
  IN: 'bg-emerald-100 text-emerald-700',
  OUT: 'bg-red-100 text-red-700',
  TRANSFER_IN: 'bg-blue-100 text-blue-700',
  TRANSFER_OUT: 'bg-violet-100 text-violet-700',
  ADJUSTMENT: 'bg-amber-100 text-amber-700',
  RETURN: 'bg-teal-100 text-teal-700',
};

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [warehouse, setWarehouse] = useState('');
  const [days, setDays] = useState(30);
  const { data: warehouses } = useGetAllWarehouses();
  const { data: analytics, isLoading, isError, refetch } = useDashboardAnalytics({ warehouse, days }, isOpen);
  const blurred = analytics?.statisticsBlurred === true;

  const warehouseOptions = (warehouses || []).map((w: any) => ({ value: w._id, label: w.name }));

  const stats = (analytics as any) || {};
  const revenueTrend = analytics?.revenueTrend || [];
  const salesByProduct = analytics?.salesByProduct || [];
  const topProducts = analytics?.topProducts || [];
  const recentMovements = analytics?.recentMovements || [];

  const maxQuantity = Math.max(...topProducts.map((p) => p.quantity), 1);

  return (
    <CustomModal modalProps={{ size: 'full' }} isOpen={isOpen} onClose={onClose} title={t('statistics')}>
      {isError ? (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm">{t('analyticsLoadError')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : isLoading || !analytics ? (
        <div className="flex h-[80vh] items-center justify-center gap-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">{t('loading')}...</p>
        </div>
      ) : (
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('statisticsOverview')}</h3>
              <p className="text-sm text-muted-foreground">{t('statisticsOverviewDesc')}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('realTime')}
            </span>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t('filters')}
              </span>
              <div className="w-52">
                <Combobox
                  options={warehouseOptions}
                  value={warehouse}
                  onChange={setWarehouse}
                  placeholder={t('allWarehouses')}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setDays(p.days)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    days === p.days ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(p.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {KPIS.map(({ key, label, icon, tone, amount }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t(label)}
                  </p>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', tone)}>{icon}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={cn('text-xl font-bold tracking-tight tabular-nums', blurred && 'blur-[6px] select-none')}>
                    {amount ? price(Number(stats[key]) || 0) : (Number(stats[key]) || 0).toLocaleString()}
                  </span>
                  {amount && <span className="text-[10px] font-semibold uppercase text-muted-foreground">DZD</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {t('revenueTrend')}
                  </h4>
                  <p className="text-xs text-muted-foreground">{t('revenueTrendDesc')}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
                  <Wallet className="h-3.5 w-3.5" />
                  {price(Number(stats.totalSalesAmount) || 0)} DZD
                </span>
              </div>
              <TrendChart data={revenueTrend} blurred={blurred} />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <DonutIcon />
                {t('salesByProduct')}
              </h4>
              <p className="mb-5 text-xs text-muted-foreground">{t('salesByProductDesc')}</p>
              <DonutChart data={salesByProduct} blurred={blurred} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                  <Trophy className="h-4 w-4 text-primary" />
                  {t('bestSellers')}
                </h4>
                <p className="text-xs text-muted-foreground">{t('bestSellersDesc')}</p>
              </div>
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noData')}</p>
              ) : (
                <div className="space-y-3.5">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                        i === 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'
                      )}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium text-card-foreground">{p.name}</span>
                          <span className={cn('shrink-0 text-xs font-semibold tabular-nums text-emerald-600', blurred && 'blur-[5px] select-none')}>
                            {price(p.total)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                            style={{ width: `${(p.quantity / maxQuantity) * 100}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span className="tabular-nums">{p.quantity} {t('unitsSold')}</span>
                          <span className="flex items-center gap-1.5">
                            {p.lowStock && (
                              <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 font-medium text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                {t('lowStockBadge')}
                              </span>
                            )}
                            <span className={cn('tabular-nums', blurred && 'blur-[5px] select-none')}>
                              {p.stock} {t('inStock')}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 text-sm font-semibold text-card-foreground">{t('recentMovements')}</h4>
              {recentMovements.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noData')}</p>
              ) : (
                <div className="-mx-5 -my-1 overflow-x-auto px-5">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold uppercase">{t('product')}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">{t('type')}</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">{t('quantity')}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">{t('warehouse')}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentMovements.map((m: any) => (
                        <TableRow key={m._id} className="hover:bg-muted/20">
                          <TableCell className="max-w-[180px] truncate text-sm font-medium">
                            {m.product?.productName || '-'}
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', movementTone[m.type] || 'bg-muted text-muted-foreground')}>
                              {m.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
                          <TableCell className="text-sm">{m.warehouse?.name || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomModal>
  );
};

const DonutIcon = () => (
  <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" fill="none" strokeOpacity="0.3" />
    <path d="M12 3a9 9 0 0 1 9 9h-9z" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="2" fill="var(--card)" stroke="none" />
  </svg>
);

export default AnalyticsModal;
