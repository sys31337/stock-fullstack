import React, { useEffect, useMemo, useState } from 'react';
import { t } from 'i18next';
import { format } from 'date-fns';
import CustomModal from '@web/shared/components/CustomModal';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Label } from '@web/shared/components/ui/label';
import { Combobox } from '@web/shared/components/ui/combobox';
import { DatePicker } from '@web/shared/components/ui/date-picker';
import { useSalespeople } from '@web/shared/hooks/useReports';
import { useGetAllWarehouses } from '@web/shared/hooks/useWarehouses';
import { useCreateDeliveryReturn, useUpdateDeliveryReturn } from '@web/shared/hooks/useDeliveryReturns';
import { DeliveryReturnRecord } from '@web/shared/types/reports';
import { useToast } from '@web/shared/components/ui/use-toast';
import showToast from '@web/shared/functions/showToast';
import { money } from '@web/shared/functions/words';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: DeliveryReturnRecord | null;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'pending' },
  { value: 'confirmed', label: 'confirmed' },
];

const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, record }) => {
  const { data: salespeople } = useSalespeople();
  const { data: warehouses } = useGetAllWarehouses();
  const createMutation = useCreateDeliveryReturn();
  const updateMutation = useUpdateDeliveryReturn();
  const { toast } = useToast();

  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date());
  const [enteredAmount, setEnteredAmount] = useState('');
  const [returnedAmount, setReturnedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
      const p = typeof record.deliveryPerson === 'object' ? record.deliveryPerson?._id : record.deliveryPerson;
      const w = typeof record.warehouse === 'object' ? record.warehouse?._id : record.warehouse;
      setDeliveryPerson(p || '');
      setWarehouse(w || '');
      setDeliveryDate(new Date(record.deliveryDate));
      setEnteredAmount(String(record.enteredAmount));
      setReturnedAmount(String(record.returnedAmount));
      setNotes(record.notes || '');
      setStatus(record.status);
    } else {
      setDeliveryPerson('');
      setWarehouse('');
      setDeliveryDate(new Date());
      setEnteredAmount('');
      setReturnedAmount('');
      setNotes('');
      setStatus('pending');
    }
  }, [isOpen, record]);

  const personOptions = (salespeople || []).map((s) => ({ value: s._id, label: s.fullname }));
  const warehouseOptions = (warehouses || []).map((w: any) => ({ value: w._id, label: w.name || w.code }));

  const expectedLabel = useMemo(() => {
    if (!deliveryPerson) return null;
    const person = (salespeople || []).find((s) => s._id === deliveryPerson);
    return person?.fullname || null;
  }, [deliveryPerson, salespeople]);

  const validate = (): string | null => {
    if (!deliveryPerson) return t('selectSalespersonFirst');
    if (!deliveryDate) return t('selectDeliveryDate');
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      showToast(toast, { title: t('error'), description: error, status: 'error', duration: 3000 });
      return;
    }
    setSaving(true);
    const payload = {
      deliveryPerson,
      warehouse: warehouse || undefined,
      deliveryDate: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : undefined,
      enteredAmount: Number(enteredAmount || 0),
      returnedAmount: Number(returnedAmount || 0),
      notes: notes || undefined,
      status,
    };
    try {
      if (record) {
        await updateMutation.mutateAsync({ id: record._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      showToast(toast, {
        title: record ? t('updated') : t('created'),
        description: record ? t('deliveryReturnUpdated') : t('deliveryReturnCreated'),
        status: 'success',
      });
      onClose();
    } catch (err: any) {
      showToast(toast, {
        title: t('error'),
        description: err?.response?.data?.message || t('errorOccurred'),
        status: 'error',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={record ? t('editDeliveryReturn') : t('newDeliveryReturn')}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t('saving') + '...' : record ? t('update') : t('create')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        {record && (
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('expectedAmount')}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-card-foreground">{money(record.expectedAmount)} DZD</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{t('deliveryPerson')}</Label>
          <Combobox options={personOptions} value={deliveryPerson} onChange={setDeliveryPerson} placeholder={t('selectSalesperson')} loading={!salespeople} />
          {expectedLabel && !record && (
            <p className="text-xs text-muted-foreground">
              {t('expectedAutoComputed')}: {expectedLabel}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t('warehouse')}</Label>
          <Combobox options={warehouseOptions} value={warehouse} onChange={setWarehouse} placeholder={t('selectWarehouse')} loading={!warehouses} />
        </div>

        <div className="space-y-1.5">
          <Label>{t('deliveryDate')}</Label>
          <DatePicker value={deliveryDate} onSelect={setDeliveryDate} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('enteredAmount')}</Label>
            <Input
              type="number"
              min={0}
              value={enteredAmount}
              onChange={(e) => setEnteredAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('returnedAmount')}</Label>
            <Input
              type="number"
              min={0}
              value={returnedAmount}
              onChange={(e) => setReturnedAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('status')}</Label>
          <Combobox options={STATUS_OPTIONS} value={status} onChange={setStatus} placeholder={t('selectStatus')} />
        </div>

        <div className="space-y-1.5">
          <Label>{t('notes')}</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notesOptional')} />
        </div>
      </div>
    </CustomModal>
  );
};

export default ReturnModal;
