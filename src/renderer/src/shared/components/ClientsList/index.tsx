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
import { useGetClients } from '@web/shared/hooks/useCustomers'
import { t } from 'i18next'
import { Search, Users } from 'lucide-react'
import Pagination from '@web/shared/components/Pagination'
import { ICustomer } from '@web/shared/types/customer'

interface ClientsListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ClientsList: React.FC<ClientsListProps> = ({ open, onOpenChange }) => {
  const { data: clients, isFetched } = useGetClients()
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10
  const allClients = (clients || []) as ICustomer[]
  const filtered = filter
    ? allClients.filter(
        (c) =>
          c.fullname.toLowerCase().includes(filter.toLowerCase()) ||
          c.phoneNumber?.toLowerCase().includes(filter.toLowerCase()) ||
          c.email?.toLowerCase().includes(filter.toLowerCase())
      )
    : allClients

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  return (
    <CustomModal
      modalProps={{ size: 'full' }}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={t('clients')}
      headerActions={<CustomerModal />}
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
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(startIndex, endIndex).map((client) => (
                  <TableRow key={client._id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {client.fullname?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <span className="group-hover:text-primary transition-colors">{client.fullname}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.phoneNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{client.address || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{client.nif || '-'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{client.rc || '-'}</TableCell>
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
    </CustomModal>
  )
}

export default ClientsList
