"use client"

import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import { DateRangePicker } from "./ui/date-range-picker"
import { useDebounce } from "../hooks/use-debounce"

interface DateFilterProps {
  onChange: (range: { from: Date; to: Date }) => void
  defaultRange?: { from: Date; to: Date }
  className?: string
}

export function DateFilter({ onChange, defaultRange, className }: DateFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultRange ? { from: defaultRange.from, to: defaultRange.to } : undefined,
  )

  const debouncedDateRange = useDebounce(dateRange, 500)

  useEffect(() => {
    if (debouncedDateRange?.from && debouncedDateRange?.to) {
      console.log("DateFilter - Rango cambiado:", {
        from: debouncedDateRange.from,
        to: debouncedDateRange.to,
      })
      onChange({
        from: debouncedDateRange.from,
        to: debouncedDateRange.to,
      })
    }
  }, [debouncedDateRange, onChange])

  return (
    <div className={className}>
      <DateRangePicker
        dateRange={dateRange}
        onRangeChange={(range) => {
          setDateRange({ from: range.from, to: range.to })
        }}
      />
    </div>
  )
}

