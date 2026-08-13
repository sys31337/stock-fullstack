import React, { useState } from 'react';
import { t } from 'i18next';
import { useProductStats, ProductStatFilters } from '@web/shared/hooks/useReports';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import { Combobox } from '@web/shared/components/ui/combobox';
import { Button } from '@web/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import Pagination from '@web/shared/components/Pagination';
import { ReportHeader, DateRangeBar, toDateParam, fmtDate, EmptyState, TypeBadge } from '@web/modules/Reports/components/common';
import { money } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { exportCsv } from '@web/shared/functions/exportCsv';
import { Printer, FileSpreadsheet, PackageSearch } from 'lucide-react';

const PAGE_SIZE = 25;

const ProductStatsPage: React.FC = () => {
  const [productId, setProductId] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [committed, setCommitted] = useState<ProductStatFilters>({ page: 1, limit: PAGE_SIZE });
  const [page, setPage] = useState(1);

  const { data: products } = useGetAllProducts();
  const { data, isFetching } = useProductStats(productId, { ...committed, startDate: committed.startDate, endDate: committed.endDate }, !!productId);

  const productOptions = (products || []).map((p: any) => ({ value: p._id, label: p.productName }));

  const applyFilters = () => {
    setCommitted((prev) => ({
      ...prev,
      startDate: toDateParam(startDate),
      endDate: toDateParam(endDate),
    }));
    setPage(1);
  };

  const onToday = () => {
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const totalRevenue = (data?.rows || []).reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);

  const printReport = () => {
    if (!data) return;
    const rows = data.rows.map((r) => `
      <tr>
        <td class="mono">${fmtDate(r.billDate)}</td>
        <td>${r.orderId}</td>
        <td>${r.customer?.fullname || '-'}</td>
        <td>${t(r.type.toLowerCase())}</td>
        <td class="right mono">${r.quantity}</td>
        <td class="right mono">${money(r.unitPrice)}</td>
        <td class="right mono">${money(r.quantity * r.unitPrice)}</td>
      </tr>`).join('');
    printHtml(`
      <h1>${t('productStats')}</h1>
      <p class="muted">${data.product.productName} — ${committed.startDate || ''} → ${committed.endDate || ''}</p>
      <hr class="divider">
      <div class="summary">
        <div class="summary-item"><div class="k">${t('billCount')}</div><div class="v">${data.billCount}</div></div>
        <div class="summary-item"><div class="k">${t('totalQuantity')}</div><div class="v">${data.totalQuantity}</div></div>
      </div>
      <table>
        <thead><tr><th>${t('date')}</th><th>${t('reference')}</th><th>${t('party')}</th><th>${t('type')}</th><th class="right">${t('quantity')}</th><th class="right">${t('unitPrice')}</th><th class="right">${t('amount')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const exportReport = () => {
    if (!data) return;
    exportCsv(
      `product-${data.product.productName}`,
      ['date', 'reference', 'party', 'type', 'quantity', 'unitPrice', 'amount'],
      data.rows.map((r) => [
        fmtDate(r.billDate),
        r.orderId,
        r.customer?.fullname || '',
        r.type,
        r.quantity,
        r.unitPrice,
        r.quantity * r.unitPrice,
      ]),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-8 pb-8 pt-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <ReportHeader
            title={t('productStats')}
            description={t('productStatsDesc')}
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
                options={productOptions}
                value={productId}
                onChange={(v) => {
                  setProductId(v);
                  setPage(1);
                }}
                placeholder={t('selectProduct')}
                loading={!products}
                size="sm"
              />
            </div>
            <DateRangeBar
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onApply={applyFilters}
              onToday={onToday}
            />
          </div>

          {!productId ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('selectProductToViewStats')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('billCount')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-card-foreground">{data?.billCount ?? '-'}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('totalQuantity')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-card-foreground">{data?.totalQuantity ?? '-'}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('totalRevenue')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{money(totalRevenue)} DZD</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">{t('reference')}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">{t('party')}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">{t('type')}</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase">{t('quantity')}</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase">{t('unitPrice')}</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase">{t('amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && (
                      <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">{t('loading')}...</TableCell></TableRow>
                    )}
                    {!isFetching && (data?.rows || []).length === 0 && (
                      <TableRow><TableCell colSpan={7}><EmptyState /></TableCell></TableRow>
                    )}
                    {(data?.rows || []).map((r) => (
                      <TableRow key={r._id} className="hover:bg-muted/20">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.billDate)}</TableCell>
                        <TableCell className="text-sm font-medium">{r.orderId}</TableCell>
                        <TableCell className="text-sm">{r.customer?.fullname || '-'}</TableCell>
                        <TableCell><TypeBadge type={r.type} /></TableCell>
                        <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(r.unitPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{money(r.quantity * r.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data && data.total > 0 && (
                <Pagination
                  totalCount={data.total}
                  currentPage={page}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => {
                    setPage(p);
                    setCommitted((prev) => ({ ...prev, page: p }));
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductStatsPage;
