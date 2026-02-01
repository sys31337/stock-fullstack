import React, { useState, useEffect } from 'react'
import { Button } from '@web/shared/components/ui/button'
import { Tooltip } from '@web/shared/components/ui/tooltip'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiLabel, BiSolidCheckCircle } from 'react-icons/bi';
import { FcDebt, FcNews, FcPaid } from 'react-icons/fc';
import { AiFillFilePdf, AiOutlineMinus, AiOutlineClose } from 'react-icons/ai';
import CustomForm from '@web/shared/components/CustomForm'
import CustomInput from '@web/shared/components/CustomForm/Input'
import ProductsTable from '@web/modules/Receipt/components/ProductsTable';
import { price, randomId } from '@web/shared/functions/words';
import Any from '@web/shared/types/any';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useGetAllCategories } from '@web/shared/hooks/useCategories';
import { useCreateBill, useGetLatestBillNumber } from '@web/shared/hooks/useBill';
import CustomerModal from '@web/shared/components/Customer';
import showToast from '@web/shared/functions/showToast';
import { AxiosError } from 'axios';
import CategoryModal from '@web/shared/components/Category';
import CustomModal from '@web/shared/components/CustomModal';
import Alert from '@web/shared/components/Alert';
import { Payload } from '@web/shared/types/payload';
import { useReceiptHold, HeldReceipt } from '@web/shared/contexts/ReceiptHoldContext';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHeldData?: HeldReceipt['data'];
  heldReceiptId?: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, initialHeldData, heldReceiptId }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const onAlertOpen = () => setIsAlertOpen(true);
  const onAlertClose = () => setIsAlertOpen(false);

  const { toast } = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: allCategories, refetch: refetchCategories } = useGetAllCategories();
  const { data: latestBillNumber, isFetched } = useGetLatestBillNumber('BUY');
  const { mutateAsync: createBill } = useCreateBill();
  const { holdReceipt, removeHeldReceipt } = useReceiptHold();

  const [state, setState] = useState({
    orderTotalHT: '0.00',
    orderTotalTTC: '0.00',
    orderPaid: '0.00',
    orderDebts: '0.00',
    receiptBillId: '',
  });

  const [initialValues, setInitialValues] = useState({
    orderId: 0,
    category: '',
    description: '',
    customer: '',
    orderTotalHT: state.orderTotalHT,
    orderTotalTTC: state.orderTotalTTC,
    orderPaid: state.orderPaid,
    orderDebts: state.orderDebts,
    billDate: new Date() as unknown as string,
  });

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

  // Load initial held data if available
  useEffect(() => {
    if (initialHeldData && isOpen) {
      setState(initialHeldData.state);
      setInitialValues(initialHeldData.values);
      setProductsValues(initialHeldData.productsValues);
    } else if (isOpen && !initialHeldData) {
      // Reset if opening new
      // We rely on the useEffect below for latestBillNumber
    }
  }, [initialHeldData, isOpen]);

  const updateState = (newValues: { [key: string]: string }) => {
    setState((prevState) => ({
      ...prevState,
      ...newValues,
    }));
  };

  useEffect(() => {
    const totalTTC = productsValues.reduce(
      (sum, product) => {
        const { buyPrice, quantity, stack, tva } = product;
        const preTotal = quantity * stack * buyPrice;
        const productTva = preTotal * tva / 100;
        const total = preTotal + productTva
        return sum + total;
      },
      0
    );
    const totalHT = productsValues.reduce(
      (sum, product) => {
        const { buyPrice, quantity, stack } = product;
        const total = quantity * stack * buyPrice;
        return sum + total;
      },
      0
    );
    updateState({
      orderTotalHT: price(`${totalHT}`),
      orderTotalTTC: price(`${totalTTC}`),
      orderDebts: price(`${totalTTC - Number(state.orderPaid)}`),
    });
  }, [productsValues, state.orderPaid, state.orderDebts])

  useEffect(() => {
    if (isFetched && !initialHeldData) {
      setInitialValues((prev) => ({ ...prev, orderId: latestBillNumber + 1 }))
    }
  }, [isFetched, latestBillNumber, initialHeldData]);

  const setFullyPaid = () => updateState({ orderPaid: state.orderTotalTTC });

  const onSubmit = async (values: Payload) => {
    try {
      const payload = {
        ...values,
        paymentMethod: 'CASH',
        type: 'BUY',
        orderTotalHT: state.orderTotalHT,
        orderTotalTTC: state.orderTotalTTC,
        orderPaid: state.orderPaid,
        orderDebts: state.orderDebts,
        products: productsValues.map(({ buyPrice, quantity, sellPrice_1, sellPrice_2, sellPrice_3, stack, ...rest }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, __v, createdAt, updatedAt, notify, id, ...cleanProduct } = rest as any;
          return {
            ...cleanProduct,
            id: _id || id,
            buyPrice: Number(buyPrice),
            quantity: Number(quantity),
            sellPrice_1: Number(sellPrice_1),
            sellPrice_2: Number(sellPrice_2),
            sellPrice_3: Number(sellPrice_3),
            stack: Number(stack),
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
        category: '',
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
      showToast(
        toast,
        { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText} - Please try again later`, status: 'error' },
      );
    }
  }

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues, onSubmit, enableReinitialize: true });

  const handleMinimize = () => {
    holdReceipt({
      values: values, // Current form values
      productsValues: productsValues,
      state: state
    }, `Receipt #${values.orderId}`, heldReceiptId);

    // Reset form
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
        title={t('newReceiptBill')}
        headerActions={
          <div className="flex items-center gap-2">
            <Tooltip content={t('minimize')}>
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-8 w-8 bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
                onClick={handleMinimize}
              >
                <AiOutlineMinus className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={t('close')}>
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-8 w-8 bg-red-500 text-white hover:bg-red-600 shadow-sm"
                onClick={onClose}
              >
                <AiOutlineClose className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        }
      >
        <div className="h-full bg-gray-50/50 dark:bg-gray-900/50 p-4">
          <CustomForm handleSubmit={handleSubmit} className="h-full flex flex-col gap-4" hideSubmit={true}>
            {/* General Info Section */}
            <Card className="border bg-white">
              <CardContent className="pt-4 px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                  <CustomInput
                    name="orderId"
                    label={t('number')}
                    icon={BiLabel}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    value={values.orderId}
                    errorMessage={errors.orderId && touched.orderId && errors.orderId}
                  />
                  <CustomInput
                    name="billDate"
                    label={t('date')}
                    setFieldValue={setFieldValue}
                    handleBlur={handleBlur}
                    defaultValue={values.billDate}
                    errorMessage={errors.billDate && touched.billDate && errors.billDate}
                    isDate={true}
                  />
                  <div className="flex items-end gap-2">
                    <CustomInput
                      name="customer"
                      label={t('customer')}
                      setFieldValue={setFieldValue}
                      onFocus={() => refetch()}
                      handleBlur={handleBlur}
                      value={values.customer}
                      errorMessage={errors.customer && touched.customer && errors.customer}
                      selectOptions={
                        allCustomers && allCustomers.map((customer) => ({ label: customer?.fullname, value: customer?._id }))
                      }
                      isSelect={true}
                      className="mb-0 w-full"
                    />
                    <CustomerModal />
                  </div>
                  <div className="flex items-end gap-2">
                    <CustomInput
                      name="category"
                      label={t('category')}
                      setFieldValue={setFieldValue}
                      onFocus={() => refetchCategories()}
                      handleBlur={handleBlur}
                      value={values.category}
                      errorMessage={errors.category && touched.category && errors.category}
                      selectOptions={
                        allCategories && allCategories.map((category) => ({ label: category?.name, value: category?._id }))
                      }
                      isSelect={true}
                      className="mb-0 w-full"
                    />
                    <CategoryModal />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card className="flex-1 border flex flex-col min-h-0 bg-white">
              <CardHeader className="pb-2 pt-4 px-6">
                <CardTitle className="text-lg font-medium flex justify-between items-center">
                  {t('products')}
                  <div className="text-sm font-normal text-muted-foreground">
                    {productsValues.length} {t('items')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-0 px-2 md:px-6 pb-2">
                <ProductsTable productsValues={productsValues} setProductsValues={setProductsValues} />
              </CardContent>
            </Card>

            {/* Summary & Totals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description */}
              <Card className="lg:col-span-1 border bg-white">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base font-medium text-muted-foreground">{t('notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomInput
                    name="description"
                    placeholder={t('addNotes')}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    isTextArea={true}
                    defaultValue={values.description}
                    errorMessage={errors.description && touched.description && errors.description}
                    className="min-h-[120px] bg-white resize-none"
                  />
                </CardContent>
              </Card>

              {/* Financial Totals */}
              <Card className="lg:col-span-2 border bg-white">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg font-medium">{t('paymentDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Totals Summary Vertical List */}
                    <div className="space-y-3 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">{t('totalHT')}</span>
                         <span className="font-semibold text-gray-700">{state.orderTotalHT} <small>DZD</small></span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">{t('debts')}</span>
                         <span className="font-semibold text-orange-600">{state.orderDebts} <small>DZD</small></span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                         <span className="text-lg font-bold text-gray-900">{t('totalTTC')}</span>
                         <span className="text-2xl font-bold text-primary">{state.orderTotalTTC} <small>DZD</small></span>
                      </div>
                    </div>

                    {/* Payment Input & Actions */}
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <CustomInput
                            name="orderPaid"
                            label={t('paidAmount')}
                            type={'number'}
                            handleChange={(e) => updateState({ orderPaid: e.target.value })}
                            handleBlur={(e) => updateState({ orderPaid: e.target.value })}
                            value={state.orderPaid}
                            errorMessage={errors.orderPaid && touched.orderPaid && errors.orderPaid}
                            currency='DZD'
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-10 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => { e.preventDefault(); setFullyPaid(); }}
                          title={t('fully_paid')}
                        >
                          <span className="mr-2 font-medium">{t('fully_paid')}</span>
                          <BiSolidCheckCircle className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          size="lg"
                          type="submit"
                          className="w-full md:w-auto min-w-[200px] bg-gray-900 hover:bg-black text-white"
                        >
                           {t('submit')}
                        </Button>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </div>
          </CustomForm>
        </div>
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
              <a href={`/billpdf/${state.receiptBillId}`} target="_blank" rel="noreferrer">
                <AiFillFilePdf className="mr-2" /> {t('print')}
              </a>
            </Button>
          </div>
        }
      />
    </>
  )
}

export default ReceiptModal
