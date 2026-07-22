import React from 'react'
import { TableRow, TableCell } from '@web/shared/components/ui/table';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import CustomSwitch from '@web/shared/components/CustomSwitch';
import { price } from '@web/shared/functions/words';
import { useUpdateProduct } from '@web/shared/hooks/useProducts';
import { IProduct } from '@web/shared/types/product';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { AiFillDelete, AiFillEdit } from 'react-icons/ai';

interface ProductRowProps {
  product: IProduct;
}

const ProductRow: React.FC<ProductRowProps> = ({ product }) => {
  const { _id, barCode, productName, buyPrice, quantity, stack, tva, sellPrice_1, sellPrice_2, sellPrice_3, notify } = product;
  const { mutateAsync: setNotification } = useUpdateProduct(_id);
  const { toast } = useToast();

  const onNotifyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: notify } = e.target
    try {
      const payload = {
        notify
      }
      await setNotification(payload);
      toast({
        title: t('actionPerformed'),
        description: t('actionPerformedSuccessfully'),
      });
    } catch (err) {
      const error = err as AxiosError;
      toast({
        title: `Error occured ${error.response?.status}`,
        description: `${error.response?.statusText} - Please try again later`,
        variant: 'destructive',
      });
    }
  }

  return (
    <TableRow key={_id} className="group">
      <TableCell className="font-mono text-xs text-muted-foreground">{barCode}</TableCell>
      <TableCell className="font-medium">{productName}</TableCell>
      <TableCell className="text-muted-foreground">{`${quantity} × ${stack}`}</TableCell>
      <TableCell className="text-muted-foreground">{price(buyPrice)} DA</TableCell>
      <TableCell className="text-muted-foreground">%{tva}</TableCell>
      <TableCell className="text-muted-foreground">{price(sellPrice_1)} DA</TableCell>
      <TableCell className="text-muted-foreground">{price(sellPrice_2)} DA</TableCell>
      <TableCell className="text-muted-foreground">{price(sellPrice_3)} DA</TableCell>
      <TableCell className="text-center">
        <CustomSwitch colorScheme='teal' defaultValue={notify} onChange={onNotifyChange} />
      </TableCell>
      <TableCell>
        <div className="flex gap-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
            <a href={`/editbill/${_id}`}>
              <AiFillEdit className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <AiFillDelete className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default ProductRow
