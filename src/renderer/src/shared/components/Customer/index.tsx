import { useState } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import { FaUserPlus, FaWhatsapp } from 'react-icons/fa';
import { Checkbox } from '@web/shared/components/ui/checkbox';
import CustomInput from '@web/shared/components/CustomForm/Input';
import CustomForm from '@web/shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCustomer, useUpdateCustomer } from '@web/shared/hooks/useCustomers';
import { AxiosError } from 'axios';
import showToast from '@web/shared/functions/showToast';
import Any from '@web/shared/types/any';
import CustomModal from '@web/shared/components/CustomModal';
import { ICustomer } from '@web/shared/types/customer';
import { ReactNode } from 'react';
import { wilayaOptions } from '@web/config/wilayas';
import i18next from 'i18next';

interface CustomerModalProps {
  customer?: ICustomer;
  type?: 'Client' | 'Supplier';
  trigger?: ReactNode;
}

const SectionTitle = ({ label }: { label: string }) => (
  <div className="col-span-full flex items-center gap-2 my-1">
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="h-px flex-1 bg-border/60" />
  </div>
)

const CustomerModal = ({ customer, type, trigger }: CustomerModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const isEdit = !!customer;
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: updateCustomer } = useUpdateCustomer(isEdit ? customer._id : '');
  const { toast } = useToast();

  const initialValues: Any = {
    type: customer?.type || type || 'Client',
    fullname: customer?.fullname || '',
    address: customer?.address || '',
    wilaya: customer?.wilaya || '',
    phoneNumber: customer?.phoneNumber || '',
    hasWhatsapp: customer?.hasWhatsapp || false,
    rc: customer?.rc || '',
    nif: customer?.nif || '',
    nis: customer?.nis || '',
    ai: customer?.ai || '',
    ...(!isEdit && { credit: '' }),
  };

  const onSubmit = async (values: Any) => {
    try {
      const payload = { ...values };
      if (isEdit) {
        delete payload.credit;
        await updateCustomer(payload);
      } else {
        if (payload.credit === '' || payload.credit === undefined) {
          delete payload.credit;
        }
        await createCustomer(payload);
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

  const validate = (values: Any) => {
    const errors: { [key: string]: string } = {};
    if (!values.fullname || !String(values.fullname).trim()) {
      errors.fullname = t('requiredField');
    }
    return errors;
  };

  const { handleSubmit, values, handleChange, errors, touched, handleBlur, setFieldValue } = useFormik({
    initialValues,
    onSubmit,
    validate,
    enableReinitialize: true,
  });

  const lang = i18next.language || 'fr';
  const options = wilayaOptions(lang);

  const getError = (field: string): string | undefined => {
    if (errors[field] && touched[field]) return String(errors[field]);
    return undefined;
  };

  const handleTypeSelect = (value: string) => {
    setFieldValue('type', value);
  };

  return (
    <>
      {trigger ? (
        <span onClick={onOpen} className="cursor-pointer">{trigger}</span>
      ) : (
        <Button
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 text-white h-8 px-3"
          size="sm"
        >
          <FaUserPlus className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-medium">{t('addCustomer')}</span>
        </Button>
      )}
      <CustomModal
        modalProps={{ size: '2xl' }}
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? t('editCustomer') : t('addCustomer')}
        contentProps={{ style: { maxWidth: '46rem' } }}
      >
        <CustomForm handleSubmit={handleSubmit} hideSubmit className="text-left p-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-full flex items-center justify-center gap-2 p-1 rounded-xl bg-muted/40 border border-border/50">
              {['Client', 'Supplier'].map((option) => {
                const active = values.type === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleTypeSelect(option)}
                    className={[
                      'flex-1 rounded-lg py-1.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    ].join(' ')}
                  >
                    {t(option === 'Client' ? 'client' : 'supplier')}
                  </button>
                )
              })}
            </div>

            <SectionTitle label={t('generalInfo')} />

            <div className="col-span-full">
              <CustomInput
                name="fullname"
                label={t('fullname')}
                handleChange={handleChange}
                handleBlur={handleBlur}
                value={values.fullname}
                errorMessage={getError('fullname')}
              />
            </div>

            <div className="col-span-full">
              <CustomInput
                name="address"
                label={t('address')}
                handleChange={handleChange}
                handleBlur={handleBlur}
                value={values.address}
                errorMessage={getError('address')}
              />
            </div>

            <div className="col-span-full sm:col-span-1">
              <CustomInput
                name="wilaya"
                label={t('wilaya')}
                value={values.wilaya}
                setFieldValue={setFieldValue}
                handleBlur={handleBlur}
                errorMessage={getError('wilaya')}
                selectOptions={options}
                isSelect={true}
              />
            </div>

            <div className="col-span-full sm:col-span-1 flex flex-col justify-end gap-2">
              <CustomInput
                name="phoneNumber"
                label={t('phoneNumber')}
                handleChange={handleChange}
                handleBlur={handleBlur}
                value={values.phoneNumber}
                errorMessage={getError('phoneNumber')}
              />
              <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
                <Checkbox
                  checked={!!values.hasWhatsapp}
                  onCheckedChange={(checked) => setFieldValue('hasWhatsapp', !!checked)}
                />
                <FaWhatsapp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{t('whatsapp')}</span>
              </label>
            </div>

            <SectionTitle label={t('legalInfo')} />

            <CustomInput
              name="rc"
              label={t('rc')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.rc}
              errorMessage={getError('rc')}
            />
            <CustomInput
              name="nif"
              label={t('nif')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.nif}
              errorMessage={getError('nif')}
            />
            <CustomInput
              name="nis"
              label={t('nis')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.nis}
              errorMessage={getError('nis')}
            />
            <CustomInput
              name="ai"
              label={t('ai')}
              handleChange={handleChange}
              handleBlur={handleBlur}
              value={values.ai}
              errorMessage={getError('ai')}
            />

            {!isEdit && (
              <>
                <SectionTitle label={t('financialInfo')} />
                <div className="col-span-full">
                  <CustomInput
                    name="credit"
                    label={t('initialCredit')}
                    type="number"
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    value={values.credit}
                    errorMessage={getError('credit')}
                    currency="DZD"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              {t('submit')}
            </Button>
          </div>
        </CustomForm>
      </CustomModal>
    </>
  )
}

export default CustomerModal
