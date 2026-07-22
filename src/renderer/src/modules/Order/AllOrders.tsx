import React, { useState } from 'react';
import { MoreHorizontal, XCircle, CheckCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/shared/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@web/shared/components/ui/dropdown-menu"
import { Button } from "@web/shared/components/ui/button"
import { Input } from "@web/shared/components/ui/input"
import CustomModal from '@web/shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillFilePdf, AiFillRightCircle, AiOutlineSearch } from 'react-icons/ai';
import { useCancelOrder, useCompleteOrder, useGetAllBillsOfType } from '@web/shared/hooks/useBill';
import dayjs from 'dayjs';
import Pagination from '@web/shared/components/Pagination';
import { price } from '@web/shared/functions/words';
import { IBill } from '@web/shared/types/bills';
import { ICategory } from '@web/shared/types/category';
import { ICustomer } from '@web/shared/types/customer';
import { Card } from '@web/shared/components/ui/card';
import { cn } from '@web/shared/utils/cn';
import showToast from '@web/shared/functions/showToast';
import { useToast } from '@web/shared/components/ui/use-toast';
import { AxiosError } from 'axios';

const statusConfig: Record<string, { color: string; bg: string; Icon: React.FC<any> }> = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', Icon: Clock },
  cancelled: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', Icon: XCircle },
  completed: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', Icon: CheckCircle },
};

interface AllOrdersProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AllOrders: React.FC<AllOrdersProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const { data: getAllOrders, isFetched } = useGetAllBillsOfType('ORDER');
  const { mutateAsync: cancelOrder } = useCancelOrder();
  const { mutateAsync: completeOrder } = useCompleteOrder();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');

  const itemsPerPage = 10;
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = (+currentPage - 1) * itemsPerPage + itemsPerPage;

  const bills = (getAllOrders || []) as IBill[];

  const filteredBills = filter
    ? bills.filter(({ customer, category, orderTotalTTC, orderTotalHT, orderId, description, status }) => (
      (category as ICategory)?.name?.toLowerCase().includes(filter.toLowerCase())
      || (customer as ICustomer)?.fullname?.toLowerCase().includes(filter.toLowerCase())
      || price(orderTotalTTC) === price(filter)
      || price(orderTotalHT) === price(filter)
      || orderId === Number(filter)
      || description?.toLowerCase().includes(filter.toLowerCase())
      || status?.toLowerCase().includes(filter.toLowerCase())
    ))
    : bills;

  const isControlled = controlledOpen !== undefined;

  const handleCancel = async (id: string) => {
    try {
      await cancelOrder(id);
      showToast(toast, { title: t('actionPerformed'), description: t('orderCancelled'), status: 'success' });
    } catch (err) {
      const error = err as AxiosError;
      showToast(toast, { title: 'Error', description: `${error.response?.statusText}`, status: 'error' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeOrder(id);
      showToast(toast, { title: t('actionPerformed'), description: t('orderCompleted'), status: 'success' });
    } catch (err) {
      const error = err as AxiosError;
      showToast(toast, { title: 'Error', description: `${error.response?.statusText}`, status: 'error' });
    }
  };

  return (
    <>
      {!isControlled && (
        <>
          {isTopBar ? (
            <div
              className="cursor-pointer group block p-2 px-3 rounded-md hover:bg-accent transition-colors"
              onClick={onOpen}
              role="group"
            >
              <div className="flex flex-row items-center">
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">
                    {t('allOrders')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('allOrdersLabel')}</p>
                </div>
                <div className="flex-1 flex justify-end items-center transition-all duration-200 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                  <AiFillRightCircle className="text-primary w-4 h-4" />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpen}
              className={cn(
                "group relative block w-full rounded-xl border border-border bg-card p-6",
                "shadow-sm transition-all duration-200 cursor-pointer",
                "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              )}
            >
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground border border-border">
                  F1
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <img src="/assets/icons/boxes.gif" width={40} alt="Orders" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {t('allOrders')}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('allOrders')}
      >
        <div className="h-full bg-background p-4">
          <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
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
                  {filteredBills.length} {t('records')}
               </div>
            </div>

            <Card className="flex-1 overflow-hidden border bg-card">
              <div className="h-full overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[100px] font-semibold">{t('id')}</TableHead>
                      <TableHead className="font-semibold">{t('customer')}</TableHead>
                      <TableHead className="font-semibold">{t('date')}</TableHead>
                      <TableHead className="font-semibold">{t('reservedUntil')}</TableHead>
                      <TableHead className="font-semibold">{t('items')}</TableHead>
                      <TableHead className="font-semibold">{t('category')}</TableHead>
                      <TableHead className="font-semibold">{t('status')}</TableHead>
                      <TableHead className="text-right font-semibold">{t('total')}</TableHead>
                      <TableHead className="w-[150px] text-center font-semibold">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isFetched ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          {t('loading')}...
                        </TableCell>
                      </TableRow>
                    ) : filteredBills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          {t('noRecordsFound')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBills.slice(startIndex, endIndex).map(({ _id, orderId, customer, billDate, reservedUntil, products, category, orderTotalTTC, status }, k) => {
                        const statusInfo = statusConfig[status || 'pending'];
                        const StatusIcon = statusInfo.Icon;
                        const isExpired = status === 'pending' && reservedUntil && new Date(reservedUntil) < new Date();
                        return (
                          <TableRow key={k} className="hover:bg-muted/50 transition-colors data-[state=selected]:bg-muted">
                            <TableCell className="font-medium font-mono text-xs">#{orderId}</TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    {(customer as ICustomer)?.fullname?.[0]?.toUpperCase() || 'C'}
                                  </div>
                                  <span className="font-medium">{(customer as ICustomer)?.fullname || t('counter')}</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{dayjs(billDate).format('DD/MM/YYYY')}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <span className={cn("inline-flex items-center gap-1 text-xs", isExpired && 'text-red-500 font-semibold')}>
                                {reservedUntil ? dayjs(reservedUntil).format('DD/MM/YYYY') : '-'}
                                {isExpired && <Clock className="h-3 w-3" />}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                {products.length} {products.length === 1 ? t('item') : t('items')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                 {(category as ICategory)?.name || t('undefined')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", statusInfo.bg, statusInfo.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {status ? t(status) : t('pending')}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">{price(orderTotalTTC)} <span className="text-xs font-normal text-muted-foreground">DZD</span></TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">{t('openMenu')}</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                     <a href={`/billpdf/${_id}`} className="flex items-center">
                                        <AiFillFilePdf className="mr-2 h-4 w-4" />
                                        {t('print')}
                                     </a>
                                  </DropdownMenuItem>
                                  {status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleComplete(_id)}>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                        {t('complete')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleCancel(_id)}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {t('cancelOrder')}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="mt-4 flex justify-end">
              <Pagination
                className="pagination-bar"
                currentPage={currentPage}
                totalCount={filteredBills.length}
                pageSize={itemsPerPage}
                onPageChange={(page: number) => setCurrentPage(page)}
              />
            </div>
          </Card>
        </div>
      </CustomModal>
    </>
  );
};

export default AllOrders;
