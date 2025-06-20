"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface DateRangePickerProps {
  className?: string
  // Soporte para ambos métodos de uso
  dateRange?: DateRange
  onRangeChange?: (range: { from: Date; to: Date }) => void
  // Soporte para el método actual usado en la página
  from?: Date
  to?: Date
  onFromChange?: (date: Date) => void
  onToChange?: (date: Date) => void
  align?: "start" | "center" | "end"
}

export function DateRangePicker({
  className,
  dateRange,
  onRangeChange,
  from,
  to,
  onFromChange,
  onToChange,
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Usar dateRange si se proporciona, o construirlo a partir de from/to
  const range = dateRange || (from && to ? { from, to } : undefined)

  // Estado interno para manejar la selección de fechas
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(range)

  // Actualizar el estado interno cuando cambian las props
  React.useEffect(() => {
    if (dateRange) {
      setInternalRange(dateRange)
    } else if (from && to) {
      setInternalRange({ from, to })
    }
  }, [dateRange, from, to])

  // Calcular el mes actual para mostrar en el calendario
  const defaultMonth = React.useMemo(() => {
    return internalRange?.from || new Date()
  }, [internalRange?.from])

  const handleDateChange = (newRange: DateRange | undefined) => {
    // Actualizar el estado interno primero
    setInternalRange(newRange)

    if (!newRange?.from || !newRange?.to) return

    // Si se proporciona onRangeChange, usarlo
    if (typeof onRangeChange === "function") {
      onRangeChange({
        from: newRange.from,
        to: newRange.to,
      })

      // Cerrar el popover cuando se selecciona un rango completo
      setTimeout(() => setIsOpen(false), 300)
    }

    // Si se proporcionan onFromChange y onToChange, usarlos
    if (newRange.from && typeof onFromChange === "function") {
      onFromChange(newRange.from)
    }

    if (newRange.to && typeof onToChange === "function") {
      onToChange(newRange.to)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !internalRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalRange?.from ? (
              internalRange.to ? (
                <>
                  {format(internalRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(internalRange.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(internalRange.from, "dd/MM/yyyy", { locale: es })
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
            defaultMonth={defaultMonth}
            selected={internalRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={es}
            className="bg-white dark:bg-gray-800"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
