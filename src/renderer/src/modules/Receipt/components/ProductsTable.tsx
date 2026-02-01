import React from "react"
import TableRows from "@web/modules/Receipt/components/TableRows";
import { Button } from "@web/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/shared/components/ui/table"
import { t } from "i18next";
import { BiTrash } from "react-icons/bi";
import { price, randomId } from "@web/shared/functions/words";
import { IProduct } from "@web/shared/types/product";

const decimalInputs = ['sellPrice_1', 'sellPrice_2', 'sellPrice_3', 'buyPrice', 'totalHT', 'totalTTC']

interface ProductsTableProps {
  productsValues: IProduct[];
  setProductsValues: (v: IProduct[]) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ productsValues, setProductsValues }) => {

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
      [name]: decimalInputs.includes(name) ? price(value) : value
    };
    setProductsValues(rowsInput);
  }

  const handleProductSelect = (index: number, product: IProduct) => {
    const rowsInput = [...productsValues];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _productId, ...productData } = product;

    rowsInput[index] = {
      ...rowsInput[index],
      ...productData,
      // Reset totals or recalculate? Previous code reset them to 0.
      totalHT: 0,
      totalTTC: 0
    };
    setProductsValues(rowsInput);
  }

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    e.target.value = decimalInputs.includes(name) ? price(value) : value;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full overflow-auto border rounded-md bg-white">
        <Table>
          <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="text-center w-[50px]">#</TableHead>
            <TableHead className="text-center w-[40px]"><BiTrash size={16} className="mx-auto" /></TableHead>
            <TableHead className="text-left w-[140px] pl-4">{t('barCode')}</TableHead>
            <TableHead className="text-left min-w-[200px] pl-4">{t('designation')}</TableHead>
            <TableHead className="text-center w-[80px]">{t('qty')}</TableHead>
            <TableHead className="text-center w-[80px]">{t('units')}</TableHead>
            <TableHead className="text-right w-[100px] pr-4">{t('buyPrice')}</TableHead>
            <TableHead className="text-right w-[100px] pr-4 text-orange-600 font-medium">{t('sellPrice')} 1</TableHead>
            <TableHead className="text-right w-[100px] pr-4 text-blue-600 font-medium">{t('sellPrice')} 2</TableHead>
            <TableHead className="text-right w-[100px] pr-4 text-green-600 font-medium">{t('sellPrice')} 3</TableHead>
            <TableHead className="text-center w-[80px]">{t('tva')}</TableHead>
            <TableHead className="text-right w-[120px] pr-4">{t('totalHT')}</TableHead>
            <TableHead className="text-right w-[120px] pr-4">{t('totalTTC')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            productsValues.map((data, index) => (
              <TableRows
                index={index}
                key={index}
                products={productsValues}
                data={data}
                deleteTableRows={deleteTableRows}
                handleChange={handleChange}
                handleProductSelect={handleProductSelect}
                handleBlur={handleBlur}
              />
            ))
          }
        </TableBody>
      </Table>
      </div>
      <Button
        variant="default"
        className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        onClick={addTableRows}
      >
        + {t('addProduct')}
      </Button>
    </div>
  )
}
export default ProductsTable
