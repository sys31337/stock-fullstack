import React, { useState } from 'react';
import { Input } from '@web/shared/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@web/shared/components/ui/table';
import CustomModal from '@web/shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillBell, AiFillRightCircle } from 'react-icons/ai';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import Pagination from '@web/shared/components/Pagination';
import { price } from '@web/shared/functions/words';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import ProductRow from '@web/modules/Products/ProductRow';
import { IProduct } from '@web/shared/types/product';

interface ProductsProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Products: React.FC<ProductsProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const { data: getProducts, isFetched } = useGetAllProducts();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');

  const itemsPerPage = 10;
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = (+currentPage - 1) * itemsPerPage + itemsPerPage;

  const products = (getProducts || []) as IProduct[];

  const filteredBills = filter
    ? products.filter(({ barCode, productName, buyPrice, quantity, tva, sellPrice_1, sellPrice_2, sellPrice_3 }) => (
      barCode.toLowerCase().includes(filter.toLowerCase())
      || productName.toLowerCase().includes(filter.toLowerCase())
      || price(buyPrice) === price(filter)
      || price(sellPrice_1) === price(filter)
      || price(sellPrice_2) === price(filter)
      || price(sellPrice_3) === price(filter)
      || price(quantity) === price(filter)
      || tva === Number(filter)
    ))
    : products;

  const isControlled = controlledOpen !== undefined;

  return (
    <>
      {!isControlled && (
        <>
          {isTopBar ? (
            <div
              onClick={onOpen}
              className="group block p-2.5 px-3 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex flex-row items-center">
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">
                    {t('productsList')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('productsListSublabel')}</p>
                </div>
                <div
                  className="flex-1 flex justify-end items-center transition-all duration-200 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                >
                  <AiFillRightCircle className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpen}
              className="cursor-pointer w-full border rounded-3xl relative bg-blue-400 mx-5 p-5"
            >
              <div
                className="flex items-center justify-center text-sm absolute bg-gray-800 -top-2 -right-2 p-5 rounded-2xl h-8 w-8 text-white"
              >
                F1
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="min-w-20 min-h-20 flex items-center justify-center text-white rounded-2xl bg-gray-100"
                >
                  <LiaFileInvoiceDollarSolid className="text-black text-4xl" />
                </div>
                <h2 className="text-xl font-bold text-white">{t('productsList')}</h2>
              </div>
            </div>
          )}
        </>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        contentProps={{ className: "bg-white rounded-xl min-h-[95vh] max-h-[95vh] w-[97.5vw] mt-[2.5vh] overflow-hidden" }}
        bodyProps={{ className: "overflow-y-auto" }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('productsList')}
      >
        <div className="p-4">
          <div className="container mx-auto max-w-full">
            <div className="flex justify-between items-center mb-2">
              <p>{t('search')}</p>
            </div>
            <Input
              className="my-2 rounded-2xl"
              placeholder={t('searchBills')}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="rounded-xl overflow-hidden border">
              <Table>
                <TableHeader className="bg-gray-700">
                  <TableRow className="hover:bg-gray-700">
                    <TableHead className="text-white">{t('barCode')}</TableHead>
                    <TableHead className="text-white">{t('productName')}</TableHead>
                    <TableHead className="text-white">{t('qté')}</TableHead>
                    <TableHead className="text-white">{t('buyPrice')}</TableHead>
                    <TableHead className="text-white">{t('tva')}</TableHead>
                    <TableHead className="text-white">{t('sellPrice')} 1</TableHead>
                    <TableHead className="text-white">{t('sellPrice')} 2</TableHead>
                    <TableHead className="text-white">{t('sellPrice')} 3</TableHead>
                    <TableHead className="text-white text-center"><AiFillBell className="mx-auto w-5 h-5" /></TableHead>
                    <TableHead className="text-white text-end">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetched && filteredBills?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <p className="text-center"> {t('noRecordsFound')} </p>
                      </TableCell>
                    </TableRow>
                  ) :
                    isFetched && filteredBills.slice(startIndex, endIndex).map((product: IProduct, k: number) => (
                      <ProductRow key={k} product={product} />
                    ))
                  }
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalCount={filteredBills?.length}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </CustomModal>
    </>
  )
}

export default Products
