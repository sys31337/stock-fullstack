import React, { useState } from 'react';
import { t } from 'i18next';
import { useCashStatement } from '@web/shared/hooks/useReports';
import { Button } from '@web/shared/components/ui/button';
import { ReportHeader, DateRangeBar, toDateParam, KpiCard } from '@web/modules/Reports/components/common';
import { money } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { exportCsv } from '@web/shared/functions/exportCsv';
import { Printer, FileSpreadsheet } from 'lucide-react';

const CashStatementPage: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<{ startDate?: string; endDate?: string } | null>(null);

  const enabled = !!(range && range.startDate && range.endDate);
  const { data, isLoading, isFetching, isError } = useCashStatement(range || {}, enabled);

  const apply = () => {
    setRange({
      startDate: toDateParam(startDate),
      endDate: toDateParam(endDate),
    });
  };

  const onToday = () => {
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const printReport = () => {
    if (!data) return;
    printHtml(`
      <h1>${t('cashStatement')}</h1>
      <p class="muted">${data.startDate || ''} → ${data.endDate || ''}</p>
      <hr class="divider">
      <div class="summary">
        <div class="summary-item"><div class="k">${t('purchasesTotal')}</div><div class="v">${money(data.purchases.total)}</div></div>
        <div class="summary-item"><div class="k">${t('salesTotal')}</div><div class="v">${money(data.sales.total)}</div></div>
        <div class="summary-item"><div class="k">${t('deliveryReturns')}</div><div class="v">${money(data.deliveryReturns)}</div></div>
        <div class="summary-item"><div class="k">${t('otherReceived')}</div><div class="v">${money(data.other.received)}</div></div>
        <div class="summary-item"><div class="k">${t('otherSpent')}</div><div class="v">${money(data.other.spent)}</div></div>
        <div class="summary-item"><div class="k">${t('cashierBalance')}</div><div class="v">${money(data.cashierBalance)}</div></div>
      </div>
      <table>
        <thead><tr><th></th><th class="right">${t('total')}</th><th class="right">${t('paid')}</th><th class="right">${t('debt')}</th></tr></thead>
        <tbody>
          <tr><td>${t('sales')}</td><td class="right mono">${money(data.sales.total)}</td><td class="right mono">${money(data.sales.paid)}</td><td class="right mono">${money(data.sales.debt)}</td></tr>
          <tr><td>${t('purchases')}</td><td class="right mono">${money(data.purchases.total)}</td><td class="right mono">${money(data.purchases.paid)}</td><td class="right mono">${money(data.purchases.debt)}</td></tr>
        </tbody>
      </table>`);
  };

  const exportReport = () => {
    if (!data) return;
    exportCsv('cash-statement', ['metric', 'value'], [
      ['startDate', data.startDate],
      ['endDate', data.endDate],
      ['salesTotal', data.sales.total],
      ['salesPaid', data.sales.paid],
      ['salesDebt', data.sales.debt],
      ['purchasesTotal', data.purchases.total],
      ['purchasesPaid', data.purchases.paid],
      ['purchasesDebt', data.purchases.debt],
      ['deliveryReturns', data.deliveryReturns],
      ['otherReceived', data.other.received],
      ['otherSpent', data.other.spent],
      ['cashierBalance', data.cashierBalance],
    ]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-8 pb-8 pt-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <ReportHeader
            title={t('cashStatement')}
            description={t('cashStatementDesc')}
            backTo="/reports"
            actions={
              <>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data || isFetching} onClick={printReport}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  {t('print')}
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data || isFetching} onClick={exportReport}>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
              </>
            }
          />

          <div className="rounded-xl border border-border bg-card p-3">
            <DateRangeBar
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onApply={apply}
              onToday={onToday}
            />
          </div>

          {isError && (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {t('analyticsLoadError')}
            </div>
          )}

          {enabled && !isError && (
            isLoading || isFetching ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : data && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <KpiCard label="salesTotal" value={data.sales.total} amount tone="bg-emerald-500/10 text-emerald-600" />
                  <KpiCard label="salesPaid" value={data.sales.paid} amount tone="bg-teal-500/10 text-teal-600" />
                  <KpiCard label="salesDebt" value={data.sales.debt} amount tone="bg-amber-500/10 text-amber-600" />
                  <KpiCard label="purchasesTotal" value={data.purchases.total} amount tone="bg-red-500/10 text-red-600" />
                  <KpiCard label="purchasesPaid" value={data.purchases.paid} amount tone="bg-rose-500/10 text-rose-600" />
                  <KpiCard label="purchasesDebt" value={data.purchases.debt} amount tone="bg-orange-500/10 text-orange-600" />
                  <KpiCard label="deliveryReturns" value={data.deliveryReturns} amount tone="bg-violet-500/10 text-violet-600" />
                  <KpiCard label="otherReceived" value={data.other.received} amount tone="bg-sky-500/10 text-sky-600" />
                  <KpiCard label="otherSpent" value={data.other.spent} amount tone="bg-slate-500/10 text-slate-600" />
                </div>

                <div className="rounded-xl border border-border bg-primary/5 p-5 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('cashierBalance')}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-primary">{money(data.cashierBalance)} DZD</p>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CashStatementPage;
