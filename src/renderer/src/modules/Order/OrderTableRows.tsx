import React, { useMemo } from 'react';
import { Input } from "@web/shared/components/ui/input"
import { Button } from "@web/shared/components/ui/button"
import { BiTrash } from 'react-icons/bi';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import CustomAutoComplete from '@web/shared/components/CustomAutoComplete';
import { IProduct } from '@web/shared/types/product';
import { cn } from '@web/shared/utils/cn';
import { t } from 'i18next';
import { useToast } from '@web/shared/components/ui/use-toast';
import showToast from '@web/shared/functions/showToast';

interface OrderTableRowsProps {
  index: number;
  data: IProduct;
  products: IProduct[];
  deleteTableRows: (id: string) => void;
  handleChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProductSelect: (index: number, product: IProduct) => void;
  priceTier: number;
}

const OrderTableRows: React.FC<OrderTableRowsProps> = ({ index, data, products, deleteTableRows, handleChange, handleProductSelect, priceTier }) => {
  const { data: allProducts, isFetched } = useGetAllProducts();
  const { toast } = useToast();

  const sellPriceField = priceTier === 1 ? 'sellPrice_1' : priceTier === 2 ? 'sellPrice_2' : 'sellPrice_3';
  const currentPrice = data[sellPriceField as keyof IProduct] as number || 0;
  const totalHT = Number(data.quantity || 0) * Number(data.stack || 0) * Number(currentPrice || 0);
  const productTva = totalHT * (data.tva || 0) / 100;
  const totalTTC = totalHT + productTva;

  const isDuplicate = (product: IProduct) => {
    return products.some((p, i) => i !== index && (p.barCode && p.barCode === product.barCode || p.productName && p.productName === product.productName));
  };

  const productsList = products.map((product) => product?.productName?.toLowerCase());

  const filterProductsList = (query: string, _optionValue: string, optionLabel: string) => optionLabel.toLowerCase().includes(query.toLowerCase()) && !productsList.includes(optionLabel.toLowerCase())

  const onProductSelectOption = (item: any) => {
    const product = item as IProduct;
    if (isDuplicate(product)) {
      showToast(toast, { title: t('productExists'), description: t('productAlreadyInList'), status: 'warning' });
      return;
    }
    handleProductSelect(index, product);
  }

  const onProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(index, e);
  }

  const { id, tva, quantity, stack, buyPrice, productName, barCode } = data;

  const matchedProduct = useMemo(() => {
    if (!barCode || !allProducts) return null;
    return allProducts.find((p: IProduct) => p.barCode === barCode) || null;
  }, [barCode, allProducts]);

  const isLocked = matchedProduct !== null;
  const available = isLocked ? Number(matchedProduct.quantity) - Number(matchedProduct.reserved || 0) : 0;
  const exceedsStock = isLocked && Number(quantity) > available;

  const handleBarcodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const barcode = e.target.value.trim();
    if (!barcode || !allProducts) return;
    const match = allProducts.find((p: IProduct) => p.barCode === barcode);
    if (match) {
      if (isDuplicate(match)) {
        showToast(toast, { title: t('productExists'), description: t('productAlreadyInList'), status: 'warning' });
        return;
      }
      handleProductSelect(index, match);
    } else {
      deleteTableRows(id);
    }
  };

  const handleProductNameBlur = () => {
    if (!productName || !allProducts) return;
    const match = allProducts.find((p: IProduct) => p.productName === productName || p.barCode === barCode);
    if (!match && !barCode) {
      deleteTableRows(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;
      const inputs = Array.from(form.elements) as HTMLInputElement[];
      const currentInputIndex = inputs.indexOf(e.currentTarget);
      let nextIndex = currentInputIndex + 1;
      while (nextIndex < inputs.length) {
        const nextInput = inputs[nextIndex];
        if (nextInput && !nextInput.disabled && !nextInput.readOnly && nextInput.type !== 'hidden') {
            nextInput.focus();
            if (nextInput.select) nextInput.select();
            break;
        }
        nextIndex++;
      }
    }
  };

  const cls = "h-7 rounded border border-input bg-background focus:ring-1 focus:ring-ring transition-colors text-[11px] px-1.5 min-w-0";
  const numCls = cn(cls, "text-right");
  const readonlyCls = "bg-muted/50 text-muted-foreground cursor-not-allowed";

  return (
    <>
      {isFetched && (
        <div className={cn(
          "relative flex items-center gap-1.5 border rounded-lg px-2 py-1.5 shadow-sm transition-shadow group",
          isLocked ? "bg-primary/5 border-primary/30" : "bg-white border-border hover:shadow-md"
        )}>
          <span className={cn(
            "w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0",
            isLocked ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
          )}>
            {isLocked ? "\u2713" : index + 1}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteTableRows(id)}
          >
            <BiTrash className="h-3 w-3" />
          </Button>

          <Input
            name="barCode"
            className={cn(cls, "w-[100px] shrink-0 text-left", isLocked && readonlyCls)}
            onChange={(e) => handleChange(index, e)}
            onBlur={handleBarcodeBlur}
            onKeyDown={(e) => handleKeyDown(e)}
            value={barCode || ''}
            readOnly={isLocked}
            autoFocus={!isLocked}
            placeholder={t('barCode')}
          />

          <div className="flex-1 min-w-[140px]">
            {isLocked ? (
              <Input
                className={cn(cls, "w-full text-left h-7", readonlyCls)}
                value={productName || ''}
                readOnly
              />
            ) : (
              <CustomAutoComplete
                selector="productName"
                placeholder={t('searchProduct')}
                items={allProducts || []}
                filter={filterProductsList}
                onSelectOption={onProductSelectOption}
                value={productName || ''}
                name="productName"
                onChange={onProductChange}
                renderItem={(item) => {
                  const p = item as IProduct;
                  return `${p.barCode} - ${p.productName} - ${p[sellPriceField as keyof IProduct]} DA`;
                }}
                inputProps={{
                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e),
                    onBlur: () => handleProductNameBlur(),
                    className: cn(cls, "w-full text-left placeholder:text-muted-foreground/50 h-7")
                }}
              />
            )}
          </div>

          <div className="relative shrink-0">
            <Input
              name="quantity"
              type="number"
              className={cn(numCls, "w-[50px] shrink-0 text-center font-medium", exceedsStock && "border-red-500 text-red-600")}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(e)}
              value={quantity}
              readOnly={!isLocked}
            />
            {exceedsStock && (
              <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-red-500 text-white text-[7px] font-bold flex items-center justify-center" title={`${t('available')}: ${available}`}>
                !
              </span>
            )}
          </div>

          <Input
            name="stack"
            type="number"
            className={cn(numCls, "w-[50px] shrink-0 text-center text-muted-foreground", readonlyCls)}
            value={stack}
            readOnly
          />

          <Input
            name="buyPrice"
            type="number"
            className={cn(numCls, "w-[70px] shrink-0 font-medium", readonlyCls)}
            value={buyPrice}
            readOnly
          />

          <div className="relative shrink-0">
            <Input
              name="tva"
              type="number"
              className={cn(numCls, "w-[45px] pr-3 text-center", readonlyCls)}
              value={tva}
              readOnly
            />
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] pointer-events-none">%</span>
          </div>

          <Input
            name="price"
            type="number"
            className={cn(numCls, "w-[80px] shrink-0 font-bold", readonlyCls)}
            value={currentPrice}
            readOnly
          />

          <div className="w-[90px] shrink-0 flex items-center justify-end gap-1 text-[10px] ml-1 font-mono">
            <span className="text-muted-foreground font-medium tabular-nums">{totalTTC.toFixed(2).padStart(10)}</span>
            <span className="text-[8px] text-muted-foreground shrink-0">DZD</span>
          </div>
        </div>
      )}
    </>
  )
}

export default OrderTableRows
