import React from 'react';
import { Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, useDisclosure, useToast } from '@chakra-ui/react'
import { FaUserPlus } from 'react-icons/fa';
import CustomInput from '@shared/components/CustomForm/Input';
import CustomForm from '@shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCategory } from '@shared/hooks/useCategories';
import { AxiosError } from 'axios';
import showToast from '@shared/functions/showToast';
import { Payload } from '@shared/types/payload';

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
        <FaUserPlus />
      </Button>
      <Modal onClose={onClose} size={'2xl'} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={'2xl'}>
          <ModalHeader>{t('addCategory')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default CategoryModal