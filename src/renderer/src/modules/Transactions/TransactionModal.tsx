import { useState, ReactNode } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import { t } from 'i18next';
import { useFormik } from 'formik';
import CustomForm from '@web/shared/components/CustomForm';
import CustomInput from '@web/shared/components/CustomForm/Input';
import CustomModal from '@web/shared/components/CustomModal';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useCreateTransaction } from '@web/shared/hooks/useTransactions';
import { ICustomer } from '@web/shared/types/customer';
import { Payload } from '@web/shared/types/payload';
import { AxiosError } from 'axios';
import showToast from '@web/shared/functions/showToast';
import { Send } from 'lucide-react';
import { defaultId } from '@web/config';

interface TransactionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  customer?: ICustomer;
  trigger?: ReactNode;
}

const TransactionModal = ({ isOpen, onClose, customer, trigger }: TransactionModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const handleOpen = () => setInternalOpen(true);
  const handleClose = () => (isControlled ? onClose?.() : setInternalOpen(false));

  const { mutateAsync: createTransaction } = useCreateTransaction();
  const { data: allCustomers, refetch, isLoading: customersLoading } = useGetAllCustomers();
  const { toast } = useToast();

  const initialValues: { [key: string]: string } = {
    customer: customer?._id || '',
    addedAmount: '',
    description: '',
  };

  const validate = (values: Payload) => {
    const errors: { [key: string]: string } = {};
    if (!values.customer) {
      errors.customer = t('requiredField');
    }
    const amount = Number(values.addedAmount);
    if (!values.addedAmount || Number.isNaN(amount) || amount <= 0) {
      errors.addedAmount = t('requiredField');
    }
    return errors;
  };

  const onSubmit = async (values: Payload) => {
    try {
      await createTransaction({
        customer: values.customer,
        type: 'FUND',
        addedAmount: Number(values.addedAmount),
        description: values.description,
      });
      showToast(
        toast,
        { title: t('transferCreated'), description: t('transferCreatedSuccessfully'), status: 'success' },
      );
      handleClose();
      refetch();
    } catch (err) {
      const error = err as AxiosError;
      showToast(
        toast,
        { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText} - Please try again later`, status: 'error' },
      );
    }
  };

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue, resetForm } = useFormik({ initialValues, validate, onSubmit, enableReinitialize: true });

  const selectedCustomer = allCustomers?.find((c: ICustomer) => c._id === values.customer) as ICustomer | undefined;
  const selectOptions = allCustomers
    ?.filter((c: ICustomer) => c?._id !== defaultId)
    .map((c: ICustomer) => ({
      label: c?.fullname,
      value: c?._id,
      group: c?.type === 'Client' ? t('clients') : t('suppliers'),
    })) || [];

  const handleModalClose = () => {
    resetForm();
    handleClose();
  };

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="cursor-pointer">{trigger}</span>
      ) : isControlled ? null : (
        <Button
          onClick={handleOpen}
          className="w-fit rounded-xl bg-green-500 hover:bg-green-600 h-8 px-3"
          size="sm"
        >
          <Send className="text-white h-3.5 w-3.5" />
          <span className="text-xs font-medium text-white">{t('newTransfer')}</span>
        </Button>
      )}
      <CustomModal
        modalProps={{ size: 'lg' }}
        isOpen={open}
        onClose={handleModalClose}
        title={t('newTransfer')}
        contentProps={{ style: { maxWidth: '36rem' } }}
      >
        <CustomForm handleSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-1">
            <CustomInput
              name="customer"
              label={t('customer')}
              setFieldValue={setFieldValue}
              handleBlur={handleBlur}
              errorMessage={errors.customer && touched.customer && errors.customer}
              selectOptions={selectOptions}
              value={values.customer}
              isSelect={true}
              loading={customersLoading}
            />
            <CustomInput
              name="addedAmount"
              label={t('amount')}
              type="number"
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.addedAmount}
              errorMessage={errors.addedAmount && touched.addedAmount && errors.addedAmount}
              currency="DZD"
            />
            <CustomInput
              name="description"
              label={t('description')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.description}
              isTextArea={true}
            />
          </div>
          {selectedCustomer && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('currentCredit')}: {Number(selectedCustomer.credit || 0)}
            </p>
          )}
        </CustomForm>
      </CustomModal>
    </>
  )
}

export default TransactionModal
