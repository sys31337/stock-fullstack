import React from "react"
import OrderTableRows from "@web/modules/Order/OrderTableRows";
import { Button } from "@web/shared/components/ui/button";
import { t } from "i18next";
import { BiPlus } from "react-icons/bi";
import { randomId } from "@web/shared/functions/words";
import { IProduct } from "@web/shared/types/product";
import { Package } from "lucide-react";
import { cn } from "@web/shared/utils/cn";

interface OrderProductsTableProps {
  productsValues: IProduct[];
  setProductsValues: (v: IProduct[]) => void;
  priceTier: number;
}

const colorMap: Record<number, string> = {
  1: 'text-orange-600',
  2: 'text-blue-600',
  3: 'text-green-600',
};

const OrderProductsTable: React.FC<OrderProductsTableProps> = ({ productsValues, setProductsValues, priceTier }) => {

  const addTableRows = () => {
    const rowsInput = {
      id: randomId(),
      barCode: '',
      productName: '',
      quantity: 0,
      stack: 0,
      buyPrice: 0,
      sellPrice_1: 0,
      sellPrice_2: 0,
      sellPrice_3: 0,
      totalHT: 0,
      totalTTC: 0,
      tva: 19,
    }
    setProductsValues([...productsValues, rowsInput])
  }

  const deleteTableRows = (id: string) => {
    const index = productsValues.findIndex((item) => item.id === id)
    setProductsValues(productsValues.filter((_p, k) => k !== index));
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const rowsInput = [...productsValues];
    rowsInput[index] = {
      ...rowsInput[index],
      [name]: value
    };
    setProductsValues(rowsInput);
  }

  const handleProductSelect = (index: number, product: IProduct) => {
    const rowsInput = [...productsValues];
    rowsInput[index] = {
      ...rowsInput[index],
      ...product,
      quantity: 1,
      totalHT: 0,
      totalTTC: 0,
    };
    setProductsValues(rowsInput);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {productsValues.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
          <span className="w-5 shrink-0" />
          <span className="w-5 shrink-0" />
          <span className="w-[100px] shrink-0">{t('barCode')}</span>
          <span className="flex-1 min-w-[140px]">{t('designation')}</span>
          <span className="w-[50px] shrink-0 text-center">{t('qty')}</span>
          <span className="w-[50px] shrink-0 text-center">{t('units')}</span>
          <span className="w-[70px] shrink-0 text-center">{t('buyPrice')}</span>
          <span className="w-[45px] shrink-0 text-center">TVA</span>
          <span className={cn("w-[80px] shrink-0 text-center font-bold", colorMap[priceTier])}>{t('price')}</span>
          <span className="w-[90px] shrink-0 text-right ml-1">{t('total')}</span>
        </div>
      )}

      {productsValues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">{t('noProducts')}</p>
          <p className="text-xs">{t('clickToAdd')}</p>
        </div>
      )}

      {productsValues.map((data, index) => (
        <OrderTableRows
          index={index}
          key={data.id}
          products={productsValues}
          data={data}
          deleteTableRows={deleteTableRows}
          handleChange={handleChange}
          handleProductSelect={handleProductSelect}
          priceTier={priceTier}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full py-3 border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors rounded-lg text-xs"
        onClick={addTableRows}
      >
        <BiPlus className="h-4 w-4 mr-1" />
        {t('addProduct')}
      </Button>
    </div>
  )
}
export default OrderProductsTable