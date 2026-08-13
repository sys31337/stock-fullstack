import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { useReportsOverview } from '@web/shared/hooks/useReports';
import { ReportHeader, KpiCard } from '@web/modules/Reports/components/common';
import { money } from '@web/shared/functions/words';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import {
  CalendarRange, Package, HandCoins,
  BarChart3, Truck, Wallet, ArrowRight,
} from 'lucide-react';

const ReportsHub: React.FC = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading, isError } = useReportsOverview();

  const navCards = [
    { label: 'ledger', desc: 'ledgerDesc', icon: <Wallet className="h-5 w-5" />, to: '/reports/ledger', tone: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'cashStatement', desc: 'cashStatementDesc', icon: <CalendarRange className="h-5 w-5" />, to: '/reports/cash-statement', tone: 'bg-sky-500/10 text-sky-600' },
    { label: 'productStats', desc: 'productStatsDesc', icon: <Package className="h-5 w-5" />, to: '/reports/products', tone: 'bg-amber-500/10 text-amber-600' },
    { label: 'salespeopleReport', desc: 'salespeopleReportDesc', icon: <Truck className="h-5 w-5" />, to: '/reports/salespeople', tone: 'bg-violet-500/10 text-violet-600' },
    { label: 'deliveryReturns', desc: 'deliveryReturnsDesc', icon: <HandCoins className="h-5 w-5" />, to: '/reports/delivery-returns', tone: 'bg-rose-500/10 text-rose-600' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-8 pb-8 pt-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <ReportHeader title={t('reports')} description={t('reportsDesc')} />

          {isError ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {t('analyticsLoadError')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="todaySalesAmount" value={overview?.todaySalesAmount || 0} amount tone="bg-emerald-500/10 text-emerald-600" />
                <KpiCard label="todayCashCollected" value={overview?.todayCashCollected || 0} amount tone="bg-sky-500/10 text-sky-600" />
                <KpiCard label="profitThisMonth" value={overview?.profitThisMonth || 0} amount tone="bg-amber-500/10 text-amber-600" />
                <KpiCard label="profitThisYear" value={overview?.profitThisYear || 0} amount tone="bg-indigo-500/10 text-indigo-600" />
                <KpiCard label="employeeDebt" value={overview?.employeeDebt || 0} amount tone="bg-rose-500/10 text-rose-600" />
                <KpiCard label="totalClients" value={overview?.totalClients || 0} tone="bg-blue-500/10 text-blue-600" />
                <KpiCard label="totalSuppliers" value={overview?.totalSuppliers || 0} tone="bg-violet-500/10 text-violet-600" />
                <KpiCard label="totalProducts" value={overview?.totalProducts || 0} tone="bg-teal-500/10 text-teal-600" />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
                  <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-card-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {t('inventoryValuation')}
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">{t('inventoryValuationDesc')}</p>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-semibold uppercase">{t('metric')}</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase">{t('value')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{t('valuationAtCost')}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{money(overview?.inventoryValuation.atCost || 0)} DZD</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t('valuationSell1')}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(overview?.inventoryValuation.atSell1 || 0)} DZD</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t('valuationSell2')}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(overview?.inventoryValuation.atSell2 || 0)} DZD</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t('valuationSell3')}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(overview?.inventoryValuation.atSell3 || 0)} DZD</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t('marginSell1')}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{money(overview?.inventoryValuation.margin1 || 0)} DZD</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t('marginSell2')}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{money(overview?.inventoryValuation.margin2 || 0)} DZD</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{t('marginSell3')}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{money(overview?.inventoryValuation.margin3 || 0)} DZD</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="space-y-3">
                  {navCards.map((card) => (
                    <button
                      key={card.to}
                      type="button"
                      onClick={() => navigate(card.to)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className={cnTone(card.tone)}>{card.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-card-foreground">{t(card.label)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{t(card.desc)}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const cnTone = (tone: string) => `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`;

export default ReportsHub;
