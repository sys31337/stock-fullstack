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
    <TableRow key={_id}>
      <TableCell>{barCode}</TableCell>
      <TableCell>{productName}</TableCell>
      <TableCell>{`${quantity} × ${stack}`}</TableCell>
      <TableCell>{price(buyPrice)} DA</TableCell>
      <TableCell>%{tva}</TableCell>
      <TableCell>{price(sellPrice_1)} DA</TableCell>
      <TableCell>{price(sellPrice_2)} DA</TableCell>
      <TableCell>{price(sellPrice_3)} DA</TableCell>
      <TableCell className="text-center">
        <CustomSwitch colorScheme='teal' defaultValue={notify} onChange={onNotifyChange} />
      </TableCell>
      <TableCell>
        <div className="flex gap-1 justify-end">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-2xl text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" asChild>
            <a href={`/editbill/${_id}`}>
              <AiFillEdit />
            </a>
          </Button>
          <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-2xl">
            <AiFillDelete />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default ProductRow