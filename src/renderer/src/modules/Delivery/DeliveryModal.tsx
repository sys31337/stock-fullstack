import React, { useState, useEffect } from 'react'
import { Button } from '@web/shared/components/ui/button'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiSolidCheckCircle } from 'react-icons/bi';
import { AiFillFilePdf } from 'react-icons/ai';
import CustomForm from '@web/shared/components/CustomForm'
import CustomInput from '@web/shared/components/CustomForm/Input'
import OrderProductsTable from '@web/modules/Order/OrderProductsTable';
import { price, randomId } from '@web/shared/functions/words';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useGetAllWarehouses } from '@web/shared/hooks/useWarehouses';
import { useCreateBill, useGetLatestBillNumber, useCheckBillOrderId } from '@web/shared/hooks/useBill';
import CustomerModal from '@web/shared/components/Customer';
import showToast from '@web/shared/functions/showToast';
import { AxiosError } from 'axios';
import CustomModal from '@web/shared/components/CustomModal';
import Alert from '@web/shared/components/Alert';
import { Payload } from '@web/shared/types/payload';
import { useReceiptHold, HeldReceipt } from '@web/shared/contexts/ReceiptHoldContext';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';
import { Label } from '@web/shared/components/ui/label';
import { DatePicker } from '@web/shared/components/ui/date-picker';
import { FileText, ShoppingCart, StickyNote } from 'lucide-react';
import { cn } from '@web/shared/utils/cn';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHeldData?: HeldReceipt['data'];
  heldReceiptId?: string;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, onClose, initialHeldData, heldReceiptId }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const onAlertOpen = () => setIsAlertOpen(true);
  const onAlertClose = () => setIsAlertOpen(false);

  const { toast } = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: allWarehouses } = useGetAllWarehouses();
  const { data: latestBillNumber, isFetched } = useGetLatestBillNumber('DELIVERY');
  const { mutateAsync: createBill } = useCreateBill();
  const { holdReceipt, removeHeldReceipt } = useReceiptHold();

  const [priceTier, setPriceTier] = useState(1);

  const [state, setState] = useState({
    orderTotalHT: '0.00',
    orderTotalTTC: '0.00',
    orderPaid: '0.00',
    orderDebts: '0.00',
    receiptBillId: '',
  });

  const [initialValues, setInitialValues] = useState({
    orderId: 0,
    description: '',
    customer: '',
    warehouse: '',
    orderTotalHT: state.orderTotalHT,
    orderTotalTTC: state.orderTotalTTC,
    orderPaid: state.orderPaid,
    orderDebts: state.orderDebts,
    billDate: new Date() as unknown as string,
  });

  useEffect(() => {
    if (initialHeldData && isOpen) {
      setState(initialHeldData.state);
      setInitialValues(initialHeldData.values);
      setProductsValues(initialHeldData.productsValues);
    }
  }, [initialHeldData, isOpen]);

  const getSellPriceField = (tier: number) => tier === 1 ? 'sellPrice_1' : tier === 2 ? 'sellPrice_2' : 'sellPrice_3';

  const [productsValues, setProductsValues] = useState([{
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
      orderDebts: price(`${totalTTC - Number(state.orderPaid)}`),
    });
  }, [productsValues, state.orderPaid, priceTier])

  useEffect(() => {
    if (isFetched) {
      setFieldValue('orderId', latestBillNumber + 1)
    }
  }, [isFetched, latestBillNumber]);

  const setFullyPaid = () => updateState({ orderPaid: state.orderTotalTTC });

  const onSubmit = async (values: Payload) => {
    try {
      const { category: _category, ...valuesWithoutCategory } = values;
      const payload = {
        ...valuesWithoutCategory,
        pricingCategory: 0,
        paymentMethod: 'CASH',
        type: 'DELIVERY' as const,
        orderTotalHT: state.orderTotalHT,
        orderTotalTTC: state.orderTotalTTC,
        orderPaid: state.orderPaid,
        orderDebts: state.orderDebts,
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
      const { data: newBill } = await createBill(payload);
      updateState({ receiptBillId: newBill._id })

      if (heldReceiptId) {
        removeHeldReceipt(heldReceiptId);
      }

      onAlertOpen();
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success' },
      );
      setInitialValues({
        orderId: latestBillNumber + 2,
        description: '',
        customer: '',
        orderTotalHT: state.orderTotalHT,
        orderTotalTTC: state.orderTotalTTC,
        orderPaid: state.orderPaid,
        orderDebts: state.orderDebts,
        billDate: new Date() as unknown as string,
      });
      setProductsValues([{
        id: randomId(), barCode: '', productName: '', quantity: 0, stack: 0, buyPrice: 0, sellPrice_1: 0, sellPrice_2: 0, sellPrice_3: 0, totalHT: 0, totalTTC: 0, tva: 19,
      }]);
      updateState({
        orderTotalHT: ('0.00'),
        orderTotalTTC: ('0.00'),
      })
      setFullyPaid();
      onClose();
    } catch (err) {
      const error = err as AxiosError;
      const serverMsg = (error.response?.data as any)?.message || error.response?.statusText || 'Please try again later';
      showToast(
        toast,
        { title: `Error ${error.response?.status || ''}`, description: serverMsg, status: 'error' },
      );
    }
  }

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue, setFieldError } = useFormik({ initialValues, onSubmit, enableReinitialize: true });
  const { mutateAsync: checkOrderId } = useCheckBillOrderId();

  const handleOrderIdBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(e);
    const id = Number(e.target.value);
    if (!id) return;
    try {
      const exists = await checkOrderId({ type: 'DELIVERY', orderId: id });
      if (exists) {
        setFieldError('orderId', 'orderIdExists');
      }
    } catch {
      // ignore network errors on blur check
    }
  };

  const handleMinimize = () => {
    holdReceipt({
      values: values,
      productsValues: productsValues,
      state: state
    }, 'DELIVERY', `Delivery #${values.orderId}`, heldReceiptId);

    setProductsValues([{
      id: randomId(), barCode: '', productName: '', quantity: 0, stack: 0, buyPrice: 0, sellPrice_1: 0, sellPrice_2: 0, sellPrice_3: 0, totalHT: 0, totalTTC: 0, tva: 19,
    }]);
    updateState({
      orderTotalHT: ('0.00'),
      orderTotalTTC: ('0.00'),
      orderPaid: '0.00',
      orderDebts: '0.00',
    });

    onClose();
  };

  return (
    <>
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('newDeliveryNote')}
        onMinimize={handleMinimize}
        minimizeTooltip={t('minimize')}
        closeTooltip={t('close')}
        confirmOnClose={productsValues.some(p => p.productName || p.barCode)}
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
                          handleBlur={handleOrderIdBlur}
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
                    <div>
                      <Label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('warehouse')}</Label>
                      <CustomInput
                        name="warehouse"
                        setFieldValue={setFieldValue}
                        handleBlur={handleBlur}
                        value={values.warehouse}
                        selectOptions={
                          allWarehouses && allWarehouses.map((w: any) => ({ label: `${w.name} (${w.code})`, value: w._id }))
                        }
                        isSelect={true}
                        inputSize="sm"
                        className="[&_>div>div]:rounded-lg"
                      />
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('debts')}</span>
                    <span className="text-sm font-semibold text-orange-600">{state.orderDebts} <small className="text-muted-foreground">DZD</small></span>
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
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('paymentDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('paidAmount')}</Label>
                    <CustomInput
                      name="orderPaid"
                      type={'number'}
                      handleChange={(e) => updateState({ orderPaid: e.target.value })}
                      handleBlur={(e) => updateState({ orderPaid: e.target.value })}
                      value={state.orderPaid}
                      errorMessage={errors.orderPaid && touched.orderPaid && errors.orderPaid}
                      currency='DZD'
                      className="[&_input]:rounded-lg [&_input]:bg-gray-50 [&_input]:text-base [&_input]:font-semibold"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 font-medium"
                    onClick={(e) => { e.preventDefault(); setFullyPaid(); }}
                  >
                    <BiSolidCheckCircle className="h-4 w-4 mr-2" />
                    {t('fully_paid')}
                  </Button>
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
                {t('submit')}
              </Button>
            </div>
          </div>
        </CustomForm>
      </CustomModal>
      <Alert
        isOpen={isAlertOpen}
        onClose={onAlertClose}
        header={t('billCreated')}
        body={t('billCreatedSuccessfully')}
        variant="success"
        footer={
          <div className="flex gap-2 w-full justify-center">
            <Button variant="outline" onClick={onAlertClose}>
              {t('close')}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <a href={`/billpdf/${state.receiptBillId}`}>
                <AiFillFilePdf className="mr-2" /> {t('print')}
              </a>
            </Button>
          </div>
        }
      />
    </>
  )
}

export default DeliveryModal
