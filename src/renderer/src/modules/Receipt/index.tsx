import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  useDisclosure,
  useToast,
  Stack,
  Icon,
  useColorModeValue
} from '@chakra-ui/react'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiLabel, BiSolidCheckCircle } from 'react-icons/bi';
import { FcDebt, FcNews, FcPaid } from 'react-icons/fc';
import { AiFillRightCircle, AiFillFilePdf } from 'react-icons/ai';
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
import EditReceiptBill from '@web/modules/Receipt/EditReceiptBill';
import { Payload } from '@web/shared/types/payload';

interface ReceiptProps {
  isTopBar?: boolean;
}

const Receipt: React.FC<ReceiptProps> = ({ isTopBar }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const toast = useToast();
  const { data: allCustomers, refetch } = useGetAllCustomers();
  const { data: allCategories, refetch: refetchCategories } = useGetAllCategories();
  const { data: latestBillNumber, isFetched } = useGetLatestBillNumber('BUY');
  const { mutateAsync: createBill } = useCreateBill();
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
    if (isFetched) {
      setInitialValues((prev) => ({ ...prev, orderId: latestBillNumber + 1 }))
    }
  }, [isFetched, latestBillNumber]);
  const setFullyPaid = () => setOrderPaid(orderTotalTTC);

  const onSubmit = async (values: Payload) => {
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
      const { data: newBill } = await createBill(payload);
      setReceiptBillId(newBill._id);
      onAlertOpen();
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success', isClosable: false, },
      );
      setInitialValues({
        orderId: latestBillNumber + 2, category: '', description: '', customer: '', orderTotalHT, orderTotalTTC, orderPaid, orderDebts, billDate: new Date() as unknown as string,
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
  const hoverBackground = useColorModeValue('blue.50', 'gray.900');
  return (
    <Box>
      {isTopBar ? (
        <Box
          cursor={'pointer'}
          onClick={onOpen}
          role={'group'}
          display={'block'}
          p={2}
          px={3}
          rounded={'lg'}
          _hover={{ bg: hoverBackground }}>
          <Stack direction={'row'} align={'center'}>
            <Box>
              <Text
                transition={'all .3s ease'}
                _groupHover={{ color: 'blue.500' }}
                fontWeight={500}>
                {t('newReceiptBill')}
              </Text>
              <Text fontSize={'sm'}>{t('newReceiptBillLabel')}</Text>
            </Box>
            <Flex
              transition={'all .3s ease'}
              transform={'translateX(-10px)'}
              opacity={0}
              _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
              justify={'flex-end'}
              align={'center'}
              flex={1}>
              <Icon color={'blue.400'} w={5} h={5} as={AiFillRightCircle} />
            </Flex>
          </Stack>
        </Box>
      ) : (
        <Box
          onClick={onOpen}
          cursor={'pointer'}
          w={'100%'}
          borderWidth="1px"
          borderRadius="3xl"
          pos={'relative'}
          bg={'blue.400'}
          mx={5}
          p={5}>
          <Flex
            align={'center'}
            justify={'center'}
            fontSize={'sm'}
            pos={'absolute'}
            bg={'gray.800'}
            top={-2}
            right={-2}
            p={5}
            borderRadius={'2xl'}
            h={8}
            w={8}
          >
            F1
          </Flex>
          <Flex align={'center'} gap={4}>
            <Flex
              minW={20}
              minH={20}
              align={'center'}
              justify={'center'}
              color={'white'}
              borderRadius={'2xl'}
              bg={'white'}>
              <img src="/assets/icons/buy.gif" width={64} />
            </Flex>
            <Heading size="md">{t('newReceiptBill')}</Heading>
          </Flex>
        </Box>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        overlayProps={{ bg: 'blackAlpha.300', backdropFilter: 'blur(5px) hue-rotate(10deg)' }}
        contentProps={{ bg: 'white', borderRadius: 'xl', overflowWrap: 'unset', minH: '95vh', maxH: '95vh', w: '97.5vw', mt: '2.5vh', }}
        bodyProps={{ overflow: 'scroll' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('newReceiptBill')}
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
                    <CustomInput
                      name="customer"
                      label="Customer"
                      setFieldValue={setFieldValue}
                      onFocus={() => refetch()}
                      handleBlur={handleBlur}
                      errorMessage={errors.customer && touched.customer && errors.customer}
                      selectOptions={
                        allCustomers && allCustomers.map((customer) => ({ label: customer?.fullname, value: customer?._id }))
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
                        allCategories && allCategories.map((category) => ({ label: category?.name, value: category?._id }))
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
        header={t('billCreated')}
        body={t('billCreatedSuccessfully')}
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

export default Receipt
