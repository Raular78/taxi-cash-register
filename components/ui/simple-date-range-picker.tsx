"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parse } from "date-fns"

interface DateRange {
  from?: Date
  to?: Date
}

interface SimpleDateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function SimpleDateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango de fechas",
  className,
}: SimpleDateRangePickerProps) {
  const [fromValue, setFromValue] = useState<string>(value?.from ? format(value.from, "yyyy-MM-dd") : "")
  const [toValue, setToValue] = useState<string>(value?.to ? format(value.to, "yyyy-MM-dd") : "")

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFromValue(val)

    if (val) {
      try {
        const fromDate = parse(val, "yyyy-MM-dd", new Date())
        onChange({ ...value, from: fromDate })
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    } else {
      onChange({ ...value, from: undefined })
    }
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setToValue(val)

    if (val) {
      try {
        const toDate = parse(val, "yyyy-MM-dd", new Date())
        onChange({ ...value, to: toDate })
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    } else {
      onChange({ ...value, to: undefined })
    }
  }

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <div className="relative flex-1">
        <Label htmlFor="date-from" className="sr-only">
          Fecha inicial
        </Label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="date-from"
            type="date"
            value={fromValue}
            onChange={handleFromChange}
            className="pl-10"
            placeholder="Fecha inicial"
          />
        </div>
      </div>
      <div className="relative flex-1">
        <Label htmlFor="date-to" className="sr-only">
          Fecha final
        </Label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="date-to"
            type="date"
            value={toValue}
            onChange={handleToChange}
            className="pl-10"
            placeholder="Fecha final"
          />
        </div>
      </div>
    </div>
  )
}
