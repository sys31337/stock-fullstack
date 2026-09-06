import { useState, useEffect, useCallback } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import { FaUserPlus, FaViber, FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { MapPin } from 'lucide-react';
import CustomInput from '@web/shared/components/CustomForm/Input';
import CustomForm from '@web/shared/components/CustomForm';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useCreateCustomer, useUpdateCustomer } from '@web/shared/hooks/useCustomers';
import { useGetSettings } from '@web/shared/hooks/useSettings';
import { AxiosError } from 'axios';
import showToast from '@web/shared/functions/showToast';
import Any from '@web/shared/types/any';
import CustomModal from '@web/shared/components/CustomModal';
import { ICustomer } from '@web/shared/types/customer';
import { ReactNode } from 'react';
import { wilayaOptions, baladiyaOptions, getBaladiyasForWilaya } from '@web/config/wilayas';
import MapPicker, { MapPickResult } from '@web/shared/components/MapPicker';
import AddressAutocomplete from '@web/shared/components/AddressAutocomplete';
import i18next from 'i18next';
import { cn } from '@web/shared/utils/cn';

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

type Channel = 'whatsapp' | 'viber' | 'telegram';

const CHANNELS: { key: Channel; icon: React.ReactNode; color: string; labelKey: string }[] = [
  { key: 'whatsapp', icon: <FaWhatsapp className="h-4 w-4 text-green-500" />, color: 'text-green-600 border-green-300 hover:bg-green-50', labelKey: 'whatsapp' },
  { key: 'viber', icon: <FaViber className="h-4 w-4 text-purple-500" />, color: 'text-purple-600 border-purple-300 hover:bg-purple-50', labelKey: 'viber' },
  { key: 'telegram', icon: <FaTelegram className="h-4 w-4 text-blue-500" />, color: 'text-blue-600 border-blue-300 hover:bg-blue-50', labelKey: 'telegram' },
]

