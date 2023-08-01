import React from 'react'
import { Box, Container, Heading, Stack } from '@chakra-ui/react'
import { t } from 'i18next'
import CustomForm from '@shared/components/CustomForm'
import { useFormik } from 'formik'
import CustomInput from '@shared/components/CustomForm/Input'

const Buy = () => {
  const initialValues = {
    title: '',
    category: '',
    description: '',
  }

  const onSubmit = () => {

  }

  const { handleSubmit, values, handleChange, errors, touched, handleBlur } = useFormik({ initialValues, onSubmit });

  return (
    <Box p={4}>
      <Stack spacing={4} as={Container} maxW={'6xl'} textAlign={'center'}>
        <Heading fontSize={{ base: '2xl', sm: '4xl' }} fontWeight={'bold'} color={'gray.900'}>
          {t('newBuyBill')}
        </Heading>
      </Stack>

      <Container maxW={'8xl'} mt={12}>
        <CustomForm handleSubmit={handleSubmit}>
          <CustomInput
            name="category"
            label="Category"
            handleChange={handleChange}
            handleBlur={handleBlur}
            defaultValue={values.category}
            errorMessage={errors.category && touched.category && errors.category}
            isSelect={true}
          >
            <option value="HYPERCALORIQUE">Hypercalorique</option>
            <option value="HYPOCALORIQUE">Hypocalorique</option>
            <option value="ALL">All</option>
          </CustomInput>

          <CustomInput
            name="description"
            label="Description"
            handleChange={handleChange}
            handleBlur={handleBlur}
            isTextArea={true}
            defaultValue={values.description}
            errorMessage={errors.description && touched.description && errors.description}
          />
          <CustomInput
            name="title"
            label="Title"
            handleChange={handleChange}
            handleBlur={handleBlur}
            defaultValue={values.title}
            errorMessage={errors.title && touched.title && errors.title}
          />
        </CustomForm>
      </Container>
    </Box>
  )
}

export default Buy