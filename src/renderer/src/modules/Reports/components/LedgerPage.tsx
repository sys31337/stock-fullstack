import React, { useMemo, useState } from 'react';
import { t } from 'i18next';
import { useLedger, useDeleteTransaction, LedgerFilters } from '@web/shared/hooks/useReports';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useGetMyPermissions } from '@web/shared/hooks/useUsersEnhanced';
import { Combobox } from '@web/shared/components/ui/combobox';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import Pagination from '@web/shared/components/Pagination';
import { ReportHeader, DateRangeBar, toDateParam, fmtDate, TypeBadge, AmountCell, EmptyState } from '@web/modules/Reports/components/common';
import { LedgerStatementDialog, LedgerDetailDialog } from '@web/modules/Reports/components/LedgerDialogs';
import { money } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { exportCsv } from '@web/shared/functions/exportCsv';
import { Printer, FileSpreadsheet, Trash2, FileText, ScrollText, Search } from 'lucide-react';
import { useToast } from '@web/shared/components/ui/use-toast';
import showToast from '@web/shared/functions/showToast';

const PAGE_SIZE = 25;

const LedgerPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [party, setParty] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [committed, setCommitted] = useState<LedgerFilters>({ page: 1, limit: PAGE_SIZE });
  const [page, setPage] = useState(1);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: customers } = useGetAllCustomers();
  const { data: permissions } = useGetMyPermissions();
  const deleteTx = useDeleteTransaction();
  const { toast } = useToast();

  const isAdmin = permissions?.isMainAccount === true || (permissions?.effectivePermissions || []).includes('*');

  const range = useMemo(
    () => ({
      startDate: committed.startDate,
      endDate: committed.endDate,
    }),
    [committed.startDate, committed.endDate],
  );

  const { data, isFetching } = useLedger({ ...committed, party, search, page });

  const customerOptions = (customers || [])
    .filter((c: any) => c?._id)
    .map((c: any) => ({ value: c._id, label: c.fullname }));

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

  const printRows = () => {
    if (!data) return;
    const rows = data.items.map((r) => `
      <tr>
        <td class="mono">${fmtDate(r.createdAt)}</td>
        <td>${r.reference}</td>
        <td>${r.customer?.fullname || '-'}</td>
        <td><span class="badge badge-${r.type.toLowerCase()}">${t(r.type.toLowerCase())}</span></td>
        <td class="right mono ${r.addedAmount < 0 ? 'neg' : 'pos'}">${money(r.addedAmount)}</td>
        <td class="right mono">${money(r.balanceBefore)}</td>
        <td class="right mono">${money(r.balanceAfter)}</td>
      </tr>`).join('');
    printHtml(`
      <h1>${t('ledger')}</h1>
      <p class="muted">${committed.startDate || ''} → ${committed.endDate || ''}</p>
      <hr class="divider">
      <table>
        <thead><tr><th>${t('date')}</th><th>${t('reference')}</th><th>${t('party')}</th><th>${t('type')}</th><th class="right">${t('amount')}</th><th class="right">${t('balanceBefore')}</th><th class="right">${t('balanceAfter')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const exportRows = () => {
    if (!data) return;
    exportCsv(
      'ledger',
      ['date', 'reference', 'party', 'type', 'amount', 'balanceBefore', 'balanceAfter'],
      data.items.map((r) => [
        fmtDate(r.createdAt),
        r.reference,
        r.customer?.fullname || '',
        r.type,
        r.addedAmount,
        r.balanceBefore,
        r.balanceAfter,
      ]),
    );
  };

  const onDelete = async (id: string) => {
    if (!window.confirm(t('confirmDeleteTransaction'))) return;
    try {
      await deleteTx.mutateAsync(id);
      showToast(toast, {
        title: t('deleted'),
        description: t('transactionDeleted'),
        status: 'success',
      });
    } catch (error: any) {
      showToast(toast, {
        title: t('error'),
        description: error?.response?.data?.message || t('errorOccurred'),
        status: 'error',
        duration: 4000,
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-8 pb-8 pt-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <ReportHeader
            title={t('ledger')}
            description={t('ledgerDesc')}
            backTo="/reports"
            actions={
              <>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={printRows}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  {t('print')}
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={exportRows}>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
              </>
            }
          />

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder={t('searchLedger')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); applyFilters(); } }}
              />
            </div>
            <div className="w-52">
              <Combobox
                options={customerOptions}
                value={party}
                onChange={(v) => { setParty(v); setPage(1); }}
                placeholder={t('allParties')}
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

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('reference')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('party')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('type')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('amount')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('balanceBefore')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('balanceAfter')}</TableHead>
                  <TableHead className="w-32 text-right text-xs font-semibold uppercase">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching && (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">{t('loading')}...</TableCell></TableRow>
                )}
                {!isFetching && (data?.items || []).length === 0 && (
                  <TableRow><TableCell colSpan={8}><EmptyState /></TableCell></TableRow>
                )}
                {(data?.items || []).map((r) => (
                  <TableRow key={r._id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{r.reference}</TableCell>
                    <TableCell className="text-sm">{r.customer?.fullname || '-'}</TableCell>
                    <TableCell><TypeBadge type={r.type} /></TableCell>
                    <TableCell className="text-right"><AmountCell value={r.addedAmount} /></TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(r.balanceBefore)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-card-foreground">{money(r.balanceAfter)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={t('accountStatement')} onClick={() => setStatementId(r.customer?._id || null)}>
                          <ScrollText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={t('accountDetail')} onClick={() => setDetailId(r.customer?._id || null)}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title={t('delete')} onClick={() => onDelete(r._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
        </div>
      </div>

      {statementId && <LedgerStatementDialog customerId={statementId} range={range} onClose={() => setStatementId(null)} />}
      {detailId && <LedgerDetailDialog customerId={detailId} range={range} onClose={() => setDetailId(null)} />}
    </div>
  );
};

export default LedgerPage;
