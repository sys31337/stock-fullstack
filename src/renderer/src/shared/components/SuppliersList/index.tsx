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
import CustomModal from '@web/shared/components/CustomModal'
import CustomerModal from '@web/shared/components/Customer'
import { useGetSuppliers } from '@web/shared/hooks/useCustomers'
import { t } from 'i18next'
import { AiOutlineSearch } from 'react-icons/ai'
import Pagination from '@web/shared/components/Pagination'
import { ICustomer } from '@web/shared/types/customer'

interface SuppliersListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SuppliersList: React.FC<SuppliersListProps> = ({ open, onOpenChange }) => {
  const { data: suppliers, isFetched } = useGetSuppliers()
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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

  return (
    <CustomModal
      modalProps={{ size: 'full' }}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t('suppliers')}
      headerActions={<CustomerModal />}
    >
      <div className="h-full bg-background">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="relative w-full max-w-sm">
            <AiOutlineSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('search')}
              className="pl-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filtered.length} {t('items')}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">{t('fullname')}</TableHead>
                <TableHead className="font-semibold">{t('phoneNumber')}</TableHead>
                <TableHead className="font-semibold">{t('email')}</TableHead>
                <TableHead className="font-semibold">{t('address')}</TableHead>
                <TableHead className="font-semibold">{t('nif')}</TableHead>
                <TableHead className="font-semibold">{t('rc')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isFetched ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t('loading')}...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t('noRecordsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(startIndex, endIndex).map((supplier) => (
                  <TableRow key={supplier._id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {supplier.fullname?.[0]?.toUpperCase() || 'S'}
                        </div>
                        {supplier.fullname}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{supplier.phoneNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.address || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{supplier.nif || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{supplier.rc || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-end">
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

export default SuppliersList
