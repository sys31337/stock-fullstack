import React from 'react';
import { t } from 'i18next';
import { Button } from '@web/shared/components/ui/button';
import { cn } from '@web/shared/utils/cn';

interface CustomFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  handleSubmit: (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
  children: React.ReactNode;
}

const CustomForm = (props: CustomFormProps) => {
  const { handleSubmit, children, className, ...rest } = props
  return (
    <form onSubmit={handleSubmit} className={cn("text-center", className)} {...rest}>
      {children}
      <Button
        variant="default"
        className="my-5 px-20 rounded-full bg-green-500 hover:bg-green-600 text-white"
        size="lg"
        type="submit"
      >
        {t('submit')}
      </Button>
    </form>
  )
}

export default CustomForm
