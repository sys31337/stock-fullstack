import * as React from "react"

import { cn } from "@web/shared/utils/cn"

// Since we don't have Radix installed successfully, we will make a dummy Tooltip or a simple one.
// But wait, user said "Continue" after I failed to install Radix.
// I should probably create a simple CSS-based Tooltip or just a pass-through if I can't easily build it.
// Or I can build a simple state-based tooltip.

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string | React.ReactNode }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {content}
        </div>
      )}
    </div>
  )
}

const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
