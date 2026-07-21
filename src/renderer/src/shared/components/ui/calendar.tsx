import { DayPicker } from "react-day-picker"
import { cn } from "@web/shared/utils/cn"
import { buttonVariants } from "@web/shared/components/ui/button"
import { UI, DayFlag, SelectionState, Animation } from "react-day-picker"

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
      showOutsideDays={true}
      className={cn("p-3", className)}
      classNames={{
        [UI.Root]: "flex flex-col",
        [UI.Months]: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        [UI.Month]: "space-y-4",
        [UI.MonthCaption]: "flex justify-center items-center",
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.Weekdays]: "flex",
        [UI.Weekday]: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        [UI.Week]: "flex w-full mt-2",
        [UI.Day]: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),
        [UI.Today]: "bg-accent text-accent-foreground",
        [UI.Selected]: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [UI.Outside]: "text-muted-foreground opacity-50",
        [UI.Disabled]: "text-muted-foreground opacity-50",
        [UI.Hidden]: "invisible",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        [Animation.WeeksBeforeEnter]: "",
        [Animation.WeeksBeforeExit]: "",
        [Animation.WeeksAfterEnter]: "",
        [Animation.WeeksAfterExit]: "",
        [Animation.CaptionBeforeEnter]: "",
        [Animation.CaptionBeforeExit]: "",
        [Animation.CaptionAfterEnter]: "",
        [Animation.CaptionAfterExit]: "",
      }}
      components={{
        PreviousMonthButton: ({ className: btnClassName, ...btnProps }) => (
          <button className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100", btnClassName)} {...btnProps}>
            <span className="sr-only">Previous month</span>
            &#8249;
          </button>
        ),
        NextMonthButton: ({ className: btnClassName, ...btnProps }) => (
          <button className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100", btnClassName)} {...btnProps}>
            <span className="sr-only">Next month</span>
            &#8250;
          </button>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
