import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@web/shared/components/ui/dialog';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@web/shared/utils/cn";

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  header: string;
  body: string | React.ReactNode;
  footer: string | React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

const Alert = ({ isOpen, onClose, header, body, footer, variant = 'default' }: AlertProps) => {
  const getIcon = () => {
    switch (variant) {
      case 'success': return <CheckCircle2 className="h-16 w-16 text-green-500 mb-2" />;
      case 'error': return <AlertCircle className="h-16 w-16 text-red-500 mb-2" />;
      case 'warning': return <AlertTriangle className="h-16 w-16 text-amber-500 mb-2" />;
      case 'info': return <Info className="h-16 w-16 text-blue-500 mb-2" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className={cn("flex flex-col items-center", variant !== 'default' && "text-center")}>
          {getIcon()}
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{header}</DialogTitle>
          <DialogDescription className="py-2 text-center text-gray-500 dark:text-gray-400 text-base">
            {body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={cn("sm:justify-center w-full", variant !== 'default' && "sm:justify-center")}>
          <div className="flex gap-3 justify-center w-full">
            {footer}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Alert;
