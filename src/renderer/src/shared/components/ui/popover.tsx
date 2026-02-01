import * as React from "react"
import { cn } from "@web/shared/utils/cn"

interface PopoverContextProps {
  open: boolean
  setOpen: (open: boolean) => void
  trigger: 'click' | 'hover'
}

const PopoverContext = React.createContext<PopoverContextProps>({
  open: false,
  setOpen: () => {},
  trigger: 'click'
})

interface PopoverProps {
  children: React.ReactNode
  trigger?: 'click' | 'hover'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: 'bottom' | 'bottom-start' | 'bottom-end' // Added for compatibility, though we'll just support basic bottom for now
}

const Popover: React.FC<PopoverProps> = ({ children, trigger = 'click', open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen)
    setUncontrolledOpen(newOpen)
  }

  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setOpen(true);
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      closeTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 150); // 150ms delay
    }
  }

  return (
    <PopoverContext.Provider value={{ open, setOpen, trigger }}>
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { setOpen, trigger, open } = React.useContext(PopoverContext)

  return (
    <div
      ref={ref}
      className={cn("cursor-pointer inline-flex", className)}
      onClick={trigger === 'click' ? () => setOpen(!open) : undefined}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const { open } = React.useContext(PopoverContext)

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
        "top-full mt-2", // Simple positioning
        className
      )}
      {...props}
    />
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
