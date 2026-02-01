import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@web/shared/components/ui/dialog'
import { cn } from '@web/shared/utils/cn'

interface props {
  [key: string]: any
}

interface CustomModalProps {
  modalProps?: props;
  overlayProps?: props;
  contentProps?: props;
  bodyProps?: props;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
}

const CustomModal = ({ modalProps, overlayProps, contentProps, bodyProps, isOpen, onClose, title, children, footer, headerActions }: CustomModalProps) => {
  // Map Chakra size='full' to Tailwind classes
  const isFull = modalProps?.size === 'full';
  const { className: contentClassName, style: contentStyle, ...restContentProps } = contentProps || {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          isFull ? "w-[98vw] h-[96vh] max-w-[98vw] p-0 rounded-lg border-none flex flex-col gap-0 [&>button]:hidden" : "",
          contentClassName
        )}
        style={contentStyle}
        {...restContentProps}
      >
        <DialogHeader className="px-6 pt-6 flex-shrink-0 flex flex-row items-center justify-between space-y-0">
          {title && <DialogTitle>{title}</DialogTitle>}
          {headerActions && <div>{headerActions}</div>}
        </DialogHeader>
        <div className={cn("overflow-y-auto flex-1", isFull ? "p-0" : "px-6 py-4")} style={bodyProps}>
          {children}
        </div>
        {footer && <DialogFooter className="px-6 pb-6 flex-shrink-0">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal;
