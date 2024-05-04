import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'

interface props {
  [key: string]: string | boolean
}

interface CustomModalProps {
  modalProps?: props;
  overlayProps?: props;
  contentProps?: props;
  bodyProps?: props;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: JSX.Element | JSX.Element[];
}

const CustomModal = ({ modalProps, overlayProps, contentProps, bodyProps, isOpen, onClose, title, children }: CustomModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} {...modalProps}>
      <ModalOverlay {...overlayProps} />
      <ModalContent {...contentProps}>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody {...bodyProps}>
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default CustomModal;
