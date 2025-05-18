"use client"

import type React from "react"

import { useState } from "react"
import { Input } from ".//input"
import { Label } from ".//label"
import { CalendarIcon } from "lucide-react"
import { cn } from "..\..\lib\utils"
import { format, parse } from "date-fns"

interface SimpleDatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function SimpleDatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
}: SimpleDatePickerProps) {
  const [inputValue, setInputValue] = useState<string>(value ? format(value, "yyyy-MM-dd") : "")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    if (val) {
      try {
        const date = parse(val, "yyyy-MM-dd", new Date())
        onChange(date)
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    } else {
      onChange(undefined)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="date-picker" className="sr-only">
        {placeholder}
      </Label>
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id="date-picker"
          type="date"
          value={inputValue}
          onChange={handleChange}
          className="pl-10"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
