import React, { useState, useEffect } from 'react'
import { Button } from '@web/shared/components/ui/button'
import { useToast } from '@web/shared/components/ui/use-toast'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiLabel, BiSolidCheckCircle } from 'react-icons/bi';
import { FcDebt, FcNews, FcPaid } from 'react-icons/fc';
import { AiFillEdit, AiFillFilePdf } from 'react-icons/ai';
import CustomForm from '@web/shared/components/CustomForm'
import CustomInput from '@web/shared/components/CustomForm/Input'
import ProductsTable from '@web/modules/Receipt/components/ProductsTable';
import { price, randomId } from '@web/shared/functions/words';
import Any from '@web/shared/types/any';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useGetAllCategories } from '@web/shared/hooks/useCategories';
import { useUpdateBill, useGetBillInfo } from '@web/shared/hooks/useBill';
import CustomerModal from '@web/shared/components/Customer';
import showToast from '@web/shared/functions/showToast';
import { AxiosError } from 'axios';
import CategoryModal from '@web/shared/components/Category';
import CustomModal from '@web/shared/components/CustomModal';
import Alert from '@web/shared/components/Alert';
import dayjs from 'dayjs';
import CustomAutoComplete from '@web/shared/components/CustomAutoComplete';
import { IProduct } from '@web/shared/types/product';
import { IBill } from '@web/shared/types/bills';
import { cn } from '@web/shared/utils/cn';

interface EditReceiptBillProps {
  justCreated?: boolean;
  billId: string;
}

