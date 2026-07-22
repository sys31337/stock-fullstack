import React, { useState } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Label } from '@web/shared/components/ui/label';
import { useToast } from '@web/shared/components/ui/use-toast';
import { useUpdateProduct } from '@web/shared/hooks/useProducts';
import { IProduct } from '@web/shared/types/product';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import CustomModal from '@web/shared/components/CustomModal';
import { ReactNode } from 'react';

interface ProductEditModalProps {
  product: IProduct;
  trigger?: ReactNode;
}

const ProductEditModal = ({ product, trigger }: ProductEditModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const { mutateAsync: updateProduct } = useUpdateProduct(product._id || '');
  const { toast } = useToast();

  const [form, setForm] = useState({
    barCode: product.barCode || '',
    productName: product.productName || '',
    quantity: product.quantity ?? 0,
    stack: product.stack ?? 0,
    buyPrice: product.buyPrice ?? 0,
    sellPrice_1: product.sellPrice_1 ?? 0,
    sellPrice_2: product.sellPrice_2 ?? 0,
    sellPrice_3: product.sellPrice_3 ?? 0,
    tva: product.tva ?? 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['quantity', 'stack', 'buyPrice', 'sellPrice_1', 'sellPrice_2', 'sellPrice_3', 'tva'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalHT = form.quantity * form.buyPrice;
      const totalTTC = totalHT * (1 + form.tva / 100);
      await updateProduct({ ...form, totalHT, totalTTC });
      toast({
        title: t('actionPerformed'),
        description: t('actionPerformedSuccessfully'),
      });
      onClose();
    } catch (err) {
      const error = err as AxiosError;
      toast({
        title: `Error occured ${error.response?.status}`,
        description: `${error.response?.statusText} - Please try again later`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <span onClick={onOpen} className="cursor-pointer">{trigger}</span>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('editProduct')}
        contentProps={{ style: { maxWidth: '42rem' } }}
      >
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="barCode" className="mb-1.5 block">{t('barCode')}</Label>
              <Input id="barCode" name="barCode" value={form.barCode} onChange={handleChange} className="rounded-xl" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="productName" className="mb-1.5 block">{t('productName')}</Label>
              <Input id="productName" name="productName" value={form.productName} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="quantity" className="mb-1.5 block">{t('qté')}</Label>
              <Input id="quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="stack" className="mb-1.5 block">Stack</Label>
              <Input id="stack" name="stack" type="number" value={form.stack} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="buyPrice" className="mb-1.5 block">{t('buyPrice')}</Label>
              <Input id="buyPrice" name="buyPrice" type="number" value={form.buyPrice} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="tva" className="mb-1.5 block">TVA %</Label>
              <Input id="tva" name="tva" type="number" value={form.tva} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="sellPrice_1" className="mb-1.5 block">{t('sellPrice')} 1</Label>
              <Input id="sellPrice_1" name="sellPrice_1" type="number" value={form.sellPrice_1} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="sellPrice_2" className="mb-1.5 block">{t('sellPrice')} 2</Label>
              <Input id="sellPrice_2" name="sellPrice_2" type="number" value={form.sellPrice_2} onChange={handleChange} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="sellPrice_3" className="mb-1.5 block">{t('sellPrice')} 3</Label>
              <Input id="sellPrice_3" name="sellPrice_3" type="number" value={form.sellPrice_3} onChange={handleChange} className="rounded-xl" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white">{t('submit')}</Button>
          </div>
        </form>
      </CustomModal>
    </>
  );
};

export default ProductEditModal;
