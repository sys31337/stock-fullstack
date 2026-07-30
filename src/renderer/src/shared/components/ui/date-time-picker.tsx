import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@web/shared/utils/cn"
import { Button } from "@web/shared/components/ui/button"
import { Calendar } from "@web/shared/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@web/shared/components/ui/popover"

interface DateTimePickerProps {
  value?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function DateTimePicker({ value, onSelect, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onSelect?.(undefined)
      return
    }
    const merged = new Date(date)
    if (value) {
      merged.setHours(value.getHours(), value.getMinutes(), 0, 0)
    } else {
      merged.setHours(23, 59, 0, 0)
    }
    onSelect?.(merged)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number)
    const base = value ? new Date(value) : new Date()
    base.setHours(hours || 0, minutes || 0, 0, 0)
    onSelect?.(base)
  }

  const timeValue = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : '23:59'

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
          {value ? format(value, "dd/MM/yyyy HH:mm") : <span>{format(new Date(), "dd/MM/yyyy")} 23:59</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
        />
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="flex h-8 w-full rounded-lg border border-input bg-gray-50 px-2 text-xs font-mono focus:ring-1 focus:ring-ring outline-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateTimePicker }
