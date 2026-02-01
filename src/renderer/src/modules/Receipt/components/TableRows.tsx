import React from 'react';
import { TableRow, TableCell } from "@web/shared/components/ui/table"
import { Input } from "@web/shared/components/ui/input"
import { Button } from "@web/shared/components/ui/button"
import { BiTrash } from 'react-icons/bi';
import { AiOutlineBarcode } from 'react-icons/ai';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import CustomAutoComplete from '@web/shared/components/CustomAutoComplete';
import { IProduct } from '@web/shared/types/product';
import { cn } from '@web/shared/utils/cn';

interface TableRowsProps {
  index: number;
  data: IProduct;
  products: IProduct[];
  deleteTableRows: (id: string) => void;
  handleChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProductSelect: (index: number, product: IProduct) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement, Element>) => void;
}

const TableRows: React.FC<TableRowsProps> = ({ index, data, products, deleteTableRows, handleChange, handleProductSelect, handleBlur }) => {
  const { data: allProducts, isFetched } = useGetAllProducts();

  const totalHT = Number(data.quantity || 0) * Number(data.stack || 0) * Number(data.buyPrice || 0);
  const productTva = totalHT * (data.tva || 0) / 100;
  const totalTTC = totalHT + productTva;

  const productsList = products.map((product) => product?.productName?.toLowerCase());

  const filterProductsList = (query: string, _optionValue: string, optionLabel: string) => optionLabel.toLowerCase().includes(query.toLowerCase()) && !productsList.includes(optionLabel.toLowerCase())

  const onProductSelectOption = (item: any) => {
    // We don't need to manually trigger handleChange for productName here because handleProductSelect will update the whole row
    // But CustomAutoComplete might expect the input to update?
    // Actually, CustomAutoComplete calls onSelectOption, then we update parent state.
    handleProductSelect(index, item as IProduct);
  }

  const onProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(index, e);
  }

  const { id, tva, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, productName, barCode } = data;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, fieldName: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      const inputs = Array.from(form.elements) as HTMLInputElement[];
      const currentInputIndex = inputs.indexOf(e.currentTarget);

      // Find the next input that is not disabled/readonly and is visible
      let nextIndex = currentInputIndex + 1;
      while (nextIndex < inputs.length) {
        const nextInput = inputs[nextIndex];
        if (nextInput && !nextInput.disabled && !nextInput.readOnly && nextInput.type !== 'hidden') {
            nextInput.focus();
            // Select text if it's a text/number input
            if (nextInput.select) {
                nextInput.select();
            }
            break;
        }
        nextIndex++;
      }
    }
  };

  const tableInputClass = "h-9 rounded-md border border-input bg-background focus:ring-1 focus:ring-ring transition-colors";
  const numberInputClass = cn(tableInputClass, "text-right pr-3");

  return (
    <>
      {isFetched && (
        <TableRow key={id} className="hover:bg-muted/30">
          <TableCell className="w-[50px] text-center font-medium text-muted-foreground">
            {index + 1}
          </TableCell>
          <TableCell className="p-0 w-[40px] text-center">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600" onClick={() => (deleteTableRows(id))}>
              <BiTrash />
            </Button>
          </TableCell>
          <TableCell className="p-1 min-w-[140px]">
             <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <AiOutlineBarcode size={16} />
                </div>
                <Input
                    name="barCode"
                    className={cn(tableInputClass, "pl-9 text-left")}
                    onChange={(e) => handleChange(index, e)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => handleKeyDown(e, index, 'barCode')}
                    value={barCode || ''}
                    autoFocus
                    placeholder="Scan..."
                />
             </div>
          </TableCell>
          <TableCell className="p-1 min-w-[200px]">
            <CustomAutoComplete
              selector="productName"
              placeholder="Rechercher un produit..."
              items={allProducts || []}
              filter={filterProductsList}
              onSelectOption={onProductSelectOption}
              value={productName || ''}
              name="productName"
              onChange={onProductChange}
              inputProps={{
                  onBlur: handleBlur,
                  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index, 'productName'),
                  className: cn(tableInputClass, "text-left placeholder:text-muted-foreground/50")
              }}
            />
          </TableCell>
          <TableCell className="p-1 w-[80px]">
            <Input name="quantity" type="number" className={cn(numberInputClass, "text-center font-medium")} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'quantity')} value={quantity} />
          </TableCell>
          <TableCell className="p-1 w-[80px]">
            <Input name="stack" type="number" className={cn(numberInputClass, "text-center text-muted-foreground")} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'stack')} value={stack} />
          </TableCell>
          <TableCell className="p-1 w-[100px]">
            <Input name="buyPrice" type="number" className={numberInputClass} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'buyPrice')} value={buyPrice} />
          </TableCell>
          <TableCell className="p-1 w-[100px]">
            <Input name="sellPrice_1" type="number" className={cn(numberInputClass, "text-orange-600 font-medium")} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'sellPrice_1')} value={sellPrice_1} />
          </TableCell>
          <TableCell className="p-1 w-[100px]">
            <Input name="sellPrice_2" type="number" className={cn(numberInputClass, "text-blue-600")} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'sellPrice_2')} value={sellPrice_2} />
          </TableCell>
          <TableCell className="p-1 w-[100px]">
            <Input name="sellPrice_3" type="number" className={cn(numberInputClass, "text-green-600")} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'sellPrice_3')} value={sellPrice_3} />
          </TableCell>
          <TableCell className="p-1 w-[80px]">
             <div className="relative">
                <Input name="tva" type="number" className={cn(numberInputClass, "pr-6 text-center")} onChange={(e) => handleChange(index, e)} onBlur={handleBlur} onKeyDown={(e) => handleKeyDown(e, index, 'tva')} value={tva} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                    %
                </div>
             </div>
          </TableCell>
          <TableCell className="p-1 w-[120px]">
            <Input name="totalHT" type="number" className={cn(tableInputClass, "text-right bg-muted/20 font-medium text-muted-foreground")} readOnly value={totalHT.toFixed(2)} />
          </TableCell>
          <TableCell className="p-1 w-[120px]">
            <Input name="totalTTC" type="number" className={cn(tableInputClass, "text-right bg-muted/20 font-bold text-gray-800")} readOnly value={totalTTC.toFixed(2)} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default TableRows;
