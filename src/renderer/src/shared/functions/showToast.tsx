interface ToastProps {
  title: string;
  description: string;
  status?: 'success' | 'info' | 'warning' | 'error' | 'loading';
  duration?: number;
  isClosable?: boolean;
}

const showToast = (toast: any, {
  title,
  description,
  status = 'success',
  duration = 1000,
}: ToastProps) => {
    let variant = "default";
    if (status === 'error') variant = "destructive";
    
    // Shadcn toast doesn't have explicit success/info/warning variants by default unless configured.
    // We'll map error to destructive, others to default.
    // We can add className for specific colors if needed.

    toast({
      title,
      description,
      variant,
      duration,
    });
};

export default showToast;
