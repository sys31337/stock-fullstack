import * as React from "react"
import { cn } from "@web/shared/utils/cn"
import { Check, ChevronsUpDown } from "lucide-react"

// Since we don't have Radix Popover/Command installed, we will build a simpler version
// that mimics the API but uses standard HTML/React.

interface Option {
  value: string
  label: string
}

interface ComboboxProps {
  options: Option[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function Combobox({ options, value, onChange, placeholder = "Select option...", className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      )

  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selectedLabel || <span className="text-muted-foreground">{placeholder}</span>}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-[200px]">
             {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm">No option found.</div>
             ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      value === option.value ? "bg-accent" : ""
                    )}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                      setQuery("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                ))
             )}
          </div>
        </div>
      )}
    </div>
  )
}
