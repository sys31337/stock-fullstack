import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
} from '@chakra-ui/react'
import Any from '@shared/types/any';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  header: string;
  body: string | JSX.Element;
  footer: string | JSX.Element;
}

const Alert = ({ isOpen, onClose, header, body, footer }: AlertProps) => {
  const cancelRef = React.useRef()
  return (
    <AlertDialog
      motionPreset='slideInBottom'
      leastDestructiveRef={cancelRef as Any}
      onClose={onClose}
      isOpen={isOpen}
      isCentered
    >
      <AlertDialogOverlay />

      <AlertDialogContent>
        <AlertDialogHeader>{header}</AlertDialogHeader>
        <AlertDialogCloseButton />
        <AlertDialogBody>
          {body}
        </AlertDialogBody>
        <AlertDialogFooter>
          {footer}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
};

export default Alert;
