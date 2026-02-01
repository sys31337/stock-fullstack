import React, { useState } from 'react';
import { MoreHorizontal } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@web/shared/components/ui/dropdown-menu"
import { Button } from "@web/shared/components/ui/button"
import { Input } from "@web/shared/components/ui/input"
import CustomModal from '@web/shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillDelete, AiFillEdit, AiFillFilePdf, AiFillRightCircle, AiOutlineSearch } from 'react-icons/ai';
import { useGetAllBillsOfType } from '@web/shared/hooks/useBill';
import dayjs from 'dayjs';
import Pagination from '@web/shared/components/Pagination';
import { price } from '@web/shared/functions/words';
import EditReceiptBill from '@web/modules/Receipt/EditReceiptBill';
import { IBill } from '@web/shared/types/bills';
import { ICategory } from '@web/shared/types/category';
import { ICustomer } from '@web/shared/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';
import { cn } from '@web/shared/utils/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@web/shared/components/ui/tooltip';


const ReceiptBillActions = ({ billId }: { billId: string }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t('openMenu')}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
             <AiFillEdit className="mr-2 h-4 w-4" />
             {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
             <a href={`/billpdf/${billId}`} className="flex items-center">
                <AiFillFilePdf className="mr-2 h-4 w-4" />
                {t('print')}
             </a>
          </DropdownMenuItem>
           <DropdownMenuItem className="text-red-600 focus:text-red-600">
             <AiFillDelete className="mr-2 h-4 w-4" />
             {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditReceiptBill
        billId={billId}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        hideTrigger={true}
      />
    </>
  )
}

interface AllReceiptBillsProps {
  isTopBar?: boolean;
}

const AllReceiptBills: React.FC<AllReceiptBillsProps> = ({ isTopBar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const { data: getAllReceiptBills, isFetched } = useGetAllBillsOfType('BUY');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');

  const itemsPerPage = 10;
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = (+currentPage - 1) * itemsPerPage + itemsPerPage;

  const bills = (getAllReceiptBills || []) as IBill[];

  const filteredBills = filter
    ? bills.filter(({ customer, category, orderTotalTTC, orderTotalHT, orderId, description }) => (
      (category as ICategory)?.name.toLowerCase().includes(filter.toLowerCase())
      || (customer as ICustomer)?.fullname.toLowerCase().includes(filter.toLowerCase())
      || price(orderTotalTTC) === price(filter)
      || price(orderTotalHT) === price(filter)
      || orderId === Number(filter)
      || description.toLowerCase().includes(filter.toLowerCase())
    ))
    : bills;

  return (
    <>
      {isTopBar ? (
        <div
          className="cursor-pointer group block p-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-900"
          onClick={onOpen}
          role="group"
        >
          <div className="flex flex-row items-center">
            <div>
              <p className="font-medium transition-all duration-300 group-hover:text-blue-500">
                {t('allReceiptBill')}
              </p>
              <p className="text-sm text-gray-500">{t('allReceiptBillLabel')}</p>
            </div>
            <div className="flex-1 flex justify-end items-center transition-all duration-300 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
              <AiFillRightCircle className="text-blue-400 w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={onOpen}
          className="cursor-pointer w-full border border-gray-200 rounded-3xl relative bg-blue-400 mx-5 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="absolute top-[-8px] right-[-8px] bg-gray-800 text-white p-2 rounded-2xl h-8 w-8 flex items-center justify-center text-sm font-bold">
            F1
          </div>
          <div className="flex items-center gap-4">
            <div className="min-w-[5rem] min-h-[5rem] flex items-center justify-center text-white rounded-2xl bg-white">
              <img src="/assets/icons/inventory.gif" width={64} alt="Inventory" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('allReceiptBill')}</h2>
          </div>
        </div>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('allReceiptBill')}
      >
        <div className="h-full bg-gray-50/50 dark:bg-gray-900/50 p-4">
          <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            <div className="flex justify-between items-center mb-4 gap-4">
               <div className="relative w-full max-w-sm">
                  <AiOutlineSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder={t('search')}
                    className="pl-9 bg-white"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
               </div>
               <div className="text-sm text-gray-500">
                  {filteredBills.length} {t('records')}
               </div>
            </div>

            <Card className="flex-1 overflow-hidden border bg-white">
              <div className="h-full overflow-auto">
                <Table>
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[100px] font-semibold text-gray-700">{t('id')}</TableHead>
                      <TableHead className="font-semibold text-gray-700">{t('customer')}</TableHead>
                      <TableHead className="font-semibold text-gray-700">{t('date')}</TableHead>
                      <TableHead className="font-semibold text-gray-700">{t('items')}</TableHead>
                      <TableHead className="font-semibold text-gray-700">{t('category')}</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">{t('total')}</TableHead>
                      <TableHead className="w-[150px] text-center font-semibold text-gray-700">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isFetched ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {t('loading')}...
                        </TableCell>
                      </TableRow>
                    ) : filteredBills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                          {t('noRecordsFound')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBills.slice(startIndex, endIndex).map(({ _id, orderId, customer, billDate, products, category, orderTotalTTC }, k) => (
                        <TableRow key={k} className="hover:bg-gray-50/80 transition-colors data-[state=selected]:bg-gray-100">
                          <TableCell className="font-medium">#{orderId}</TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                   {(customer as ICustomer)?.fullname?.[0]?.toUpperCase() || 'C'}
                                </div>
                                <span className="font-medium text-gray-700">{(customer as ICustomer)?.fullname || t('counter')}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-gray-500">{dayjs(billDate).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {products.length} {products.length === 1 ? t('item') : t('items')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                               {(category as ICategory)?.name || t('undefined')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900">{price(orderTotalTTC)} <span className="text-xs font-normal text-gray-500">DZD</span></TableCell>
                          <TableCell className="text-center">
                             <ReceiptBillActions billId={_id} />
                          </TableCell>
                        </TableRow>
                      ))
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

export default AllReceiptBills;
