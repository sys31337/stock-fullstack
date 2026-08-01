import React, { useState, useEffect } from 'react'
import { Button } from '@web/shared/components/ui/button'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiLabel, BiSolidCheckCircle } from 'react-icons/bi';
import { AiFillEdit, AiFillFilePdf } from 'react-icons/ai';
import CustomForm from '@web/shared/components/CustomForm'
import CustomInput from '@web/shared/components/CustomForm/Input'
import ProductsTable from '@web/modules/Receipt/components/ProductsTable';
import { price, randomId } from '@web/shared/functions/words';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useGetAllCategories } from '@web/shared/hooks/useCategories';
import { useGetAllWarehouses } from '@web/shared/hooks/useWarehouses';
import { useUpdateBill, useGetBillInfo } from '@web/shared/hooks/useBill';
import CustomerModal from '@web/shared/components/Customer';
import showToast from '@web/shared/functions/showToast';
import { AxiosError } from 'axios';
import CategoryModal from '@web/shared/components/Category';
import CustomModal from '@web/shared/components/CustomModal';
import Alert from '@web/shared/components/Alert';
import dayjs from 'dayjs';
import { IProduct } from '@web/shared/types/product';
import { IBill } from '@web/shared/types/bills';
import { cn } from '@web/shared/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';
import { useReceiptHold } from '@web/shared/contexts/ReceiptHoldContext';

interface EditReceiptBillProps {
  justCreated?: boolean;
  billId: string;
  isOpen?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

const EditReceiptBill: React.FC<EditReceiptBillProps> = ({ justCreated, billId, isOpen: propIsOpen, onClose: propOnClose, hideTrigger }) => {
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

  const { holdReceipt } = useReceiptHold();

  const handleMinimize = () => {
    holdReceipt({
      values: values,
      productsValues: productsValues,
      state: state
    }, 'RECEIPT', `Receipt #${values.orderId}`);
    onClose();
  };

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const onAlertOpen = () => setIsAlertOpen(true);
  const onAlertClose = () => setIsAlertOpen(false);
  const [submitted, setSubmitted] = useState(false);

  const { toast } = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: allCategories, refetch: refetchCategories } = useGetAllCategories();
  const { data: allWarehouses } = useGetAllWarehouses();
  const { data: billInfo, isFetched } = useGetBillInfo(billId, { enabled: !!isOpen });
  const { mutateAsync: updateBill } = useUpdateBill(billId);

  const [state, setState] = useState({
    orderTotalHT: '0.00',
    orderTotalTTC: '0.00',
    orderPaid: '0.00',
    orderDebts: '0.00',
    receiptBillId: '',
  });

  const [initialValues, setInitialValues] = useState<Partial<IBill>>({
    orderId: '',
    category: '',
    description: '',
    customer: '',
    warehouse: '',
    orderTotalHT: state.orderTotalHT,
    orderTotalTTC: state.orderTotalTTC,
    orderPaid: state.orderPaid,
    orderDebts: state.orderDebts,
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
    if (isFetched && isOpen && billInfo) {
      const { orderId, category, description, customer, warehouse, orderTotalHT, orderTotalTTC, orderPaid, orderDebts, billDate, products } = billInfo;
      setInitialValues({
        orderId,
        category: category?._id,
        description,
        customer: customer?._id,
        warehouse: warehouse?._id || warehouse,
        orderTotalHT,
        orderTotalTTC,
        orderPaid,
        orderDebts,
        billDate: dayjs(billDate).toDate() as unknown as string,
      });
      updateState({
        orderTotalHT: price(`${orderTotalHT}`),
        orderTotalTTC: price(`${orderTotalTTC}`),
        orderPaid: price(`${orderPaid}`),
        orderDebts: price(`${orderTotalTTC - Number(orderPaid)}`),
      });

      if (products && Array.isArray(products)) {
        setProductsValues((products as IProduct[]).map(({ notify, _id, createdAt, updatedAt, ...rest }) => ({
          ...rest,
          // Ensure these are numbers
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

  const setFullyPaid = () => updateState({ orderPaid: state.orderTotalTTC });

  const onSubmit = async (values: IBill) => {
    setSubmitted(true);
    try {
      const payload = {
        ...values,
        paymentMethod: 'CASH',
        type: 'BUY',
        warehouse: values.warehouse || undefined,
        orderTotalHT: state.orderTotalHT,
        orderTotalTTC: state.orderTotalTTC,
        orderPaid: state.orderPaid,
        orderDebts: state.orderDebts,
        products: productsValues.map(({ buyPrice, quantity, sellPrice_1, sellPrice_2, sellPrice_3, stack, ...rest }) => {
          const { _id, __v, createdAt, updatedAt, notify, id, reserved, warehouseStock, category, customer, ...cleanProduct } = rest as any;
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
      showToast(
        toast,
        { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText} - Please try again later`, status: 'error' },
      );
    }
  }

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues: initialValues as IBill, onSubmit, enableReinitialize: true });

  return (
    <>
      {!hideTrigger && (
        <Button
          variant={!justCreated ? "ghost" : "default"}
          size={!justCreated ? "icon" : "default"}
          className={cn(
            !justCreated
              ? "h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
              : "bg-green-500 hover:bg-green-600 text-white rounded-2xl font-normal"
          )}
          onClick={onOpen}
        >
          <AiFillEdit className={cn(!justCreated ? "w-4 h-4" : "mr-2")} />
          {justCreated && t('edit')}
        </Button>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('editReceiptBill')}
        onMinimize={handleMinimize}
        minimizeTooltip={t('minimize')}
        closeTooltip={t('close')}
        confirmOnClose={!submitted && productsValues.some(p => p.productName || p.barCode)}
        confirmTitle={t('unsavedChanges')}
        confirmMessage={t('unsavedChangesMessage')}
        confirmMinimizeLabel={t('saveAndMinimize')}
        confirmDiscardLabel={t('discard')}
        confirmCancelLabel={t('cancel')}
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
                      value={values.customer as string}
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
                      value={values.category as string}
                      errorMessage={errors.category && touched.category && errors.category}
                      selectOptions={
                        allCategories && allCategories.map((category) => ({ label: category?.name, value: category?._id }))
                      }
                      isSelect={true}
                      className="mb-0 w-full"
                    />
                    <CategoryModal />
                  </div>
                  <div>
                    <CustomInput
                      name="warehouse"
                      label={t('warehouse')}
                      setFieldValue={setFieldValue}
                      handleBlur={handleBlur}
                      value={values.warehouse}
                      selectOptions={
                        allWarehouses && allWarehouses.map((w: any) => ({ label: `${w.name} (${w.code})`, value: w._id }))
                      }
                      isSelect={true}
                      className="mb-0 w-full"
                    />
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
                        {t('saveChanges')}
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
        header={t('billUpdated')}
        body={t('billUpdatedSuccessfully')}
        variant="success"
        footer={
          <div className="flex gap-2 w-full justify-center">
            <Button variant="outline" onClick={onAlertClose}>
              {t('close')}
            </Button>
            <a href={`#/billpdf/${state.receiptBillId || billId}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <AiFillFilePdf className="mr-2" /> {t('print')}
              </Button>
            </a>
          </div>
        }
      />
    </>
  )
}

export default EditReceiptBill
