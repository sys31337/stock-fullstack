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
import { AiFillRightCircle } from 'react-icons/ai';
import { Search, Package } from 'lucide-react';
import RefreshButton from '@web/shared/components/RefreshButton';
import Pagination from '@web/shared/components/Pagination';
import ExportMenu from '@web/shared/components/ExportMenu';
import { price } from '@web/shared/functions/words';
import { printHtml } from '@web/shared/functions/printHtml';
import { exportXlsx } from '@web/shared/functions/exportXlsx';
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

  const { data: getProducts, isFetched, refetch, isFetching } = useGetAllProducts();
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

  const escapeHtml = (value: string | number | null | undefined): string =>
    String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[ch] as string);

  const formatStock = (p: IProduct): string => {
    const qty = Number(p.quantity) || 0;
    const stk = Number(p.stack) || 0;
    const res = Number(p.reserved) || 0;
    return res > 0 ? `${qty} (${res}) × ${stk}` : `${qty} × ${stk}`;
  };

  // Export the current (filtered) listing.
  const exportProductsToPdf = () => {
    if (!filteredBills.length) return;
    const rows = filteredBills
      .map(
        (p) => `
        <tr>
          <td class="mono">${escapeHtml(p.barCode)}</td>
          <td>${escapeHtml(p.productName)}</td>
          <td class="right mono">${formatStock(p)}</td>
          <td class="right mono">${price(p.buyPrice)} DA</td>
          <td class="right mono">${p.tva}%</td>
          <td class="right mono">${price(p.sellPrice_1)} DA</td>
          <td class="right mono">${price(p.sellPrice_2)} DA</td>
          <td class="right mono">${price(p.sellPrice_3)} DA</td>
        </tr>`,
      )
      .join('');
    printHtml(`
      <h1>${escapeHtml(t('productsList'))}</h1>
      <p class="muted">${filteredBills.length} ${escapeHtml(t('items'))} — ${new Date().toLocaleDateString()}</p>
      <hr class="divider">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t('barCode'))}</th>
            <th>${escapeHtml(t('productName'))}</th>
            <th class="right">${escapeHtml(t('qté'))}</th>
            <th class="right">${escapeHtml(t('buyPrice'))}</th>
            <th class="right">${escapeHtml(t('tva'))}</th>
            <th class="right">${escapeHtml(t('sellPrice_1'))}</th>
            <th class="right">${escapeHtml(t('sellPrice_2'))}</th>
            <th class="right">${escapeHtml(t('sellPrice_3'))}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  const exportProductsToExcel = () => {
    if (!filteredBills.length) return;
    exportXlsx(
      'products',
      t('productsList'),
      [t('barCode'), t('productName'), t('qté'), t('buyPrice'), t('tva'), t('sellPrice_1'), t('sellPrice_2'), t('sellPrice_3')],
      filteredBills.map((p) => [
        p.barCode,
        p.productName,
        formatStock(p),
        Number(p.buyPrice) || 0,
        Number(p.tva) || 0,
        Number(p.sellPrice_1) || 0,
        Number(p.sellPrice_2) || 0,
        Number(p.sellPrice_3) || 0,
      ]),
    );
  };

  return (
    <>
      {!isControlled && (
        <>
          {isTopBar ? (
            <div onClick={onOpen} className="group block p-2.5 px-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex flex-row items-center">
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">
                    {t('productsList')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('productsListSublabel')}</p>
                </div>
                <div className="flex-1 flex justify-end items-center transition-all duration-200 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                  <AiFillRightCircle className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div onClick={onOpen} className="cursor-pointer w-full border rounded-3xl relative bg-blue-400 mx-5 p-5">
              {/* Card trigger for home page */}
            </div>
          )}
        </>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('productsList')}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-muted/40 border-border/50 focus:bg-background transition-colors"
                placeholder={t('searchBills')}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredBills.length} {t('items')}
            </div>
            <ExportMenu
              onPdf={exportProductsToPdf}
              onExcel={exportProductsToExcel}
              disabled={!isFetched || !filteredBills.length}
            />
            <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('barCode')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('productName')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('qté')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('buyPrice')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('tva')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sellPrice')} 1</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sellPrice')} 2</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sellPrice')} 3</TableHead>
                  <TableHead className="text-center w-12">
                    <Package className="h-4 w-4 text-muted-foreground mx-auto" />
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm">{t('loading')}...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40" />
                        <p className="text-sm">{t('noRecordsFound')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.slice(startIndex, endIndex).map((product: IProduct, k: number) => (
                    <ProductRow key={k} product={product} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center mt-auto pt-2">
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
