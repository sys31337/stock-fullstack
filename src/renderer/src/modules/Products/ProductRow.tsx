import React, { useState } from 'react'
import { TableRow, TableCell } from '@web/shared/components/ui/table';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import CustomSwitch from '@web/shared/components/CustomSwitch';
import { price } from '@web/shared/functions/words';
import { useUpdateProduct, useDeleteProduct } from '@web/shared/hooks/useProducts';
import { IProduct } from '@web/shared/types/product';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { AiFillDelete, AiFillEdit } from 'react-icons/ai';
import CustomModal from '@web/shared/components/CustomModal';
import showToast from '@web/shared/functions/showToast';
import ProductEditModal from '@web/modules/Products/ProductEditModal';

interface ProductRowProps {
  product: IProduct;
}

const ProductRow: React.FC<ProductRowProps> = ({ product }) => {
  const { _id, barCode, productName, buyPrice, quantity, stack, tva, sellPrice_1, sellPrice_2, sellPrice_3, notify, reserved } = product;
  const { mutateAsync: setNotification } = useUpdateProduct(_id || '');
  const { mutateAsync: deleteProduct } = useDeleteProduct();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProduct(deleteId)
      showToast(toast, { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success' })
      setDeleteId(null)
    } catch (err) {
      const error = err as AxiosError
      showToast(toast, { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText}`, status: 'error' })
    }
  }

  return (
    <>
      <TableRow key={_id} className="group">
        <TableCell className="font-mono text-xs text-muted-foreground">{barCode}</TableCell>
        <TableCell className="font-medium">{productName}</TableCell>
        <TableCell className="text-muted-foreground">
          {reserved && Number(reserved) > 0
            ? `${quantity} (${reserved}) × ${stack}`
            : `${quantity} × ${stack}`}
        </TableCell>
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
            <ProductEditModal
              product={product}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <AiFillEdit className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteId(_id || null)}
            >
              <AiFillDelete className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <CustomModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('confirmDelete')}
      >
        <p className="text-sm text-muted-foreground mb-4">{t('confirmDeleteMessage')}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>{t('cancel')}</Button>
          <Button variant="destructive" onClick={handleDelete}>{t('delete')}</Button>
        </div>
      </CustomModal>
    </>
  )
}

export default ProductRow
