import React, { useState, useEffect } from 'react'
import { Box, Button, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiLabel, BiSolidCheckCircle } from 'react-icons/bi';
import { FcDebt, FcNews, FcPaid } from 'react-icons/fc';
import CustomForm from '@shared/components/CustomForm'
import CustomInput from '@shared/components/CustomForm/Input'
import ProductsTable from '@shared/components/CustomForm/ProductsTable';
import { price, randomId } from '@shared/functions/words';
import Any from '@shared/types/any';

const Receipt = () => {
  const [orderTotalHT, setOrderTotalHT] = useState('0.00');
  const [orderTotalTTC, setOrderTotalTTC] = useState('0.00');
  const [orderPaid, setOrderPaid] = useState('0.00');
  const [orderDebts, setOrderDebts] = useState('0.00');

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

  const initialValues = {
    title: '',
    category: '',
    description: '',
    supplier: '',
    orderTotalHT,
    orderTotalTTC,
    orderPaid,
    orderDebts,
    date: new Date() as unknown as string,
  }

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

  const setFullyPaid = () => setOrderPaid(orderTotalTTC);

  const onSubmit = (values) => {
    console.log({ ...values, products: productsValues })
  }

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues, onSubmit });

  return (
    <Box p={4}>
      <Stack spacing={4} as={Container} maxW={'6xl'} textAlign={'center'}>
        <Heading fontSize={{ base: '2xl', sm: '4xl' }} fontWeight={'bold'} color={'gray.900'}>
          {t('newReceiptBill')}
        </Heading>
      </Stack>

      <Container maxW={'full'} mt={12}>
        <CustomForm handleSubmit={handleSubmit}>
          <Container maxW={'8xl'} mt={12}>
            <Flex display={'flex'} gap={5}>
              <CustomInput
                name="title"
                label="Title"
                icon={BiLabel}
                handleChange={handleChange}
                handleBlur={handleBlur}
                defaultValue={values.title}
                errorMessage={errors.title && touched.title && errors.title}
              />
              <CustomInput
                name="date"
                label="Date"
                setFieldValue={setFieldValue}
                handleBlur={handleBlur}
                defaultValue={values.date}
                errorMessage={errors.date && touched.date && errors.date}
                isDate={true}
              />
              <CustomInput
                name="supplier"
                label="Supplier"
                setFieldValue={setFieldValue}
                handleBlur={handleBlur}
                defaultValue={values.supplier}
                errorMessage={errors.supplier && touched.supplier && errors.supplier}
                selectOptions={[
                  { value: "blue", label: "Blue" },
                  { value: "purple", label: "Purple" },
                  { value: "red", label: "Red" },
                ]}
                isSelect={true}
              />
              <CustomInput
                name="category"
                label="Category"
                setFieldValue={setFieldValue}
                handleBlur={handleBlur}
                defaultValue={values.category}
                errorMessage={errors.category && touched.category && errors.category}
                selectOptions={[
                  { value: "blue", label: "Blue" },
                  { value: "purple", label: "Purple" },
                  { value: "red", label: "Red" },
                ]}
                isSelect={true}
              />
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
                defaultValue={orderTotalHT}
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
                defaultValue={orderTotalTTC}
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
                defaultValue={orderDebts}
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
                defaultValue={price(orderPaid)}
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
    </Box >
  )
}

export default Receipt