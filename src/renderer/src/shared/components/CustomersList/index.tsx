import React, { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@web/shared/components/ui/table'
import { Input } from '@web/shared/components/ui/input'
import { Button } from '@web/shared/components/ui/button'
import CustomModal from '@web/shared/components/CustomModal'
import CustomerModal from '@web/shared/components/Customer'
import { useGetAllCustomers, useDeleteCustomer } from '@web/shared/hooks/useCustomers'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { AiFillDelete, AiFillEdit } from 'react-icons/ai'
import { FaWhatsapp } from 'react-icons/fa'
import { Search, Users, Send } from 'lucide-react'
import RefreshButton from '@web/shared/components/RefreshButton'
import Pagination from '@web/shared/components/Pagination'
import TransactionModal from '@web/modules/Transactions/TransactionModal'
import { ICustomer } from '@web/shared/types/customer'
import { AxiosError } from 'axios'
import showToast from '@web/shared/functions/showToast'
import { defaultId } from '@web/config'
import { cn } from '@web/shared/utils/cn'
import { getWilayaLabel } from '@web/config/wilayas'
import i18next from 'i18next'

export type CustomerType = 'All' | 'Client' | 'Supplier'

interface CustomersListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialType?: CustomerType
}

const TYPE_TABS: CustomerType[] = ['All', 'Client', 'Supplier']

const CustomersList: React.FC<CustomersListProps> = ({ open, onOpenChange, initialType = 'All' }) => {
  const { data: customers, isFetched, refetch, isFetching } = useGetAllCustomers()
  const { mutateAsync: deleteCustomer } = useDeleteCustomer()
  const { toast } = useToast()
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<CustomerType>(initialType)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (open) setTypeFilter(initialType)
  }, [open, initialType])

  const itemsPerPage = 10
  const allCustomers = (customers || []) as ICustomer[]
  const filtered = allCustomers.filter((c) => {
    const matchesType = typeFilter === 'All' || c.type === typeFilter
    const q = filter.toLowerCase()
    const matchesSearch =
      !filter ||
      c.fullname.toLowerCase().includes(q) ||
      c.phoneNumber?.toLowerCase().includes(q) ||
      c.wilaya?.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCustomer(deleteId)
      showToast(toast, { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success' })
      setDeleteId(null)
    } catch (err) {
      const error = err as AxiosError
      showToast(toast, { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText}`, status: 'error' })
    }
  }

  const isClient = (c: ICustomer) => c.type === 'Client'

  return (
    <CustomModal
      modalProps={{ size: 'full' }}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t('customersAndSuppliers')}
      headerActions={<><CustomerModal /><RefreshButton onRefresh={() => refetch()} loading={isFetching} /></>}
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/50">
            {TYPE_TABS.map((tab) => {
              const active = typeFilter === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tab)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {tab === 'All' ? t('all') : t(tab === 'Client' ? 'clients' : 'suppliers')}
                </button>
              )
            })}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('search')}
              className="pl-9 bg-muted/40 border-border/50 focus:bg-background transition-colors"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setCurrentPage(1)
              }}
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('type')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('fullname')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('phoneNumber')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('wilaya')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('address')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nif')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('rc')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('credit')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isFetched ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm">{t('loading')}...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(startIndex, endIndex).map((customer) => (
                  <TableRow key={customer._id} className="group">
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                          isClient(customer)
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-orange-500/10 text-orange-600'
                        )}
                      >
                        {t(isClient(customer) ? 'client' : 'supplier')}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                          isClient(customer)
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-orange-500/10 text-orange-600'
                        )}>
                          {customer.fullname?.[0]?.toUpperCase() || (isClient(customer) ? 'C' : 'S')}
                        </div>
                        <span className="group-hover:text-primary transition-colors">{customer.fullname}</span>
                        {customer._id === defaultId && <span className="text-xs text-muted-foreground italic">({t('default')})</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {customer.hasWhatsapp && <FaWhatsapp className="h-3.5 w-3.5 text-green-500" />}
                        {customer.phoneNumber || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{getWilayaLabel(customer.wilaya, i18next.language)}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.address || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{customer.nif || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{customer.rc || '-'}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-green-600">{Number(customer.credit || 0)}</TableCell>
                    <TableCell>
                      {customer._id !== defaultId && (
                        <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                          <TransactionModal
                            customer={customer}
                            trigger={
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-500/10" title={t('newTransfer')}>
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <CustomerModal
                            customer={customer}
                            trigger={
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                                <AiFillEdit className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(customer._id)}
                          >
                            <AiFillDelete className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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

      <CustomModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('confirmDelete')}
      >
        <p className="text-sm text-muted-foreground mb-4">{t('confirmDeleteMessage')}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>{t('cancel')}</Button>
          <Button variant="destructive" onClick={handleDelete}>{t('delete')}</Button>
        </div>
      </CustomModal>
    </CustomModal>
  )
}

export default CustomersList
