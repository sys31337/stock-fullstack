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
import CustomForm from '@shared/components/CustomForm'
import CustomInput from '@shared/components/CustomForm/Input'
import ProductsTable from '@shared/components/CustomForm/ProductsTable';
import { price, randomId } from '@shared/functions/words';
import Any from '@shared/types/any';
import { useGetAllCustomers } from '@shared/hooks/useCustomers';
import { useGetAllCategories } from '@shared/hooks/useCategories';
import { useUpdateBill, useGetBillInfo } from '@shared/hooks/useBill';
import CustomerModal from '@shared/components/Customer';
import showToast from '@shared/functions/showToast';
import { AxiosError } from 'axios';
import CategoryModal from '@shared/components/Category';
import CustomModal from '@shared/components/CustomModal';
import Alert from '@shared/components/Alert';
import dayjs from 'dayjs';

interface EditReceiptBillProps {
  justCreated?: boolean;
  billId: string;
}

const EditReceiptBill = ({ justCreated, billId }: EditReceiptBillProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const toast = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: allCategories, refetch: refetchCategories } = useGetAllCategories();
  const { data: billInfo, isFetched } = useGetBillInfo(billId);
  const { mutateAsync: updateBill } = useUpdateBill();
  const [orderTotalHT, setOrderTotalHT] = useState('0.00');
  const [orderTotalTTC, setOrderTotalTTC] = useState('0.00');
  const [orderPaid, setOrderPaid] = useState('0.00');
  const [orderDebts, setOrderDebts] = useState('0.00');
  const [receiptBillId, setReceiptBillId] = useState('');
  const [initialValues, setInitialValues] = useState({
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
        category,
        description,
        customer,
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
      setProductsValues(products);
    }
  }, [isFetched, billInfo, isOpen]);
  const setFullyPaid = () => setOrderPaid(orderTotalTTC);

  const onSubmit = async (values) => {
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
      const { data: newBill } = await updateBill(payload);
      setReceiptBillId(newBill._id);
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

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues, onSubmit, enableReinitialize: true });
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
                      name="date"
                      label="Date"
                      setFieldValue={setFieldValue}
                      handleBlur={handleBlur}
                      defaultValue={values.billDate}
                      errorMessage={errors.billDate && touched.billDate && errors.billDate}
                      isDate={true}
                    />
                  </Box>
                  <Box flex={1} display={'flex'} alignItems={'flex-end'} gap={2}>
                    <CustomInput
                      name="customer"
                      label="Customer"
                      setFieldValue={setFieldValue}
                      onFocus={() => refetch()}
                      handleBlur={handleBlur}
                      errorMessage={errors.customer && touched.customer && errors.customer}
                      selectOptions={
                        allCustomers && [...allCustomers, { fullname: 'Unspecified', _id: 0 }].map((customer) => ({ label: customer.fullname, value: customer._id }))
                      }
                      isSelect={true}
                    />
                    <CustomerModal />
                  </Box>
                  <Box flex={1} display={'flex'} alignItems={'flex-end'} gap={2}>
                    <CustomInput
                      name="category"
                      label="Category"
                      setFieldValue={setFieldValue}
                      onFocus={() => refetchCategories()}
                      handleBlur={handleBlur}
                      defaultValue={values.category}
                      errorMessage={errors.category && touched.category && errors.category}
                      selectOptions={
                        allCategories && [...allCategories, { name: 'Unspecified', _id: 0 }].map((category) => ({ label: category.name, value: category._id }))
                      }
                      isSelect={true}
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
            <Button colorScheme='green' fontWeight={400} borderRadius={'2xl'}>
              <AiFillFilePdf /> {t('edit')}
            </Button>
          </Flex>
        }
      />
    </Box>
  )
}

export default EditReceiptBill