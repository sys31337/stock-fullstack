import React from 'react';
import {
  Wallet,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Lock,
  Banknote,
  TrendingUp,
  CalendarRange,
  HandCoins,
} from 'lucide-react';
import { Button } from '@web/shared/components/ui/button';
import { t } from 'i18next';
import { cn } from '@web/shared/utils/cn';
import { price } from '@web/shared/functions/words';
import { DashboardStats } from '@web/shared/hooks/useDashboard';

interface HeroCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
  amount?: boolean;
  footer?: React.ReactNode;
  blurred: boolean;
  loading: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({
  label, value, icon, tone, amount, footer, blurred, loading,
}) => (
  <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full from-transparent to-accent/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    <div className="flex items-center justify-between gap-3 absolute bottom-3 right-3">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
        {icon}
      </span>
    </div>
    <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {t(label)}
    </p>
    <div className="mt-0.5 flex items-center gap-2">
      {loading ? (
        <span className="block h-8 w-24 animate-pulse rounded-md bg-muted" />
      ) : (
        <span
          className={cn(
            'text-2xl font-bold tracking-tight text-card-foreground tabular-nums',
            blurred && 'blur-[6px] select-none'
          )}
        >
          {amount ? price(value) : value.toLocaleString()} {amount && (
        <span className="inline-flex items-center rounded-md text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          DZD
        </span>
      )}
        </span>
      )}
    </div>
    {footer && (
      <div className={cn('mt-1.5 text-xs font-medium', blurred && !loading ? 'blur-[4px] select-none' : 'text-muted-foreground')}>
        {footer}
      </div>
    )}
  </div>
);

interface StatisticsProps {
  stats?: DashboardStats;
  isLoading: boolean;
  onViewAll: () => void;
}

const Statistics: React.FC<StatisticsProps> = ({ stats, isLoading, onViewAll }) => {
  const blurred = stats?.statisticsBlurred === true;

  const todaySales = stats?.todaySalesAmount || 0;
  const yesterdaySales = stats?.yesterdaySalesAmount || 0;
  const delta = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : (todaySales > 0 ? 100 : 0);
  const deltaPositive = delta >= 0;
  const deltaLabel = `${deltaPositive ? '+' : ''}${delta.toFixed(1)}%`;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t('statistics')}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('statisticsDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          {blurred && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t('statisticsHidden')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onViewAll} className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t('viewAll')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard
          label="totalRevenue"
          value={stats?.totalSalesAmount || 0}
          icon={<Wallet className="h-5 w-5" />}
          tone="bg-emerald-500/10 text-emerald-600"
          amount
          footer={
            <span className="text-muted-foreground">
              {t('totalPurchasesAmount')}: {price(stats?.totalPurchasesAmount || 0)} DZD
            </span>
          }
          blurred={blurred}
          loading={isLoading}
        />
        <HeroCard
          label="todaySales"
          value={todaySales}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="bg-amber-500/10 text-amber-600"
          amount
          footer={
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('inline-flex items-center gap-0.5', deltaPositive ? 'text-emerald-600' : 'text-red-600')}>
                {deltaPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {deltaLabel}
              </span>
              <span className="text-muted-foreground">vs {t('yesterday')}</span>
            </span>
          }
          blurred={blurred}
          loading={isLoading}
        />
        <HeroCard
          label="pendingOrders"
          value={stats?.pendingOrders || 0}
          icon={<Clock className="h-5 w-5" />}
          tone="bg-indigo-500/10 text-indigo-600"
          footer={<span className="text-muted-foreground">{t('awaitingFulfillment')}</span>}
          blurred={blurred}
          loading={isLoading}
        />
        <HeroCard
          label="lowStockProducts"
          value={stats?.lowStockProducts || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="bg-red-500/10 text-red-600"
          footer={<span className="text-muted-foreground">{t('belowStockThreshold')}</span>}
          blurred={blurred}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard
          label="todayCashCollected"
          value={stats?.todayCashCollected || 0}
          icon={<Banknote className="h-5 w-5" />}
          tone="bg-sky-500/10 text-sky-600"
          amount
          footer={<span className="text-muted-foreground">{t('cashCollectedToday')}</span>}
          blurred={blurred}
          loading={isLoading}
        />
        <HeroCard
          label="profitThisMonth"
          value={stats?.profitThisMonth || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="bg-violet-500/10 text-violet-600"
          amount
          footer={<span className="text-muted-foreground">{t('thisMonth')}</span>}
          blurred={blurred}
          loading={isLoading}
        />
        <HeroCard
          label="profitThisYear"
          value={stats?.profitThisYear || 0}
          icon={<CalendarRange className="h-5 w-5" />}
          tone="bg-indigo-500/10 text-indigo-600"
          amount
          footer={<span className="text-muted-foreground">{t('thisYear')}</span>}
          blurred={blurred}
          loading={isLoading}
        />
        <HeroCard
          label="employeeDebt"
          value={stats?.employeeDebt || 0}
          icon={<HandCoins className="h-5 w-5" />}
          tone="bg-rose-500/10 text-rose-600"
          amount
          footer={<span className="text-muted-foreground">{t('employeeDebtDesc')}</span>}
          blurred={blurred}
          loading={isLoading}
        />
      </div>
      <hr />
    </section>
  );
};

export default Statistics;
