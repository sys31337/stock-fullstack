import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@web/shared/components/ui/table'
import { Input } from '@web/shared/components/ui/input'
import { useGetAllTransactions } from '@web/shared/hooks/useTransactions'
import { t } from 'i18next'
import { Search, ArrowLeftRight } from 'lucide-react'
import RefreshButton from '@web/shared/components/RefreshButton'
import Pagination from '@web/shared/components/Pagination'
import CustomModal from '@web/shared/components/CustomModal'
import TransactionModal from '@web/modules/Transactions/TransactionModal'
import { ITransaction } from '@web/shared/types/transactions'
import { ICustomer } from '@web/shared/types/customer'
import { cn } from '@web/shared/utils/cn'

interface TransactionsListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabel = (type: ITransaction['type']): string => {
  if (type === 'FUND') return t('virement')
  if (type === 'SALE') return t('vente')
  return t('achat')
}

const TransactionsList: React.FC<TransactionsListProps> = ({ open, onOpenChange }) => {
  const { data: transactions, isFetched, refetch, isFetching } = useGetAllTransactions()
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10
  const allTransactions = (transactions || []) as ITransaction[]
  const filtered = filter
    ? allTransactions.filter((tx) => {
        const customerName = (tx.customer as ICustomer)?.fullname?.toLowerCase() || ''
        return (
          customerName.includes(filter.toLowerCase()) ||
          tx.description?.toLowerCase().includes(filter.toLowerCase()) ||
          tx.type.toLowerCase().includes(filter.toLowerCase())
        )
      })
    : allTransactions

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  return (
    <CustomModal
      modalProps={{ size: 'full' }}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t('transactions')}
      headerActions={<><TransactionModal /><RefreshButton onRefresh={() => refetch()} loading={isFetching} /></>}
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('search')}
              className="pl-9 bg-muted/40 border-border/50 focus:bg-background transition-colors"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} {t('items')}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('date')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('customer')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('type')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('amount')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('newBalance')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('description')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isFetched ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm">{t('loading')}...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ArrowLeftRight className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(startIndex, endIndex).map((tx) => {
                  const customer = tx.customer as ICustomer
                  const isFund = tx.type === 'FUND'
                  return (
                    <TableRow key={tx._id} className="group">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                            {customer?.fullname?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <span>{customer?.fullname || t('counter')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          isFund
                            ? 'bg-green-500/10 text-green-600'
                            : tx.type === 'SALE'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-orange-500/10 text-orange-600'
                        )}>
                          {typeLabel(tx.type)}
                        </span>
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-mono text-xs',
                        isFund ? 'text-green-600' : 'text-red-500'
                      )}>
                        {isFund ? '+' : ''}{tx.addedAmount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {tx.newFunds}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-center mt-auto pt-2">
          <Pagination
            currentPage={currentPage}
            totalCount={filtered.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </CustomModal>
  )
}

export default TransactionsList
