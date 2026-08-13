import React, { useState } from 'react';
import { t } from 'i18next';
import CustomModal from '@web/shared/components/CustomModal';
import { Button } from '@web/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@web/shared/components/ui/table';
import { cn } from '@web/shared/utils/cn';
import { money } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { useLedgerDetail, useLedgerStatement } from '@web/shared/hooks/useReports';
import { fmtDate, TypeBadge } from '@web/modules/Reports/components/common';
import { Printer, FileSpreadsheet, ChevronDown, ChevronRight } from 'lucide-react';
import { exportCsv } from '@web/shared/functions/exportCsv';

const printStatement = (data: any, _range: any) => {
  const rows = (data.rows || []).map((r: any) => `
    <tr>
      <td class="mono">${fmtDate(r.createdAt)}</td>
      <td>${r.reference}</td>
      <td class="right mono">${money(r.amount)}</td>
      <td class="right mono">${money(r.payment)}</td>
      <td class="right mono ${r.balance < 0 ? 'neg' : 'pos'}">${money(r.balance)}</td>
    </tr>`).join('');
  printHtml(`
    <h1>${t('accountStatement')}</h1>
    <p class="muted">${data.customer?.fullname || ''}</p>
    <hr class="divider">
    <div class="summary">
      <div class="summary-item"><div class="k">${t('currentBalance')}</div><div class="v">${money(data.currentBalance)} DZD</div></div>
    </div>
    <table>
      <thead><tr><th>${t('date')}</th><th>${t('reference')}</th><th class="right">${t('amount')}</th><th class="right">${t('payment')}</th><th class="right">${t('balance')}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
};

const printDetail = (data: any) => {
  const rows = (data.rows || []).map((r: any) => `
    <tr>
      <td class="mono">${fmtDate(r.createdAt)}</td>
      <td>${r.reference}</td>
      <td class="right mono">${r.sellAmount != null ? money(r.sellAmount) : '-'}</td>
      <td class="right mono">${r.purchaseAmount != null ? money(r.purchaseAmount) : '-'}</td>
      <td class="right mono">${money(r.payment)}</td>
      <td class="right mono">${money(r.fees)}</td>
      <td class="right mono ${r.balanceAfter < 0 ? 'neg' : 'pos'}">${money(r.balanceAfter)}</td>
    </tr>`).join('');
  printHtml(`
    <h1>${t('partyAccount')}</h1>
    <p class="muted">${data.customer?.fullname || ''}</p>
    <hr class="divider">
    <div class="summary">
      <div class="summary-item"><div class="k">${t('currentBalance')}</div><div class="v">${money(data.currentBalance)} DZD</div></div>
    </div>
    <table>
      <thead><tr><th>${t('date')}</th><th>${t('reference')}</th><th class="right">${t('sell')}</th><th class="right">${t('purchase')}</th><th class="right">${t('payment')}</th><th class="right">${t('fees')}</th><th class="right">${t('balance')}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`);
};

export const LedgerStatementDialog: React.FC<{ customerId: string; range?: any; onClose: () => void }> = ({
  customerId,
  range,
  onClose,
}) => {
  const { data, isLoading } = useLedgerStatement(customerId, range, true);

  return (
    <CustomModal modalProps={{}} contentProps={{ className: 'max-w-2xl' }} isOpen onClose={onClose} title={t('accountStatement')}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">{data?.customer?.fullname || '...'}</h3>
            <p className="text-sm text-muted-foreground">{data?.customer?.type === 'Client' ? t('client') : data?.customer?.type === 'Supplier' ? t('supplier') : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={() => data && printStatement(data, range)}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              {t('print')}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('currentBalance')}</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', (data?.currentBalance || 0) < 0 ? 'text-red-600' : 'text-emerald-600')}>
            {money(data?.currentBalance || 0)} DZD
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase">{t('reference')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('amount')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('payment')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('balance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">{t('loading')}...</TableCell></TableRow>
              )}
              {!isLoading && (data?.rows || []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>
              )}
              {(data?.rows || []).map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{r.reference}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.amount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.payment)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums font-semibold', r.balance < 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {money(r.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </CustomModal>
  );
};

export const LedgerDetailDialog: React.FC<{ customerId: string; range?: any; onClose: () => void }> = ({
  customerId,
  range,
  onClose,
}) => {
  const { data, isLoading } = useLedgerDetail(customerId, range, true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCsv = () => {
    if (!data) return;
    exportCsv(
      `account-${data.customer.fullname}`,
      ['date', 'reference', 'sell', 'purchase', 'payment', 'fees', 'balance'],
      (data.rows || []).map((r) => [
        fmtDate(r.createdAt),
        r.reference,
        r.sellAmount != null ? r.sellAmount : '',
        r.purchaseAmount != null ? r.purchaseAmount : '',
        r.payment,
        r.fees,
        r.balanceAfter,
      ]),
    );
  };

  return (
    <CustomModal
      modalProps={{ size: 'full' }}
      isOpen
      onClose={onClose}
      title={t('partyAccount')}
      headerActions={
        <>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={() => data && printDetail(data)}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            {t('print')}
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!data} onClick={handleCsv}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>
        </>
      }
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{data?.customer?.fullname || '...'}</h3>
            <p className="text-sm text-muted-foreground">{data?.customer?.type === 'Client' ? t('client') : t('supplier')}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('currentBalance')}</p>
            <p className={cn('text-lg font-bold tabular-nums', (data?.currentBalance || 0) < 0 ? 'text-red-600' : 'text-emerald-600')}>
              {money(data?.currentBalance || 0)} DZD
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-8" />
                <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase">{t('reference')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase">{t('type')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('sell')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('purchase')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('payment')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('fees')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase">{t('balance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">{t('loading')}...</TableCell></TableRow>
              )}
              {!isLoading && (data?.rows || []).length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>
              )}
              {(data?.rows || []).map((r) => {
                const hasItems = (r.products || []).length > 0;
                const isOpen = expanded === r._id;
                return (
                  <React.Fragment key={r._id}>
                    <TableRow className="hover:bg-muted/20">
                      <TableCell>
                        {hasItems && (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : r._id)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                          >
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                      <TableCell className="text-sm font-medium">{r.reference}</TableCell>
                      <TableCell><TypeBadge type={r.type} /></TableCell>
                      <TableCell className="text-right tabular-nums">{r.sellAmount != null ? money(r.sellAmount) : '-'}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.purchaseAmount != null ? money(r.purchaseAmount) : '-'}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(r.payment)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(r.fees)}</TableCell>
                      <TableCell className={cn('text-right tabular-nums font-semibold', r.balanceAfter < 0 ? 'text-red-600' : 'text-emerald-600')}>
                        {money(r.balanceAfter)}
                      </TableCell>
                    </TableRow>
                    {isOpen && hasItems && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/20 p-0">
                          <div className="px-10 py-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-[11px] uppercase">{t('product')}</TableHead>
                                  <TableHead className="text-right text-[11px] uppercase">{t('quantity')}</TableHead>
                                  <TableHead className="text-right text-[11px] uppercase">{t('unitPrice')}</TableHead>
                                  <TableHead className="text-right text-[11px] uppercase">{t('amount')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {r.products.map((p: any, idx: number) => {
                                  const line = Number(p.quantity) * Number(p.buyPrice);
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell className="text-sm">{p.productName || '-'}</TableCell>
                                      <TableCell className="text-right tabular-nums">{p.quantity}</TableCell>
                                      <TableCell className="text-right tabular-nums">{money(p.buyPrice)}</TableCell>
                                      <TableCell className="text-right tabular-nums">{money(line)}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </CustomModal>
  );
};
