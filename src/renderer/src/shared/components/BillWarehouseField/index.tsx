import { useEffect } from 'react';
import { t } from 'i18next';
import CustomInput from '@web/shared/components/CustomForm/Input';
import { Label } from '@web/shared/components/ui/label';
import { useAvailableWarehouses } from '@web/shared/hooks/useWarehouses';
import { Warehouse } from 'lucide-react';

interface BillWarehouseFieldProps {
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  value?: string;
  inputSize?: 'sm' | 'default';
  prefill?: boolean;
}

const BillWarehouseField = ({ setFieldValue, value, inputSize = 'sm', prefill = true }: BillWarehouseFieldProps) => {
  const { allowed, defaultId, isLoading } = useAvailableWarehouses();

  useEffect(() => {
    if (!prefill || isLoading || value) return;
    const next = allowed.length === 1 ? allowed[0]._id : defaultId;
    if (next) setFieldValue('warehouse', next);
  }, [prefill, isLoading, allowed, defaultId, value, setFieldValue]);

  if (isLoading || allowed.length === 0) {
    return null;
  }

  if (allowed.length === 1) {
    return (
      <div>
        <Label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('warehouse')}</Label>
        <div className="flex items-center gap-2 h-8 rounded-lg border border-input bg-muted/50 px-2.5 text-xs text-muted-foreground">
          <Warehouse className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{allowed[0].name} ({allowed[0].code})</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('warehouse')}</Label>
      <CustomInput
        name="warehouse"
        setFieldValue={setFieldValue}
        value={value}
        selectOptions={allowed.map((w: any) => ({ label: `${w.name} (${w.code})`, value: w._id }))}
        isSelect={true}
        inputSize={inputSize}
        className="[&_>div>div]:rounded-lg"
      />
    </div>
  );
};

export default BillWarehouseField;
