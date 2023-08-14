import React from 'react';
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, useDisclosure, useToast } from '@chakra-ui/react'
import { FaUserPlus } from 'react-icons/fa';
import CustomInput from '@shared/components/CustomForm/Input';
import CustomForm from '@shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCustomer } from './api/useCustomer';
import { AxiosError } from 'axios';
import showToast from '@shared/functions/showToast';
import { Payload } from '@shared/types/payload';
import Any from '@shared/types/any';

const CustomerModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const toast = useToast();
  const initialValues = {
    fullname: '',
    address: '',
    phoneNumber: '',
    email: '',
    rc: '',
    nif: '',
    nar: '',
    type: 'Client',
  };
  const onSubmit = async (values: Payload) => {
    try {
      await createCustomer(values);
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
  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({ initialValues, onSubmit, enableReinitialize: true });
  const selectOptions = [{ label: 'Client', value: 'Client' }, { label: 'Supplier', value: 'Supplier' }];
  return (
    <>
      <Button onClick={onOpen} w={'fit-content'} p={0} borderRadius={'full'} colorScheme={'green'}>
        <FaUserPlus />
      </Button>
      <Modal onClose={onClose} size={'2xl'} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('addCustomer')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CustomForm handleSubmit={handleSubmit}>
              <SimpleGrid columns={2} spacing={1}>
                <CustomInput
                  name="type"
                  label="Type"
                  setFieldValue={setFieldValue}
                  handleBlur={handleBlur}
                  errorMessage={errors.type && touched.type && errors.type}
                  selectOptions={selectOptions}
                  defaultValue={selectOptions && selectOptions[0] as Any}
                  isSelect={true}
                />
                {['fullname', 'address', 'phoneNumber', 'email', 'rc', 'nif', 'nar'].map((field, k) => (
                  <CustomInput
                    key={k}
                    name={field}
                    label={t(field)}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    value={values[field]}
                    errorMessage={errors[field] && touched[field] && errors[field]}
                  />
                ))}
              </SimpleGrid>
            </CustomForm>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default CustomerModal