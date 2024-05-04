import React from 'react';
import { Box, Button, useDisclosure, useToast } from '@chakra-ui/react'
import { BiSolidCategory } from 'react-icons/bi';
import CustomInput from '@shared/components/CustomForm/Input';
import CustomForm from '@shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCategory } from '@shared/hooks/useCategories';
import { AxiosError } from 'axios';
import showToast from '@shared/functions/showToast';
import { Payload } from '@shared/types/payload';
import CustomModal from '@shared/components/CustomModal';

const CategoryModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutateAsync: createCategory } = useCreateCategory();
  const toast = useToast();
  const initialValues = {
    name: '',
    description: '',
  };
  const onSubmit = async (values: Payload) => {
    try {
      await createCategory(values);
      showToast(
        toast,
        { title: t('actionPerformed'), description: t('actionPerformedSuccessfully'), status: 'success' },
      );
      onClose();
    } catch (err) {
      const error = err as AxiosError;
      showToast(
        toast,
        { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText} - Please try again later`, status: 'error' },
      );
    }
  };
  const { handleSubmit, values, handleChange, errors, touched, handleBlur } = useFormik({ initialValues, onSubmit, enableReinitialize: true });
  return (
    <>
      <Button onClick={onOpen} w={'fit-content'} p={0} borderRadius={'xl'} size={'sm'} m={1} colorScheme={'green'}>
        <BiSolidCategory />
      </Button>
      <CustomModal
        modalProps={{ size: '2xl', isCentered: true }}
        contentProps={{ borderRadius: '2xl' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('addCategory')}
      >
        <CustomForm handleSubmit={handleSubmit}>
          <Box>
            <CustomInput
              name={'name'}
              label={t('categoryName')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.name}
              errorMessage={errors.name && touched.name && errors.name}
            />
            <CustomInput
              name={'description'}
              label={t('description')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.description}
              errorMessage={errors.description && touched.description && errors.description}
              isTextArea
            />
          </Box>
        </CustomForm>
      </CustomModal>
    </>
  )
}

export default CategoryModal