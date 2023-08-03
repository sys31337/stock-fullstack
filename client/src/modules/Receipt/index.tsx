import React, { useState } from 'react'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { t } from 'i18next'
import { useFormik } from 'formik'
import { BiLabel } from 'react-icons/bi';
import CustomForm from '@shared/components/CustomForm'
import CustomInput from '@shared/components/CustomForm/Input'
import ProductsTable from '@shared/components/CustomForm/ProductsTable';
import { randomId } from '@shared/functions/words';

const Receipt = () => {
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
  }]);

  const initialValues = {
    title: '',
    category: '',
    description: '',
    supplier: '',
    date: new Date() as unknown as string,
  }

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

        </CustomForm>
      </Container>
    </Box >
  )
}

export default Receipt