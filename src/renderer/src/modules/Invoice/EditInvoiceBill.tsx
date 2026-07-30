import React, { useState, useEffect } from 'react'
import { Button } from '@web/shared/components/ui/button'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { AiFillEdit, AiFillFilePdf } from 'react-icons/ai';
import CustomForm from '@web/shared/components/CustomForm'
import CustomInput from '@web/shared/components/CustomForm/Input'
import OrderProductsTable from '@web/modules/Order/OrderProductsTable';
import { price, randomId } from '@web/shared/functions/words';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useUpdateBill, useGetBillInfo } from '@web/shared/hooks/useBill';
import CustomerModal from '@web/shared/components/Customer';
import showToast from '@web/shared/functions/showToast';
import { AxiosError } from 'axios';
import CustomModal from '@web/shared/components/CustomModal';
import Alert from '@web/shared/components/Alert';
import dayjs from 'dayjs';
import { IProduct } from '@web/shared/types/product';
import { cn } from '@web/shared/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';
import { Label } from '@web/shared/components/ui/label';
import { DatePicker } from '@web/shared/components/ui/date-picker';
import { FileText, ShoppingCart, StickyNote } from 'lucide-react';

interface EditInvoiceBillProps {
  billId: string;
  isOpen?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

const EditInvoiceBill: React.FC<EditInvoiceBillProps> = ({ billId, isOpen: propIsOpen, onClose: propOnClose, hideTrigger }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof propIsOpen !== 'undefined';
  const isOpen = isControlled ? propIsOpen : internalIsOpen;

  const onOpen = () => {
    if (!isControlled) setInternalIsOpen(true);
  };

  const onClose = () => {
    if (isControlled) {
      propOnClose && propOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const onAlertOpen = () => setIsAlertOpen(true);
  const onAlertClose = () => setIsAlertOpen(false);
  const [submitted, setSubmitted] = useState(false);

  const { toast } = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: billInfo, isFetched } = useGetBillInfo(billId, { enabled: !!isOpen });
  const { mutateAsync: updateBill } = useUpdateBill(billId);

  const [priceTier, setPriceTier] = useState(1);

  const [state, setState] = useState({
    orderTotalHT: '0.00',
    orderTotalTTC: '0.00',
    receiptBillId: '',
  });

  const [initialValues, setInitialValues] = useState({
    orderId: 0,
    description: '',
    customer: '',
    orderTotalHT: state.orderTotalHT,
    orderTotalTTC: state.orderTotalTTC,
    billDate: new Date() as unknown as string,
  });

  const [productsValues, setProductsValues] = useState<IProduct[]>([{
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
  }]);

  const updateState = (newValues: { [key: string]: string }) => {
    setState((prevState) => ({
      ...prevState,
      ...newValues,
    }));
  };

  const getSellPriceField = (tier: number) => tier === 1 ? 'sellPrice_1' : tier === 2 ? 'sellPrice_2' : 'sellPrice_3';

  useEffect(() => {
    const sellPriceField = getSellPriceField(priceTier);
    const totalTTC = productsValues.reduce(
      (sum, product) => {
        const currentSellPrice = (product[sellPriceField as keyof typeof product] as number) || 0;
        const preTotal = (product.quantity || 0) * (product.stack || 0) * currentSellPrice;
        const productTva = preTotal * (product.tva || 0) / 100;
        return sum + preTotal + productTva;
      },
      0
    );
    const totalHT = productsValues.reduce(
      (sum, product) => {
        const currentSellPrice = (product[sellPriceField as keyof typeof product] as number) || 0;
        return sum + (product.quantity || 0) * (product.stack || 0) * currentSellPrice;
      },
      0
    );
    updateState({
      orderTotalHT: price(`${totalHT}`),
      orderTotalTTC: price(`${totalTTC}`),
    });
  }, [productsValues, priceTier])

  useEffect(() => {
    if (isFetched && isOpen && billInfo) {
      const { orderId, description, customer, orderTotalHT, orderTotalTTC, billDate, products } = billInfo;
      setInitialValues({
        orderId,
        description,
        customer: customer?._id,
        orderTotalHT,
        orderTotalTTC,
        billDate: dayjs(billDate).toDate() as unknown as string,
      });
      updateState({
        orderTotalHT: price(`${orderTotalHT}`),
        orderTotalTTC: price(`${orderTotalTTC}`),
      });

      if (products && Array.isArray(products)) {
        setProductsValues((products as IProduct[]).map(({ notify, _id, createdAt, updatedAt, ...rest }) => ({
          ...rest,
          buyPrice: Number(rest.buyPrice),
          quantity: Number(rest.quantity),
          stack: Number(rest.stack),
          tva: Number(rest.tva),
          sellPrice_1: Number(rest.sellPrice_1),
          sellPrice_2: Number(rest.sellPrice_2),
          sellPrice_3: Number(rest.sellPrice_3),
        })));
      }
    }
  }, [isFetched, billInfo, isOpen]);

  const onSubmit = async (values: any) => {
    setSubmitted(true);
    try {
      const payload = {
        ...values,
        pricingCategory: 0,
        paymentMethod: 'CASH',
        type: 'SALE' as const,
        orderTotalHT: state.orderTotalHT,
        orderTotalTTC: state.orderTotalTTC,
        orderPaid: '0',
        orderDebts: '0',
        products: productsValues.map((product) => {
          const { _id, __v, createdAt, updatedAt, notify, id, reserved, category, customer, sellPrice_1, sellPrice_2, sellPrice_3, warehouseStock, ...rest } = product as any;
          return {
            ...rest,
            id: _id || id,
            buyPrice: Number(product.buyPrice),
            quantity: Number(product.quantity),
            sellPrice_1: Number(product.sellPrice_1),
            sellPrice_2: Number(product.sellPrice_2),
            sellPrice_3: Number(product.sellPrice_3),
            stack: Number(product.stack),
          };
        })
      }
      const { data: update } = await updateBill(payload as any);
      updateState({ receiptBillId: update._id });
      onAlertOpen();
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success' },
      );
      onClose();
    } catch (err) {
      setSubmitted(false);
      const error = err as AxiosError;
      const serverMsg = (error.response?.data as any)?.message || error.response?.statusText || 'Please try again later';
      showToast(
        toast,
        { title: `Error ${error.response?.status || ''}`, description: serverMsg, status: 'error' },
      );
    }
  }

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues, onSubmit, enableReinitialize: true });

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
          onClick={onOpen}
        >
          <AiFillEdit className="w-4 h-4" />
        </Button>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('editInvoice')}
        confirmOnClose={!submitted && productsValues.some(p => p.productName || p.barCode)}
        confirmTitle={t('unsavedChanges')}
        confirmMessage={t('unsavedChangesMessage')}
        confirmMinimizeLabel={t('saveAndMinimize')}
        confirmDiscardLabel={t('discard')}
        confirmCancelLabel={t('cancel')}
      >
        <CustomForm handleSubmit={handleSubmit} className="h-full" hideSubmit={true}>
          <div className="flex h-[calc(100vh-100px)] gap-6 p-6 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex-1 flex flex-col gap-5 overflow-y-auto min-w-0 pr-1">
              <Card className="flex-1 border bg-white shadow-sm flex flex-col min-h-0">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between uppercase tracking-wide">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {t('products')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {[
                        { tier: 1, color: 'bg-orange-500', ring: 'ring-orange-400' },
                        { tier: 2, color: 'bg-blue-500', ring: 'ring-blue-400' },
                        { tier: 3, color: 'bg-green-500', ring: 'ring-green-400' },
                      ].map(({ tier, color, ring }) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPriceTier(tier)}
                          className={cn(
                            "w-5 h-5 rounded-full transition-all",
                            priceTier === tier
                              ? `${color} ring-2 ring-offset-1 ${ring} opacity-100`
                              : `${color} opacity-30 hover:opacity-60`
                          )}
                          title={`P.V ${tier}`}
                        />
                      ))}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0 px-5 pb-5">
                  <OrderProductsTable
                    productsValues={productsValues}
                    setProductsValues={setProductsValues}
                    priceTier={priceTier}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="w-80 flex-shrink-0 flex flex-col gap-4 sticky top-0 h-fit">
              <Card className="border bg-white shadow-sm">
                <CardHeader className="pb-2 pt-3 px-5">
                  <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                    <FileText className="h-3.5 w-3.5" />
                    {t('billInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('number')}</Label>
                        <CustomInput
                          name="orderId"
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                          value={values.orderId}
                          className="[&_input]:rounded-lg [&_input]:bg-gray-50 [&_input]:font-semibold [&_input]:h-8 [&_input]:text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('date')}</Label>
                        <DatePicker
                          value={values.billDate ? new Date(values.billDate) : new Date()}
                          onSelect={(date) => setFieldValue('billDate', date)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('customer')}</Label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <CustomInput
                            name="customer"
                            setFieldValue={setFieldValue}
                            onFocus={() => refetch()}
                            handleBlur={handleBlur}
                            value={values.customer}
                            selectOptions={
                              allCustomers && allCustomers
                                .slice()
                                .sort((a, b) => a.type === b.type ? 0 : a.type === 'Client' ? -1 : 1)
                                .map((customer) => ({
                                  label: customer?.fullname,
                                  value: customer?._id,
                                  group: customer?.type === 'Client' ? 'Clients' : 'Fournisseurs',
                                }))
                            }
                            isSelect={true}
                            inputSize="sm"
                            className="[&_>div>div]:rounded-lg"
                          />
                        </div>
                        <CustomerModal />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border bg-white shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('summary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('totalHT')}</span>
                    <span className="text-sm font-semibold text-gray-600">{state.orderTotalHT} <small className="text-muted-foreground">DZD</small></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('tva')}</span>
                    <span className="text-sm font-semibold text-purple-600">{price(String(Number(state.orderTotalTTC) - Number(state.orderTotalHT)))} <small className="text-muted-foreground">DZD</small></span>
                  </div>
                  <div className="border-t border-border" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold text-gray-900">{t('totalTTC')}</span>
                    <span className="text-xl font-bold text-primary">{state.orderTotalTTC} <small className="text-muted-foreground text-xs font-normal">DZD</small></span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border bg-white shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                    <StickyNote className="h-4 w-4" />
                    {t('notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <CustomInput
                    name="description"
                    placeholder={t('addNotes')}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    isTextArea={true}
                    defaultValue={values.description}
                    errorMessage={errors.description && touched.description && errors.description}
                    className="[&_textarea]:rounded-lg [&_textarea]:bg-gray-50 [&_textarea]:min-h-[80px] [&_textarea]:resize-none"
                  />
                </CardContent>
              </Card>

              <Button
                size="lg"
                type="submit"
                className="w-full py-6 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </CustomForm>
      </CustomModal>
      <Alert
        isOpen={isAlertOpen}
        onClose={onAlertClose}
        header={t('billUpdated')}
        body={t('billUpdatedSuccessfully')}
        variant="success"
        footer={
          <div className="flex gap-2 w-full justify-center">
            <Button variant="outline" onClick={onAlertClose}>
              {t('close')}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <a href={`#/billpdf/${state.receiptBillId || billId}`}>
                <AiFillFilePdf className="mr-2" /> {t('print')}
              </a>
            </Button>
          </div>
        }
      />
    </>
  )
}

export default EditInvoiceBill