const CustomerModal = ({ customer, type, trigger }: CustomerModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [channels, setChannels] = useState<Record<Channel, boolean>>({ whatsapp: false, viber: false, telegram: false });

  const isEdit = !!customer;
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: updateCustomer } = useUpdateCustomer(isEdit ? customer._id : '');
  const { data: settings } = useGetSettings();
  const { toast } = useToast();

  const mapsApiKey = settings?.googleMapsApiKey || '';

  useEffect(() => {
    if (isOpen) {
      const migrated = !!customer?.hasWhatsapp && !customer?.whatsapp && !!customer?.phoneNumber;
      setChannels({
        whatsapp: !!customer?.whatsapp || migrated,
        viber: !!customer?.viber,
        telegram: !!customer?.telegram,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  const initialValues: Any = {
    type: customer?.type || type || 'Client',
    fullname: customer?.fullname || '',
    address: customer?.address || '',
    wilaya: customer?.wilaya || '',
    baladiya: customer?.baladiya || customer?.daira || '',
    phoneNumber: customer?.phoneNumber || '',
    whatsapp: customer?.whatsapp || (customer?.hasWhatsapp && !customer?.whatsapp ? customer?.phoneNumber || '' : ''),
    viber: customer?.viber || '',
    telegram: customer?.telegram || '',
    addressLat: customer?.addressLat ?? 0,
    addressLng: customer?.addressLng ?? 0,
    hasWhatsapp: customer?.hasWhatsapp ?? false,
    rc: customer?.rc || '',
    nif: customer?.nif || '',
    nis: customer?.nis || '',
    ai: customer?.ai || '',
    ...(!isEdit && { credit: '' }),
  };

  const onSubmit = async (values: Any) => {
    try {
      const payload = { ...values, hasWhatsapp: !!values.whatsapp };
      delete payload.daira;
      if (payload.whatsapp === '') delete payload.whatsapp;
      if (payload.viber === '') delete payload.viber;
      if (payload.telegram === '') delete payload.telegram;
      if (payload.baladiya === '') delete payload.baladiya;
      if (!payload.addressLat && !payload.addressLng) {
        delete payload.addressLat;
        delete payload.addressLng;
      }
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
  const baladiyas = getBaladiyasForWilaya(values.wilaya);

  const handleWilayaSelect = () => {
    setFieldValue('baladiya', '');
  };

  const getError = (field: string): string | undefined => {
    if (errors[field] && touched[field]) return String(errors[field]);
    return undefined;
  };

  const handleTypeSelect = (value: string) => {
    setFieldValue('type', value);
  };

  const toggleChannel = (key: Channel) => {
    const next = !channels[key];
    setChannels((prev) => ({ ...prev, [key]: next }));
    if (!next) setFieldValue(key, '');
  };

  const handlePlacePick = useCallback((result: MapPickResult) => {
    setFieldValue('address', result.address);
    setFieldValue('addressLat', result.lat);
    setFieldValue('addressLng', result.lng);
    if (result.wilayaCode) {
      setFieldValue('wilaya', result.wilayaCode);
    }
    if (result.baladiyaName) {
      setFieldValue('baladiya', result.baladiyaName);
    } else if (result.wilayaCode) {
      setFieldValue('baladiya', '');
    }
  }, []);

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
        </Button>
      )}
      <CustomModal
        modalProps={{ size: '2xl' }}
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? t('editCustomer') : t('addCustomer')}
        contentProps={{ className: 'max-h-[90vh] overflow-y-auto', style: { maxWidth: '46rem' } }}
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
              <AddressAutocomplete
                value={values.address as string}
                onChange={(v) => setFieldValue('address', v)}
                onPlaceSelect={handlePlacePick}
                label={t('address')}
                errorMessage={getError('address')}
              />
            </div>

            <div className="col-span-full">
              {mapsApiKey ? (
                <MapPicker
                  apiKey={mapsApiKey}
                  lat={Number(values.addressLat) || undefined}
                  lng={Number(values.addressLng) || undefined}
                  onPick={handlePlacePick}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
                  <MapPin className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{t('mapsApiKeyMissing')}</p>
                </div>
              )}
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
                onSelectChange={handleWilayaSelect}
              />
            </div>

            <div className="col-span-full sm:col-span-1">
              {baladiyas.length > 0 ? (
                <CustomInput
                  name="baladiya"
                  label={t('baladiya')}
                  value={values.baladiya}
                  setFieldValue={setFieldValue}
                  handleBlur={handleBlur}
                  errorMessage={getError('baladiya')}
                  selectOptions={baladiyaOptions(values.wilaya, lang)}
                  isSelect={true}
                />
              ) : (
                <CustomInput
                  name="baladiya"
                  label={t('baladiya')}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.baladiya}
                  errorMessage={getError('baladiya')}
                  placeholder={t('baladiyaPlaceholder')}
                />
              )}
            </div>

            <div className="col-span-full sm:col-span-1">
              <CustomInput
                name="phoneNumber"
                label={t('phoneNumber')}
                handleChange={handleChange}
                handleBlur={handleBlur}
                value={values.phoneNumber}
                errorMessage={getError('phoneNumber')}
              />
            </div>

            <div className="col-span-full sm:col-span-1 flex flex-col justify-end gap-1.5 pb-1">
              <span className="text-xs font-medium text-muted-foreground">{t('contactChannels')}</span>
              <div className="flex items-center gap-2">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel.key}
                    type="button"
                    onClick={() => toggleChannel(channel.key)}
                    className={cn(
                      'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                      channels[channel.key]
                        ? `bg-background ${channel.color} shadow-sm`
                        : 'border-border text-muted-foreground hover:bg-accent'
                    )}
                    title={t(channel.labelKey)}
                  >
                    {channel.icon}
                    <span>{t(channel.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {CHANNELS.filter((c) => channels[c.key]).map((channel) => (
              <div key={channel.key} className="col-span-full">
                <CustomInput
                  name={channel.key}
                  label={t(channel.labelKey)}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values[channel.key]}
                  errorMessage={getError(channel.key)}
                  placeholder={t('channelPlaceholder')}
                />
              </div>
            ))}

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