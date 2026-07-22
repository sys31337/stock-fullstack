import { DayPicker, UI, DayFlag, SelectionState } from "react-day-picker"
import { cn } from "@web/shared/utils/cn"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        [UI.Month]: "space-y-4",
        [UI.MonthCaption]: "flex justify-center items-center relative",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.Nav]: "absolute inset-x-0 top-0 flex justify-between",
        [UI.PreviousMonthButton]: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer border-none text-foreground text-lg leading-none",
        [UI.NextMonthButton]: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer border-none text-foreground text-lg leading-none",
        [UI.MonthGrid]: "w-full",
        [UI.Weekdays]: "flex",
        [UI.Weekday]: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        [UI.Week]: "flex w-full mt-2",
        [UI.Day]: "relative p-0 text-center text-sm focus-within:z-20",
        [UI.DayButton]: "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer",
        [SelectionState.selected]: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        [DayFlag.today]: "bg-accent text-accent-foreground font-semibold",
        [DayFlag.outside]: "text-muted-foreground opacity-50",
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }