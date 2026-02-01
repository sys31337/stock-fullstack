import * as React from "react"
import { cn } from "@web/shared/utils/cn"

const Switch = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || false)
  
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked)
    }
  }, [checked])

  const toggle = () => {
    const newState = !isChecked
    setIsChecked(newState)
    onCheckedChange?.(newState)
  }

  return (
    <div
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isChecked ? "bg-primary" : "bg-input",
        className
      )}
      onClick={toggle}
    >
      <input
        type="checkbox"
        className="sr-only"
        ref={ref}
        checked={isChecked}
        readOnly
        {...props}
      />
      <div
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          isChecked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </div>
  )
})
Switch.displayName = "Switch"

export { Switch }
