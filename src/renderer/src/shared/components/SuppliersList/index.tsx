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
import { Button } from '@web/shared/components/ui/button'
import CustomModal from '@web/shared/components/CustomModal'
import CustomerModal from '@web/shared/components/Customer'
import { useGetSuppliers, useDeleteCustomer } from '@web/shared/hooks/useCustomers'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { AiFillDelete, AiFillEdit } from 'react-icons/ai'
import { Search, Truck } from 'lucide-react'
import Pagination from '@web/shared/components/Pagination'
import { ICustomer } from '@web/shared/types/customer'
import { AxiosError } from 'axios'
import showToast from '@web/shared/functions/showToast'

interface SuppliersListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SuppliersList: React.FC<SuppliersListProps> = ({ open, onOpenChange }) => {
  const { data: suppliers, isFetched } = useGetSuppliers()
  const { mutateAsync: deleteCustomer } = useDeleteCustomer()
  const { toast } = useToast()
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const itemsPerPage = 10
  const allSuppliers = (suppliers || []) as ICustomer[]
  const filtered = filter
    ? allSuppliers.filter(
        (s) =>
          s.fullname.toLowerCase().includes(filter.toLowerCase()) ||
          s.phoneNumber?.toLowerCase().includes(filter.toLowerCase()) ||
          s.email?.toLowerCase().includes(filter.toLowerCase())
      )
    : allSuppliers

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

  return (
    <CustomModal
      modalProps={{ size: 'full' }}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t('suppliers')}
      headerActions={<CustomerModal type="Supplier" />}
    >
      <div className="flex flex-col h-full">
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('fullname')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('phoneNumber')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('email')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('address')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nif')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('rc')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isFetched ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm">{t('loading')}...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Truck className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(startIndex, endIndex).map((supplier) => (
                  <TableRow key={supplier._id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {supplier.fullname?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <span className="group-hover:text-primary transition-colors">{supplier.fullname}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{supplier.phoneNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.address || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{supplier.nif || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{supplier.rc || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                        <CustomerModal
                          customer={supplier}
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
                          onClick={() => setDeleteId(supplier._id)}
                        >
                          <AiFillDelete className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

export default SuppliersList
