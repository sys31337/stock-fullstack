import React, { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import { t } from 'i18next';
import { Button } from '@web/shared/components/ui/button';
import { useToast } from '@web/shared/components/ui/use-toast';
import CustomModal from '@web/shared/components/CustomModal';
import CustomInput from '@web/shared/components/CustomForm/Input';
import { useCreateCharge, useUpdateCharge } from '@web/shared/hooks/useCharges';
import { ICharge, ChargeType, ChargePaymentMethod } from '@web/shared/types/charges';

interface ChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  charge?: ICharge | null;
}

const CHARGE_TYPES: { value: ChargeType; label: string }[] = [
  { value: 'salary', label: t('chargeSalary') },
  { value: 'rent', label: t('chargeRent') },
  { value: 'utility', label: t('chargeUtility') },
  { value: 'tax', label: t('chargeTax') },
  { value: 'marketing', label: t('chargeMarketing') },
  { value: 'maintenance', label: t('chargeMaintenance') },
  { value: 'other', label: t('chargeOther') },
];

const PAYMENT_METHODS: { value: ChargePaymentMethod; label: string }[] = [
  { value: 'cash', label: t('cash') },
  { value: 'bank', label: t('bank') },
  { value: 'check', label: t('check') },
  { value: 'other', label: t('other') },
];

const ChargeModal: React.FC<ChargeModalProps> = ({ isOpen, onClose, charge }) => {
  const { toast } = useToast();
  const { mutateAsync: createCharge, isLoading: isCreating } = useCreateCharge();
  const { mutateAsync: updateCharge, isLoading: isUpdating } = useUpdateCharge(charge?._id);

  const isEditing = !!charge;

  const initialValues = useMemo(() => ({
    date: charge ? new Date(charge.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: charge?.type || 'other',
    amount: charge?.amount ?? 0,
    description: charge?.description || '',
    paymentMethod: charge?.paymentMethod || 'cash',
    receiptRef: charge?.receiptRef || '',
  }), [charge]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          amount: Number(values.amount),
        };
        if (isEditing) {
          await updateCharge(payload);
        } else {
          await createCharge(payload);
        }
        toast({ title: isEditing ? t('chargeUpdated') : t('chargeCreated') });
        onClose();
      } catch (error: any) {
        toast({
          title: t('error'),
          description: error?.response?.data?.message || error.message,
          variant: 'destructive',
        });
      }
    },
  });

  useEffect(() => {
    if (!isOpen) formik.resetForm();
  }, [isOpen]);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('editCharge') : t('newCharge')}
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={() => formik.handleSubmit()} disabled={isCreating || isUpdating}>
            {isEditing ? t('update') : t('save')}
          </Button>
        </div>
      )}
    >
      <div className="space-y-4 py-2 min-w-[400px]">
        <CustomInput
          name="date"
          label={t('date')}
          isDate
          value={formik.values.date}
          setFieldValue={formik.setFieldValue}
        />
        <CustomInput
          name="type"
          label={t('type')}
          isSelect
          selectOptions={CHARGE_TYPES}
          value={formik.values.type}
          setFieldValue={formik.setFieldValue}
        />
        <CustomInput
          name="amount"
          label={t('amount')}
          type="number"
          currency="DZD"
          value={formik.values.amount}
          handleChange={formik.handleChange}
        />
        <CustomInput
          name="paymentMethod"
          label={t('paymentMethod')}
          isSelect
          selectOptions={PAYMENT_METHODS}
          value={formik.values.paymentMethod}
          setFieldValue={formik.setFieldValue}
        />
        <CustomInput
          name="receiptRef"
          label={t('receiptRef')}
          value={formik.values.receiptRef}
          handleChange={formik.handleChange}
        />
        <CustomInput
          name="description"
          label={t('description')}
          isTextArea
          value={formik.values.description}
          handleChange={formik.handleChange}
        />
      </div>
    </CustomModal>
  );
};

export default ChargeModal;
