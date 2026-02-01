import React, { useState } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import { BiSolidCategory } from 'react-icons/bi';
import CustomInput from '@web/shared/components/CustomForm/Input';
import CustomForm from '@web/shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCategory } from '@web/shared/hooks/useCategories';
import { AxiosError } from 'axios';
import showToast from '@web/shared/functions/showToast';
import { Payload } from '@web/shared/types/payload';
import CustomModal from '@web/shared/components/CustomModal';

const CategoryModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const { mutateAsync: createCategory } = useCreateCategory();
  const { toast } = useToast();
  
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
      <Button 
        onClick={onOpen} 
        className="w-fit p-0 rounded-xl m-1 bg-green-500 hover:bg-green-600 h-8 px-3"
        size="sm"
      >
        <BiSolidCategory className="text-white" />
      </Button>
      <CustomModal
        modalProps={{ size: '2xl' }}
        contentProps={{ style: { maxWidth: '42rem' } }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('addCategory')}
      >
        <CustomForm handleSubmit={handleSubmit}>
          <div>
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
          </div>
        </CustomForm>
      </CustomModal>
    </>
  )
}

export default CategoryModal
