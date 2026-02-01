import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/shared/components/ui/table"
import { Button } from "@web/shared/components/ui/button"
import { Input } from "@web/shared/components/ui/input"
import CustomModal from '@web/shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillDelete, AiFillFilePdf, AiFillRightCircle } from 'react-icons/ai';
import { useGetAllBillsOfType } from '@web/shared/hooks/useBill';
import dayjs from 'dayjs';
import Pagination from '@web/shared/components/Pagination';
import { price } from '@web/shared/functions/words';
import EditReceiptBill from '@web/modules/Receipt/EditReceiptBill';
import { IBill } from '@web/shared/types/bills';
import { ICategory } from '@web/shared/types/category';
import { ICustomer } from '@web/shared/types/customer';

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
        contentProps={{ minHeight: '95vh', maxHeight: '95vh', width: '97.5vw', marginTop: '2.5vh' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('allReceiptBill')}
      >
        <div className="p-4 w-full">
          <div className="w-full">
            <p className="mb-2 text-sm font-medium">{t('search')}</p>
            <Input
              className="my-2 rounded-2xl"
              placeholder={t('searchBills')}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="rounded-lg border overflow-hidden mt-4">
              <Table>
                <TableHeader className="bg-gray-700">
                  <TableRow className="hover:bg-gray-700">
                    <TableHead className="text-white w-[5ch]">#</TableHead>
                    <TableHead className="text-white">{t('customer')}</TableHead>
                    <TableHead className="text-white">{t('date')}</TableHead>
                    <TableHead className="text-white">{t('productsCounter')}</TableHead>
                    <TableHead className="text-white">{t('category')}</TableHead>
                    <TableHead className="text-white">{t('total')}</TableHead>
                    <TableHead className="text-white text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetched && filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                         {t('noRecordsFound')}
                      </TableCell>
                    </TableRow>
                  ) :
                    isFetched && filteredBills.slice(startIndex, endIndex).map(({ _id, billDate, orderId, customer, category, products, orderTotalTTC }, k) => (
                      <TableRow key={k} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>{orderId}</TableCell>
                        <TableCell>{(customer as ICustomer)?.fullname || t('counter')}</TableCell>
                        <TableCell>{dayjs(billDate).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                        <TableCell>{products.length}</TableCell>
                        <TableCell>{(category as ICategory)?.name || t('undefined')}</TableCell>
                        <TableCell>{price(orderTotalTTC)} DA</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 border-none"
                                asChild
                            >
                                <a href={`/billpdf/${_id}`}>
                                    <AiFillFilePdf />
                                </a>
                            </Button>
                            <EditReceiptBill billId={_id} />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-2xl bg-red-500 text-white hover:bg-red-600 border-none"
                            >
                              <AiFillDelete />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
            <Pagination
              className="pagination-bar"
              currentPage={currentPage}
              totalCount={filteredBills.length}
              pageSize={itemsPerPage}
              onPageChange={(page: number) => setCurrentPage(page)}
            />
          </div>
        </div>
      </CustomModal>
    </>
  );
};

export default AllReceiptBills;
