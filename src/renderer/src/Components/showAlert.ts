import Swal from 'sweetalert2';
import './showAlert.css';

interface AlertProps {
  text?: string;
  icon?: 'error' | 'success' | 'warning' | 'info' | 'question';
  position?: 'top' | 'top-start' | 'top-end' | 'top-left' | 'top-right'
  | 'center' | 'center-start' | 'center-end' | 'center-left' | 'center-right'
  | 'bottom' | 'bottom-start' | 'bottom-end' | 'bottom-left' | 'bottom-right';
  confirmButtonText?: string;
  cancelButtonText?: string;
  timer?: number;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  toast?: boolean;
}

const defaultOptions: AlertProps = {
  timer: 5000,
  text: 'Hello',
  icon: 'success',
  position: 'center',
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  showConfirmButton: true,
  showCancelButton: false,
  toast: false,
};

const showAlert = (props?: AlertProps) => {
  const {
    text, icon, position, confirmButtonText, cancelButtonText, showCancelButton, showConfirmButton, toast, timer,
  } = { ...defaultOptions, ...props };
  Swal.fire({
    text,
    toast,
    icon,
    timer,
    confirmButtonText,
    position,
    cancelButtonText,
    showConfirmButton,
    showCancelButton,
    buttonsStyling: false,
    customClass: {
      confirmButton: 'green-button',
      cancelButton: 'red-button',
    },
  });
};

export default showAlert;
