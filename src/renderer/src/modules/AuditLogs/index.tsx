import React, { useState } from 'react';
import { Input } from '@web/shared/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@web/shared/components/ui/table';
import CustomModal from '@web/shared/components/CustomModal';
import { Button } from '@web/shared/components/ui/button';
import { t } from 'i18next';
import { Search, History, RefreshCw, Eye } from 'lucide-react';
import Pagination from '@web/shared/components/Pagination';
import { useGetAuditLogs } from '@web/shared/hooks/useAuditLogs';
import { format } from 'date-fns';

interface AuditLogsProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  edit: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-emerald-100 text-emerald-700',
  logout: 'bg-gray-100 text-gray-700',
  login_failed: 'bg-orange-100 text-orange-700',
  login_blocked: 'bg-red-100 text-red-700',
  approve: 'bg-purple-100 text-purple-700',
  cancel: 'bg-yellow-100 text-yellow-700',
  force_logout: 'bg-rose-100 text-rose-700',
};

const AuditLogs: React.FC<AuditLogsProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isFetched } = useGetAuditLogs({ page, limit: '25' });
  const logs = (data?.logs || []) as any[];

  const filtered = filter
    ? logs.filter((l: any) =>
        (l.action || '').toLowerCase().includes(filter.toLowerCase()) ||
        (l.resource || '').toLowerCase().includes(filter.toLowerCase()) ||
        (l.details || '').toLowerCase().includes(filter.toLowerCase()) ||
        (l.username || '').toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  return (
    <>
      {!controlledOpen && isTopBar && (
        <div onClick={onOpen} className="group block p-2.5 px-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <div className="flex flex-row items-center">
            <History className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium transition-colors group-hover:text-primary">{t('auditLogs')}</p>
              <p className="text-xs text-muted-foreground">{t('viewActivityLogs')}</p>
            </div>
          </div>
        </div>
      )}
      <CustomModal modalProps={{ size: 'full' }} isOpen={isOpen} onClose={onClose} title={t('auditLogs')}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 bg-muted/40 border-border/50" placeholder={t('search')} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setPage(1)} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('refresh')}
            </Button>
          </div>
          <div className="rounded-xl border border-border/60 overflow-hidden flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase">{t('date')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('user')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('action')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('resource')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('details')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm">{t('loading')}...</p>
                    </div>
                  </TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <History className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell></TableRow>
                ) : (
                  filtered.map((log: any) => (
                    <TableRow key={log._id} className="hover:bg-muted/20">
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{log.username || log.userId?.fullname || log.userId?.username || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.details}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">{t('total')}: {data?.total || 0}</span>
            <Pagination currentPage={page} totalCount={data?.total || 0} pageSize={25} onPageChange={setPage} />
          </div>
        </div>
      </CustomModal>

      <CustomModal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title={t('logDetails')}>
        {selectedLog && (
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">{t('action')}:</span> <span className="font-medium">{selectedLog.action}</span></div>
              <div><span className="text-muted-foreground">{t('resource')}:</span> <span className="font-medium">{selectedLog.resource}</span></div>
              <div><span className="text-muted-foreground">{t('user')}:</span> <span className="font-medium">{selectedLog.username || selectedLog.userId?.fullname || selectedLog.userId?.username || '-'}</span></div>
              <div><span className="text-muted-foreground">{t('ip')}:</span> <span className="font-medium">{selectedLog.ip || '-'}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">{t('date')}:</span> <span className="font-medium">{format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss')}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">{t('details')}:</span> <p className="mt-1 p-2 bg-muted/30 rounded text-sm">{selectedLog.details}</p></div>
              {selectedLog.metadata && (
                <div className="col-span-2"><span className="text-muted-foreground">{t('metadata')}:</span> <pre className="mt-1 p-2 bg-muted/30 rounded text-xs overflow-auto">{JSON.stringify(selectedLog.metadata, null, 2)}</pre></div>
              )}
            </div>
          </div>
        )}
      </CustomModal>
    </>
  );
};

export default AuditLogs;
