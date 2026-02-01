import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@web/shared/components/ui/dialog';
import { Button } from '@web/shared/components/ui/button';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  header: string;
  body: string | React.ReactNode;
  footer: string | React.ReactNode;
}

const Alert = ({ isOpen, onClose, header, body, footer }: AlertProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
          <DialogDescription className="py-4">
            {body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Alert;
