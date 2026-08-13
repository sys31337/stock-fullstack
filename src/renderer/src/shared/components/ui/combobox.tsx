import * as React from "react"
import { cn } from "@web/shared/utils/cn"
import { Check, ChevronsUpDown } from "lucide-react"
import { t } from "i18next"

interface Option {
  value: string
  label: string
  group?: string
}

interface ComboboxProps {
  options: Option[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  size?: 'default' | 'sm'
  loading?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className,
  size = 'default',
  loading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [internalValue, setInternalValue] = React.useState<string>(value ?? "")
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (value !== undefined && value !== null) setInternalValue(value)
  }, [value])

  const displayValue = value !== undefined && value !== null ? value : internalValue
  const selectedLabel = options.find((option) => option.value === displayValue)?.label

  const toggleOpen = () => {
    if (!open) setQuery("")
    setOpen(!open)
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (target instanceof Element && target.closest('[data-toast-viewport]')) return
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  const filteredOptions = query === ""
    ? options
    : options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))

  const select = (optionValue: string) => {
    setInternalValue(optionValue)
    onChange(optionValue)
    setOpen(false)
    setQuery("")
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        onClick={toggleOpen}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          size === 'sm' ? "h-8 text-xs py-0" : "h-10",
          displayValue ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {selectedLabel || <span>{placeholder}</span>}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div className="absolute z-[80] mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t('search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-[200px]">
            {filteredOptions.length === 0 ? (
              loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">{t('loading')}...</div>
              ) : (
                <div className="py-6 text-center text-sm">{t('noOptionFound')}</div>
              )
            ) : (
              filteredOptions.map((option, idx) => {
                const prevGroup = idx > 0 ? filteredOptions[idx - 1].group : undefined
                const showGroupHeader = option.group && option.group !== prevGroup
                return (
                  <React.Fragment key={option.value}>
                    {showGroupHeader && (
                      <div className="px-2 py-1.5 mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border">
                        {option.group}
                      </div>
                    )}
                    <div
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        displayValue === option.value ? "bg-accent" : ""
                      )}
                      onClick={() => select(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          displayValue === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </div>
                  </React.Fragment>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
