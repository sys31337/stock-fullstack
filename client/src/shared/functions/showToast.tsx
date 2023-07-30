import { ToastPosition } from '@chakra-ui/react';

interface ToastProps {
  title: string;
  description: string;
  status?: 'success' | 'info' | 'warning' | 'error' | 'loading';
  position?: ToastPosition;
  duration?: number;
  isClosable?: boolean;
}

const showToast = (toast: (p: ToastProps) => void, {
  title,
  description,
  status = 'success',
  position = 'top-right',
  duration = 9000,
  isClosable = true,
}: ToastProps) => toast({
  title,
  description,
  status,
  position,
  duration,
  isClosable,
});

export default showToast;