"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "../../lib/utils"
import { Button } from ".//button"
import { Calendar } from ".//calendar"
import { Popover, PopoverContent, PopoverTrigger } from ".//popover"

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange | undefined
  onRangeChange?: (range: { from: Date; to: Date }) => void
  align?: "start" | "center" | "end"
}

export function DateRangePicker({ className, dateRange, onRangeChange, align = "start" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleDateChange = (newRange: DateRange | undefined) => {
    // Solo notificar cambios si ambas fechas están definidas y onRangeChange es una función
    if (newRange?.from && newRange?.to && typeof onRangeChange === "function") {
      onRangeChange({
        from: newRange.from,
        to: newRange.to,
      })
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              <span>Selecciona un rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={es}
            className="bg-white dark:bg-gray-800" // Fondo adecuado para ambos modos
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
