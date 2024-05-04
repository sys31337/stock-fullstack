import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
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
import { Item } from '@choc-ui/chakra-autocomplete';

interface EditReceiptBillProps {
  justCreated?: boolean;
  billId: string;
}

const EditReceiptBill: React.FC<EditReceiptBillProps> = ({ justCreated, billId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const toast = useToast();
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
          buyPrice: parseInt(buyPrice as unknown as string, 10),
          quantity: parseInt(quantity as unknown as string, 10),
          sellPrice_1: parseInt(sellPrice_1 as unknown as string, 10),
          sellPrice_2: parseInt(sellPrice_2 as unknown as string, 10),
          sellPrice_3: parseInt(sellPrice_3 as unknown as string, 10),
          stack: parseInt(stack as unknown as string, 10),
        }))
      }
      const { data: update } = await updateBill(payload as any);
      setReceiptBillId(update._id);
      onAlertOpen();
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success', isClosable: false, },
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

  const onCustomerSelectOption = (selectedItems: Item[] & { item: { label: string; originalValue: IProduct, value: string } }) => {
    setCustomerName(selectedItems.item.label)
    setFieldValue('customer', selectedItems.item.value);
  }

  const onCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    setCustomerName(e.target.value);
    setFieldValue('customer', e.target.value as unknown as string);
  }

  const onCategorySelectOption = (selectedItems: Item[] & { item: { label: string; originalValue: IProduct, value: string } }) => {
    setCategoryName(selectedItems.item.label)
    setFieldValue('category', selectedItems.item.value);
  }

  const onCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    setCategoryName(e.target.value);
    setFieldValue('category', e.target.value as unknown as string);
  }

  return (
    <Box>
      <Button colorScheme='green' {...!justCreated && { p: 0, size: 'sm' }} fontWeight={400} borderRadius={'2xl'} onClick={onOpen}>
        <AiFillEdit /> {justCreated && t('edit')}
      </Button>
      <CustomModal
        modalProps={{ size: 'full' }}
        overlayProps={{ bg: 'blackAlpha.300', backdropFilter: 'blur(5px) hue-rotate(10deg)' }}
        contentProps={{ bg: 'white', borderRadius: 'xl', overflowWrap: 'unset', minH: '95vh', maxH: '95vh', w: '97.5vw', mt: '2.5vh', }}
        bodyProps={{ overflow: 'scroll' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('editReceiptBill')}
      >
        <Box p={4}>
          <Container maxW={'full'}>
            <CustomForm handleSubmit={handleSubmit}>
              <Container maxW={'8xl'}>
                <Flex display={'flex'} gap={5}>
                  <Box flex={1}>
                    <CustomInput
                      name="orderId"
                      label="Numero"
                      icon={BiLabel}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      value={values.orderId}
                      errorMessage={errors.orderId && touched.orderId && errors.orderId}
                    />
                  </Box>
                  <Box flex={1}>
                    <CustomInput
                      name="billDate"
                      label="Date"
                      setFieldValue={setFieldValue}
                      handleBlur={handleBlur}
                      defaultValue={values.billDate}
                      errorMessage={errors.billDate && touched.billDate && errors.billDate}
                      isDate={true}
                    />
                  </Box>
                  <Box flex={1} display={'flex'} alignItems={'flex-end'} gap={2}>
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
                  </Box>
                  <Box flex={1} display={'flex'} alignItems={'flex-end'} gap={2}>
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
                  </Box>
                </Flex>
              </Container>
              <Text fontWeight={400} fontSize={24} align={'center'} pt={5}>{t('products')}</Text>
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
              <Flex display={'flex'} gap={5} mt={5}>
                <Flex flex={1} align={'flex-end'} gap={3}>
                  <CustomInput
                    name="orderTotalHT"
                    label="Order Total (HT)"
                    icon={FcNews}
                    bg={'gray.200'}
                    outline={'transparent'}
                    _focus={{
                      bg: 'gray.200',
                      border: '1px solid',
                      borderColor: 'gray.300'
                    }}
                    isReadOnly={true}
                    value={orderTotalHT as Any}
                    errorMessage={errors.orderTotalHT && touched.orderTotalHT && errors.orderTotalHT}
                    currency='DZD'
                  />
                </Flex>
                <Flex flex={1} align={'flex-end'} gap={5}>
                  <CustomInput
                    name="orderTotalTTC"
                    label="Order Total (TTC)"
                    icon={FcNews}
                    bg={'gray.200'}
                    outline={'transparent'}
                    _focus={{
                      bg: 'gray.200',
                      border: '1px solid',
                      borderColor: 'gray.300'
                    }}
                    isReadOnly={true}
                    value={orderTotalTTC as Any}
                    errorMessage={errors.orderTotalTTC && touched.orderTotalTTC && errors.orderTotalTTC}
                    currency='DZD'
                  />
                </Flex>
                <Flex flex={1} align={'flex-end'}>
                  <CustomInput
                    flex={1}
                    name="orderDebts"
                    label="Order Debts"
                    icon={FcDebt}
                    bg={'gray.200'}
                    isReadOnly={true}
                    outline={'transparent'}
                    _focus={{
                      bg: 'gray.200',
                      border: '1px solid',
                      borderColor: 'gray.300'
                    }}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    value={orderDebts}
                    errorMessage={errors.orderDebts && touched.orderDebts && errors.orderDebts}
                    currency='DZD'
                  />
                </Flex>
                <Flex flex={1} align={'flex-end'} gap={2}>
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
                  <Button colorScheme={'green'} size={'md'} borderRadius={'xl'} px={5} onClick={setFullyPaid}>
                    <Flex gap={1} align={'center'} fontWeight={400}>
                      <BiSolidCheckCircle color={'white'} />
                      {t('fully_paid')}
                    </Flex>
                  </Button>
                </Flex>
              </Flex>
            </CustomForm>
          </Container>
        </Box>
      </CustomModal>
      <Alert
        isOpen={isAlertOpen}
        onClose={onAlertClose}
        header={t('billUpdated')}
        body={t('billUpdatedSuccessfully')}
        footer={
          <Flex gap={2}>
            <Button colorScheme='red' fontWeight={400} borderRadius={'2xl'} onClick={onAlertClose}>
              {t('close')}
            </Button>
            <Button colorScheme='blue' fontWeight={400} borderRadius={'2xl'} as={'a'} href={`/billpdf/${receiptBillId}`}>
              <AiFillFilePdf /> {t('print')}
            </Button>
            <EditReceiptBill billId={receiptBillId} justCreated />
          </Flex>
        }
      />
    </Box>
  )
}

export default EditReceiptBill