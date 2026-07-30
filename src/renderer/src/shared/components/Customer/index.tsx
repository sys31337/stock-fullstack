import { useState } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import { FaUserPlus } from 'react-icons/fa';
import CustomInput from '@web/shared/components/CustomForm/Input';
import CustomForm from '@web/shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCustomer, useUpdateCustomer } from '@web/shared/hooks/useCustomers';
import { AxiosError } from 'axios';
import showToast from '@web/shared/functions/showToast';
import { Payload } from '@web/shared/types/payload';
import Any from '@web/shared/types/any';
import CustomModal from '@web/shared/components/CustomModal';
import { ICustomer } from '@web/shared/types/customer';
import { ReactNode } from 'react';

interface CustomerModalProps {
  customer?: ICustomer;
  type?: 'Client' | 'Supplier';
  trigger?: ReactNode;
}

const CustomerModal = ({ customer, type, trigger }: CustomerModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const isEdit = !!customer;
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: updateCustomer } = useUpdateCustomer(isEdit ? customer._id : '');
  const { toast } = useToast();

  const initialValues: { [key: string]: string } = {
    fullname: customer?.fullname || '',
    address: customer?.address || '',
    phoneNumber: customer?.phoneNumber || '',
    email: customer?.email || '',
    rc: customer?.rc || '',
    nif: customer?.nif || '',
    nar: customer?.nar || '',
    type: customer?.type || type || 'Client',
  };

  const onSubmit = async (values: Payload) => {
    try {
      if (isEdit) {
        await updateCustomer(values);
      } else {
        await createCustomer(values);
      }
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
      {trigger ? (
        <span onClick={onOpen} className="cursor-pointer">{trigger}</span>
      ) : (
        <Button
          onClick={onOpen}
          className="w-fit p-0 rounded-xl bg-green-500 hover:bg-green-600 h-8 px-3"
          size="sm"
        >
          <FaUserPlus className="text-white" />
        </Button>
      )}
      <CustomModal
        modalProps={{ size: '2xl' }}
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? t('editCustomer') : t('addCustomer')}
        contentProps={{ style: { maxWidth: '42rem' } }}
      >
        <CustomForm handleSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-1">
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
          </div>
        </CustomForm>
      </CustomModal>
    </>
  )
}

export default CustomerModal
