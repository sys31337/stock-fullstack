import React, { ReactNode } from 'react';
import { Input } from '@web/shared/components/ui/input';
import { Textarea } from '@web/shared/components/ui/textarea';
import { Label } from '@web/shared/components/ui/label';
import { Combobox } from '@web/shared/components/ui/combobox';
import { cn } from '@web/shared/utils/cn';
import Any from '@web/shared/types/any';

// Define a type for the Icon that can be either a LucideIcon or a Chakra Icon (As)
// We will try to render it if it's a component.
type IconType = React.ElementType;

interface SelectOptions {
  value: string;
  label: string
}

type CustomInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: string;
  type?: string;
  handleChange?: (e: React.ChangeEvent<Any>) => void;
  setFieldValue?: (fieldName: string, value: Date | string) => void;
  handleBlur?: (e: React.FocusEvent<Any>) => void;
  defaultValue?: string | Date | number;
  value?: string | Date | number;
  errorMessage?: ReactNode;
  isTextArea?: boolean;
  isDate?: boolean;
  isSelect?: boolean;
  icon?: IconType;
  currency?: string;
  selectOptions?: SelectOptions[];
  inputSize?: 'default' | 'sm';
  loading?: boolean;
}

const CustomInput = (props: CustomInputProps) => {
  const {
    name,
    label,
    type,
    handleChange,
    handleBlur,
    defaultValue,
    value,
    errorMessage,
    isTextArea,
    isSelect,
    isDate,
    selectOptions,
    setFieldValue,
    icon: IconComp,
    currency,
    className,
    inputSize,
    loading,
    ...rest
  } = props;

  const onSelectChange = (value: string) => {
    setFieldValue && setFieldValue(name, value);
  };

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value ? new Date(e.target.value) : "";
      setFieldValue && setFieldValue(name, dateValue as Date);
  };

  // Format date for input value (YYYY-MM-DD)
  const formattedDateValue = React.useMemo(() => {
    if (!value && !defaultValue) return "";
    const v = value || defaultValue;
    if (v instanceof Date) {
        return v.toISOString().split('T')[0];
    }
    if (typeof v === 'string') {
        // Try to parse if it's a date string
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        return v;
    }
    return "";
  }, [value, defaultValue]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label
            htmlFor={name}
            className={cn("mb-2 block", errorMessage ? "text-red-500" : "text-primary")}
        >
          {label}
          {errorMessage && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
      )}

      {isSelect ? (
        <Combobox
          options={selectOptions || []}
          value={value as string}
          onChange={onSelectChange}
          placeholder={label}
          className="w-full"
          size={inputSize}
          loading={loading}
        />
      ) : isDate ? (
        <Input
            type="date"
            id={name}
            name={name}
            className="w-full rounded-xl bg-background text-foreground"
            onChange={onDateChange}
            onBlur={handleBlur}
            value={formattedDateValue}
            // defaultValue is handled by value in controlled component or we can use defaultValue if uncontrolled
            // But here we seem to mix both. Let's stick to value if provided.
        />
      ) : (
        <div className="relative">
          {IconComp && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
               {/* Render icon if it's a valid React element/component */}
               <IconComp size={20} />
            </div>
          )}

          {isTextArea ? (
             <Textarea
                id={name}
                name={name}
                className={cn(
                    "w-full rounded-xl bg-background text-foreground min-h-[100px]",
                    IconComp ? "pl-10" : "pl-3",
                    errorMessage ? "border-red-500" : "border-input"
                )}
                onChange={handleChange}
                onBlur={handleBlur}
                value={value as string | number | readonly string[] | undefined}
                defaultValue={defaultValue as string | number | readonly string[] | undefined}
                {...rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
             />
          ) : (
             <Input
                id={name}
                name={name}
                type={type || 'text'}
                className={cn(
                    "w-full rounded-xl bg-background text-foreground",
                    IconComp ? "pl-10" : "pl-3",
                    currency ? "pr-16" : "pr-3",
                    errorMessage ? "border-red-500" : "border-input"
                )}
                onChange={handleChange}
                onBlur={handleBlur}
                value={value as string | number | readonly string[] | undefined}
                defaultValue={defaultValue as string | number | readonly string[] | undefined}
                {...rest}
             />
          )}

          {currency && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="inline-flex items-center rounded-md bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                    DZD
                </span>
             </div>
          )}
        </div>
      )}
      {errorMessage && (
          <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default CustomInput;