const EditReceiptBill: React.FC<EditReceiptBillProps> = ({ justCreated, billId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const onAlertOpen = () => setIsAlertOpen(true);
  const onAlertClose = () => setIsAlertOpen(false);

  const { toast } = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: allCategories, refetch: refetchCategories } = useGetAllCategories();
  const { data: billInfo, isFetched } = useGetBillInfo(billId);
  const { mutateAsync: updateBill } = useUpdateBill(billId);
  const [orderTotalHT, setOrderTotalHT] = useState('0.00');
  const [orderTotalTTC, setOrderTotalTTC] = useState('0.00');
  const [orderPaid, setOrderPaid] = useState('0.00');
  const [orderDebts, setOrderDebts] = useState('0.00');
  const [customerName, setCustomerName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [receiptBillId, setReceiptBillId] = useState('');
  const [initialValues, setInitialValues] = useState<Partial<IBill>>({
    orderId: 0,
    category: '',
    description: '',
    customer: '',
    orderTotalHT,
    orderTotalTTC,
    orderPaid,
    orderDebts,
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
    setOrderTotalHT(price(`${totalHT}`))
    setOrderTotalTTC(price(`${totalTTC}`))
    setOrderDebts(price(`${totalTTC - Number(orderPaid)}`))
  }, [productsValues, orderPaid, orderDebts])

  useEffect(() => {
    if (isFetched && isOpen) {
      const { orderId, category, description, customer, orderTotalHT, orderTotalTTC, orderPaid, orderDebts, billDate, products } = billInfo;
      setInitialValues({
        orderId,
        category: category?._id,
        description,
        customer: customer?._id,
        orderTotalHT,
        orderTotalTTC,
        orderPaid,
        orderDebts,
        billDate: dayjs(billDate).toDate() as unknown as string,
      });
      setOrderTotalHT(price(`${orderTotalHT}`));
      setOrderTotalTTC(price(`${orderTotalTTC}`));
      setOrderPaid(price(`${orderPaid}`));
      setOrderDebts(price(`${orderTotalTTC - Number(orderPaid)}`));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setProductsValues((products as IProduct[]).map(({ notify, _id, createdAt, updatedAt, ...rest }) => ({ ...rest })));
      setCustomerName(customer ? customer?.fullname : 'Unspecified')
      setCategoryName(category ? category?.name : 'Uncategorized')
    }
  }, [isFetched, billInfo, isOpen]);
  const setFullyPaid = () => setOrderPaid(orderTotalTTC);
  const filterAllCustomers = (query: string, _optionValue: string, optionLabel: string) => optionLabel.toLowerCase().includes(query.toLowerCase()) && !(allCustomers as Any[]).includes(optionLabel.toLowerCase())
  const filterAllCategories = (query: string, _optionValue: string, optionLabel: string) => optionLabel.toLowerCase().includes(query.toLowerCase()) && !(allCategories as Any[]).includes(optionLabel.toLowerCase())

  const onSubmit = async (values: IBill) => {
    try {
      const payload = {
        ...values,
        paymentMethod: 'CASH',
        type: 'BUY',
        orderTotalHT: orderTotalHT,
        orderTotalTTC: orderTotalTTC,
        orderPaid: orderPaid,
        orderDebts: orderDebts,
        products: productsValues.map(({ buyPrice, quantity, sellPrice_1, sellPrice_2, sellPrice_3, stack, ...rest }) => ({
          ...rest,
          buyPrice: Number(buyPrice),
          quantity: Number(quantity),
          sellPrice_1: Number(sellPrice_1),
          sellPrice_2: Number(sellPrice_2),
          sellPrice_3: Number(sellPrice_3),
          stack: Number(stack),
        }))
      }
      const { data: update } = await updateBill(payload as any);
      setReceiptBillId(update._id);
      onAlertOpen();
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success' },
      );
      setInitialValues({
        orderId: 0, category: '', description: '', customer: '', orderTotalHT, orderTotalTTC, orderPaid, orderDebts, billDate: new Date() as unknown as string,
      });
      setProductsValues([{
        id: randomId(), barCode: '', productName: '', quantity: 0, stack: 0, buyPrice: 0, sellPrice_1: 0, sellPrice_2: 0, sellPrice_3: 0, totalHT: 0, totalTTC: 0, tva: 19,
      }]);
      setOrderTotalHT('0.00');
      setOrderTotalTTC('0.00');
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

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues: initialValues as IBill, onSubmit, enableReinitialize: true });

  const onCustomerSelectOption = (item: Any) => {
    setCustomerName(item.fullname)
    setFieldValue('customer', item._id);
  }

  const onCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    setCustomerName(e.target.value);
    setFieldValue('customer', e.target.value as unknown as string);
  }

  const onCategorySelectOption = (item: Any) => {
    setCategoryName(item.name)
    setFieldValue('category', item._id);
  }

  const onCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    setCategoryName(e.target.value);
    setFieldValue('category', e.target.value as unknown as string);
  }

  return (
    <div>
      <Button
        className={cn("bg-green-500 hover:bg-green-600 text-white rounded-2xl font-normal", !justCreated && "p-0 h-8")}
        size={!justCreated ? 'sm' : 'default'}
        onClick={onOpen}
      >
        <AiFillEdit className="mr-2" /> {justCreated && t('edit')}
      </Button>
      <CustomModal
        modalProps={{ size: 'full' }}
        contentProps={{
            style: {
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                minHeight: '95vh',
                maxHeight: '95vh',
                width: '97.5vw',
                marginTop: '2.5vh'
            }
        }}
        bodyProps={{ style: { overflow: 'scroll' } }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('editReceiptBill')}
      >
        <div className="p-4">
          <div className="w-full">
            <CustomForm handleSubmit={handleSubmit}>
              <div className="max-w-[90rem] mx-auto">
                <div className="flex gap-5">
                  <div className="flex-1">
                    <CustomInput
                      name="orderId"
                      label="Numero"
                      icon={BiLabel}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      value={values.orderId}
                      errorMessage={errors.orderId && touched.orderId && errors.orderId}
                    />
                  </div>
                  <div className="flex-1">
                    <CustomInput
                      name="billDate"
                      label="Date"
                      setFieldValue={setFieldValue}
                      handleBlur={handleBlur}
                      defaultValue={values.billDate}
                      errorMessage={errors.billDate && touched.billDate && errors.billDate}
                      isDate={true}
                    />
                  </div>
                  <div className="flex-1 flex items-end gap-2">
                    <CustomAutoComplete
                      onFocus={() => refetch()}
                      filter={filterAllCustomers}
                      name={'customer'}
                      value={customerName}
                      onSelectOption={onCustomerSelectOption}
                      onChange={onCustomerChange}
                      selector={'fullname'}
                      items={allCustomers as Any[]}
                    />
                    <CustomerModal />
                  </div>
                  <div className="flex-1 flex items-end gap-2">
                    <CustomAutoComplete
                      onFocus={() => refetchCategories()}
                      filter={filterAllCategories}
                      name={'category'}
                      value={categoryName}
                      onSelectOption={onCategorySelectOption}
                      onChange={onCategoryChange}
                      selector={'name'}
                      items={allCategories as Any[]}
                    />
                    <CategoryModal />
                  </div>
                </div>
              </div>
              <p className="font-normal text-2xl text-center pt-5">{t('products')}</p>
              <ProductsTable productsValues={productsValues} setProductsValues={setProductsValues} />
              <CustomInput
                name="description"
                label="Description"
                handleChange={handleChange}
                handleBlur={handleBlur}
                isTextArea={true}
                defaultValue={values.description}
                errorMessage={errors.description && touched.description && errors.description}
              />
              <div className="flex gap-5 mt-5">
                <div className="flex-1 flex items-end gap-3">
                  <CustomInput
                    name="orderTotalHT"
                    label="Order Total (HT)"
                    icon={FcNews}
                    className="bg-gray-200 focus:bg-gray-200 focus:border focus:border-gray-300"
                    readOnly={true}
                    value={orderTotalHT as Any}
                    errorMessage={errors.orderTotalHT && touched.orderTotalHT && errors.orderTotalHT}
                    currency='DZD'
                  />
                </div>
                <div className="flex-1 flex items-end gap-5">
                  <CustomInput
                    name="orderTotalTTC"
                    label="Order Total (TTC)"
                    icon={FcNews}
                    className="bg-gray-200 focus:bg-gray-200 focus:border focus:border-gray-300"
                    readOnly={true}
                    value={orderTotalTTC as Any}
                    errorMessage={errors.orderTotalTTC && touched.orderTotalTTC && errors.orderTotalTTC}
                    currency='DZD'
                  />
                </div>
                <div className="flex-1 flex items-end">
                  <CustomInput
                    name="orderDebts"
                    label="Order Debts"
                    icon={FcDebt}
                    className="bg-gray-200 focus:bg-gray-200 focus:border focus:border-gray-300"
                    readOnly={true}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    value={orderDebts}
                    errorMessage={errors.orderDebts && touched.orderDebts && errors.orderDebts}
                    currency='DZD'
                  />
                </div>
                <div className="flex-1 flex items-end gap-2">
                  <CustomInput
                    name="orderPaid"
                    label="Paid Amount"
                    type={'number'}
                    icon={FcPaid}
                    handleChange={(e) => setOrderPaid(e.target.value)}
                    handleBlur={(e) => setOrderPaid(price(e.target.value))}
                    value={orderPaid}
                    errorMessage={errors.orderPaid && touched.orderPaid && errors.orderPaid}
                    currency='DZD'
                  />
                  <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-5 h-10" onClick={setFullyPaid}>
                    <div className="flex gap-1 items-center font-normal">
                      <BiSolidCheckCircle className="text-white" />
                      {t('fully_paid')}
                    </div>
                  </Button>
                </div>
              </div>
            </CustomForm>
          </div>
        </div>
      </CustomModal>
      <Alert
        isOpen={isAlertOpen}
        onClose={onAlertClose}
        header={t('billUpdated')}
        body={t('billUpdatedSuccessfully')}
        footer={
          <div className="flex gap-2">
            <Button className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-normal" onClick={onAlertClose}>
              {t('close')}
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-normal" asChild>
                <a href={`/billpdf/${receiptBillId}`}>
                  <AiFillFilePdf className="mr-2" /> {t('print')}
                </a>
            </Button>
            <EditReceiptBill billId={receiptBillId} justCreated />
          </div>
        }
      />
    </div>
  )
}

export default EditReceiptBill
