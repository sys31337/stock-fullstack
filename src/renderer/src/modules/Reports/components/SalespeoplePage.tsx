import React, { useMemo, useState } from 'react';
import { t } from 'i18next';
import { format } from 'date-fns';
import { useSalespeople, useSalespersonChart } from '@web/shared/hooks/useReports';
import { Combobox } from '@web/shared/components/ui/combobox';
import { Button } from '@web/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import { ReportHeader, DateRangeBar, toDateParam } from '@web/modules/Reports/components/common';
import { money } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { exportCsv } from '@web/shared/functions/exportCsv';
import { Printer, FileSpreadsheet, Truck, CalendarDays, CalendarRange } from 'lucide-react';

const PALETTE = 'hsl(160 84% 39%)';

const BarChart: React.FC<{ points: { date: string; revenue: number; bills: number }[] }> = ({ points }) => {
  const W = 760;
  const H = 240;
  const pad = { left: 56, right: 16, top: 20, bottom: 34 };

  const maxVal = Math.max(...points.map((p) => p.revenue), 1) * 1.15;
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const slot = points.length > 0 ? innerW / points.length : innerW;
  const barW = Math.max(Math.min(slot * 0.6, 42), 2);

  const compact = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${Math.round(n)}`;
  };

  const gridLines = [0, 1, 2, 3, 4].map((i) => {
    const gv = (maxVal / 4) * i;
    const gy = pad.top + innerH - (gv / maxVal) * innerH;
    return { gy, label: compact(gv) };
  });

  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad.left} x2={W - pad.right} y1={g.gy} y2={g.gy} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
          <text x={pad.left - 8} y={g.gy + 4} textAnchor="end" fontSize="11" fill="hsl(var(--muted-foreground))">
            {g.label}
          </text>
        </g>
      ))}

      {points.map((p, i) => {
        const h = (p.revenue / maxVal) * innerH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        const y = pad.top + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={PALETTE} opacity={0.85}>
              <title>{`${format(new Date(`${p.date}T00:00:00`), 'd MMM yyyy')} — ${money(p.revenue)}`}</title>
            </rect>
            {(i % labelStep === 0 || i === points.length - 1) && (
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
                {format(new Date(`${p.date}T00:00:00`), 'd MMM')}
              </text>
            )}
          </g>
        );
      })}

      {points.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="hsl(var(--muted-foreground))">
          {t('noData')}
        </text>
      )}
    </svg>
  );
};

const SalespeoplePage: React.FC = () => {
  const { data: salespeople } = useSalespeople();
  const [salespersonId, setSalespersonId] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>({});

  const enabled = !!salespersonId && !!(range.startDate && range.endDate);
  const { data, isFetching } = useSalespersonChart(
    salespersonId,
    { ...range, groupBy },
    enabled,
  );

  const options = (salespeople || []).map((s) => ({
    value: s._id,
    label: s.fullname,
    group: s.isDeliveryPerson ? t('deliveryPersons') : t('salesPersons'),
  }));

  const points = useMemo(() => data?.points || [], [data]);

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
    const rows = points.map((p) => `
      <tr>
        <td class="mono">${format(new Date(`${p.date}T00:00:00`), 'd MMM yyyy')}</td>
        <td class="right mono">${money(p.revenue)}</td>
        <td class="right">${p.bills}</td>
      </tr>`).join('');
    printHtml(`
      <h1>${t('salespersonRevenue')}</h1>
      <p class="muted">${data.salesperson.fullname} — ${range.startDate || ''} → ${range.endDate || ''}</p>
      <hr class="divider">
      <div class="summary">
        <div class="summary-item"><div class="k">${t('totalRevenue')}</div><div class="v">${money(data.totalRevenue)}</div></div>
        <div class="summary-item"><div class="k">${t('billCount')}</div><div class="v">${data.billCount}</div></div>
      </div>
      <table>
        <thead><tr><th>${t('date')}</th><th class="right">${t('revenue')}</th><th class="right">${t('bills')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const exportReport = () => {
    if (!data) return;
    exportCsv(
      `salesperson-${data.salesperson.fullname}`,
      ['date', 'revenue', 'bills'],
      points.map((p) => [p.date, p.revenue, p.bills]),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-8 pb-8 pt-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <ReportHeader
            title={t('salespeopleReport')}
            description={t('salespeopleReportDesc')}
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

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            <div className="w-64">
              <Combobox
                options={options}
                value={salespersonId}
                onChange={(v) => setSalespersonId(v)}
                placeholder={t('selectSalesperson')}
                loading={!salespeople}
                size="sm"
              />
            </div>
            <DateRangeBar
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onApply={apply}
              onToday={onToday}
            />
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <Button
                variant={groupBy === 'day' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 gap-1 text-xs px-2"
                onClick={() => setGroupBy('day')}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {t('daily')}
              </Button>
              <Button
                variant={groupBy === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 gap-1 text-xs px-2"
                onClick={() => setGroupBy('month')}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                {t('monthly')}
              </Button>
            </div>
          </div>

          {!salespersonId ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
              <Truck className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('selectSalespersonToViewStats')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('salesperson')}</p>
                  <p className="mt-1 truncate text-lg font-semibold text-card-foreground">{data?.salesperson?.fullname || '...'}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('totalRevenue')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{money(data?.totalRevenue || 0)} DZD</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('billCount')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-card-foreground">{data?.billCount ?? '-'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">{t('revenueOverPeriod')}</h3>
                {isFetching ? (
                  <div className="h-60 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <BarChart points={points} />
                )}
              </div>

              {points.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">{t('revenue')}</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">{t('bills')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {points.map((p) => (
                        <TableRow key={p.date} className="hover:bg-muted/20">
                          <TableCell className="text-sm">{format(new Date(`${p.date}T00:00:00`), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-primary">{money(p.revenue)}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.bills}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalespeoplePage;
