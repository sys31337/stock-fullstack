import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@web/shared/utils/cn"
import { Button } from "@web/shared/components/ui/button"
import { Calendar } from "@web/shared/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@web/shared/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function DatePicker({ value, onSelect, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-8 text-xs rounded-lg bg-gray-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? format(value, "dd/MM/yyyy") : <span>{format(new Date(), "dd/MM/yyyy")}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onSelect?.(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
