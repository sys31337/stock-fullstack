import React, { useState } from 'react';
import { t } from 'i18next';
import { useDeliveryReturns, useDeleteDeliveryReturn, getDeliveryPersonName, DeliveryReturnFilters } from '@web/shared/hooks/useDeliveryReturns';
import { useSalespeople } from '@web/shared/hooks/useReports';
import { useGetMyPermissions } from '@web/shared/hooks/useUsersEnhanced';
import { Combobox } from '@web/shared/components/ui/combobox';
import { Button } from '@web/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import Pagination from '@web/shared/components/Pagination';
import { ReportHeader, DateRangeBar, toDateParam, fmtDate, EmptyState } from '@web/modules/Reports/components/common';
import { money } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { exportCsv } from '@web/shared/functions/exportCsv';
import { Printer, FileSpreadsheet, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@web/shared/components/ui/use-toast';
import showToast from '@web/shared/functions/showToast';
import ReturnModal from '@web/modules/Reports/components/ReturnModal';
import { cn } from '@web/shared/utils/cn';

const PAGE_SIZE = 25;

const STATUS_TONES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  confirmed: 'bg-emerald-500/10 text-emerald-600',
};

const DeliveryReturnsPage: React.FC = () => {
  const { data: salespeople } = useSalespeople();
  const { data: permissions } = useGetMyPermissions();
  const [person, setPerson] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [committed, setCommitted] = useState<DeliveryReturnFilters>({ page: 1, limit: PAGE_SIZE });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const deleteMutation = useDeleteDeliveryReturn();
  const { toast } = useToast();

  const canWrite = permissions?.isMainAccount === true || (permissions?.effectivePermissions || []).includes('*');

  const { data, isFetching } = useDeliveryReturns({ ...committed, deliveryPerson: person, page });

  const personOptions = (salespeople || []).map((s) => ({ value: s._id, label: s.fullname }));

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

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDeleteDeliveryReturn'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(toast, { title: t('deleted'), description: t('deliveryReturnDeleted'), status: 'success' });
    } catch (err: any) {
      showToast(toast, {
        title: t('error'),
        description: err?.response?.data?.message || t('errorOccurred'),
        status: 'error',
        duration: 4000,
      });
    }
  };

  const printReport = () => {
    if (!data) return;
    const rows = data.items.map((r) => `
      <tr>
        <td class="mono">${fmtDate(r.deliveryDate)}</td>
        <td>${getDeliveryPersonName(r)}</td>
        <td class="right mono">${money(r.expectedAmount)}</td>
        <td class="right mono">${money(r.enteredAmount)}</td>
        <td class="right mono ${r.returnedAmount > 0 ? 'neg' : ''}">${money(r.returnedAmount)}</td>
        <td><span class="badge badge-${r.status}">${t(r.status)}</span></td>
      </tr>`).join('');
    printHtml(`
      <h1>${t('deliveryReturns')}</h1>
      <p class="muted">${committed.startDate || ''} → ${committed.endDate || ''}</p>
      <hr class="divider">
      <table>
        <thead><tr><th>${t('date')}</th><th>${t('deliveryPerson')}</th><th class="right">${t('expectedAmount')}</th><th class="right">${t('enteredAmount')}</th><th class="right">${t('returnedAmount')}</th><th>${t('status')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const exportReport = () => {
    if (!data) return;
    exportCsv(
      'delivery-returns',
      ['date', 'deliveryPerson', 'warehouse', 'expectedAmount', 'enteredAmount', 'returnedAmount', 'status', 'notes'],
      data.items.map((r) => [
        fmtDate(r.deliveryDate),
        getDeliveryPersonName(r),
        typeof r.warehouse === 'object' ? r.warehouse?.name || '' : '',
        r.expectedAmount,
        r.enteredAmount,
        r.returnedAmount,
        r.status,
        r.notes || '',
      ]),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-8 pb-8 pt-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <ReportHeader
            title={t('deliveryReturns')}
            description={t('deliveryReturnsDesc')}
            backTo="/reports"
            actions={
              <>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={printReport}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  {t('print')}
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={exportReport}>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
                {canWrite && (
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-3.5 w-3.5" />
                    {t('newDeliveryReturn')}
                  </Button>
                )}
              </>
            }
          />

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            <div className="w-56">
              <Combobox
                options={personOptions}
                value={person}
                onChange={(v) => { setPerson(v); setPage(1); }}
                placeholder={t('allDeliveryPersons')}
                loading={!salespeople}
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
                  <TableHead className="text-xs font-semibold uppercase">{t('deliveryPerson')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('warehouse')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('expectedAmount')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('enteredAmount')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('returnedAmount')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('status')}</TableHead>
                  <TableHead className="w-20 text-right text-xs font-semibold uppercase">{t('actions')}</TableHead>
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
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.deliveryDate)}</TableCell>
                    <TableCell className="text-sm font-medium">{getDeliveryPersonName(r)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {typeof r.warehouse === 'object' ? r.warehouse?.name || '-' : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.expectedAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{money(r.enteredAmount)}</TableCell>
                    <TableCell className={cn('text-right tabular-nums font-semibold', r.returnedAmount > 0 && 'text-red-600')}>
                      {money(r.returnedAmount)}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', STATUS_TONES[r.status] || 'bg-muted text-muted-foreground')}>
                        {t(r.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canWrite && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title={t('edit')} onClick={() => { setEditing(r); setModalOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title={t('delete')} onClick={() => handleDelete(r._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
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

      <ReturnModal isOpen={modalOpen} onClose={() => setModalOpen(false)} record={editing} />
    </div>
  );
};

export default DeliveryReturnsPage;
