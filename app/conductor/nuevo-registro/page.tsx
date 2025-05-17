"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon, ChevronLeft } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function NuevoRegistroPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isJornadaPartida, setIsJornadaPartida] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date(),
    startKm: 0,
    endKm: 0,
    cashAmount: 0,
    cardAmount: 0,
    invoiceAmount: 0,
    otherAmount: 0,
    fuelExpense: 0,
    otherExpenses: 0,
    otherExpenseNotes: "",
    notes: "",
    shiftStart: "",
    shiftEnd: "",
    // Campos para jornada partida
    shiftBreakStart: "",
    shiftBreakEnd: "",
    imageUrl: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Convertir a número si es un campo numérico
    if (
      [
        "startKm",
        "endKm",
        "cashAmount",
        "cardAmount",
        "invoiceAmount",
        "otherAmount",
        "fuelExpense",
        "otherExpenses",
      ].includes(name)
    ) {
      setFormData({
        ...formData,
        [name]: value === "" ? 0 : Number.parseFloat(value),
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        date,
      })
    }
  }

  const calculateTotals = () => {
    const totalKm = formData.endKm - formData.startKm
    const totalAmount = formData.cashAmount + formData.cardAmount + formData.invoiceAmount + formData.otherAmount
    const totalExpenses = formData.fuelExpense + formData.otherExpenses
    const netAmount = totalAmount - totalExpenses
    const driverCommission = netAmount * 0.5 // 50% por defecto

    return {
      totalKm,
      totalAmount,
      totalExpenses,
      netAmount,
      driverCommission,
    }
  }

  // Calcular horas trabajadas
  const calculateWorkHours = () => {
    if (!formData.shiftStart || !formData.shiftEnd) return "No disponible"

    try {
      const [startHour, startMinute] = formData.shiftStart.split(":").map(Number)
      const [endHour, endMinute] = formData.shiftEnd.split(":").map(Number)

      let totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)

      // Si es jornada partida, restar el tiempo de descanso
      if (isJornadaPartida && formData.shiftBreakStart && formData.shiftBreakEnd) {
        const [breakStartHour, breakStartMinute] = formData.shiftBreakStart.split(":").map(Number)
        const [breakEndHour, breakEndMinute] = formData.shiftBreakEnd.split(":").map(Number)

        const breakMinutes = breakEndHour * 60 + breakEndMinute - (breakStartHour * 60 + breakStartMinute)
        totalMinutes -= breakMinutes
      }

      // Si el resultado es negativo (por ejemplo, si la jornada cruza la medianoche)
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60
      }

      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      return `${hours}h ${minutes}min`
    } catch (error) {
      return "Error en cálculo"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { totalKm, totalAmount, netAmount, driverCommission } = calculateTotals()

    // Preparar datos para enviar
    const dataToSend = {
      ...formData,
      totalKm,
      totalAmount,
      netAmount,
      driverCommission,
      // Si es jornada partida, incluir los datos de descanso
      ...(isJornadaPartida && {
        shiftBreakStart: formData.shiftBreakStart,
        shiftBreakEnd: formData.shiftBreakEnd,
      }),
    }

    try {
      const response = await fetch("/api/daily-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear el registro")
      }

      toast({
        title: "Registro creado",
        description: "El registro diario se ha creado correctamente",
      })

      router.push("/conductor/registros-diarios")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el registro",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totals = calculateTotals()
  const workHours = calculateWorkHours()

  if (status === "loading") {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/conductor")} className="mr-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Registro Diario</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Fecha, horario y kilómetros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="bg-popover p-3">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={handleDateChange}
                        initialFocus
                        className="bg-background border rounded-md"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Horario */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Horario de Jornada</Label>
                  <div className="flex items-center space-x-2">
                    {/* Usando un checkbox HTML nativo en lugar del componente Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="jornada-partida"
                        checked={isJornadaPartida}
                        onChange={(e) => setIsJornadaPartida(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="jornada-partida" className="ml-2 cursor-pointer">
                        Jornada Partida
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shiftStart">Hora inicio</Label>
                    <div className="flex">
                      <Input
                        id="shiftStart"
                        name="shiftStart"
                        type="time"
                        value={formData.shiftStart}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shiftEnd">Hora fin</Label>
                    <Input
                      id="shiftEnd"
                      name="shiftEnd"
                      type="time"
                      value={formData.shiftEnd}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {isJornadaPartida && (
                  <div className="border-t pt-4 mt-2">
                    <Label className="mb-2 block">Descanso</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shiftBreakStart">Inicio descanso</Label>
                        <Input
                          id="shiftBreakStart"
                          name="shiftBreakStart"
                          type="time"
                          value={formData.shiftBreakStart}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shiftBreakEnd">Fin descanso</Label>
                        <Input
                          id="shiftBreakEnd"
                          name="shiftBreakEnd"
                          type="time"
                          value={formData.shiftBreakEnd}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.shiftStart && formData.shiftEnd && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <div className="flex justify-between">
                      <span>Tiempo trabajado:</span>
                      <span className="font-medium">{workHours}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Kilómetros */}
              <div className="space-y-2">
                <Label>Kilómetros</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startKm">Inicio</Label>
                    <Input
                      id="startKm"
                      name="startKm"
                      type="number"
                      value={formData.startKm}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endKm">Fin</Label>
                    <Input
                      id="endKm"
                      name="endKm"
                      type="number"
                      value={formData.endKm}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalKm">Total</Label>
                    <Input id="totalKm" type="number" value={totals.totalKm} disabled className="bg-muted" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos</CardTitle>
              <CardDescription>Ingresos por método de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cashAmount">Efectivo</Label>
                  <Input
                    id="cashAmount"
                    name="cashAmount"
                    type="number"
                    step="0.01"
                    value={formData.cashAmount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardAmount">Tarjeta</Label>
                  <Input
                    id="cardAmount"
                    name="cardAmount"
                    type="number"
                    step="0.01"
                    value={formData.cardAmount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceAmount">Factura</Label>
                  <Input
                    id="invoiceAmount"
                    name="invoiceAmount"
                    type="number"
                    step="0.01"
                    value={formData.invoiceAmount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherAmount">Otros</Label>
                  <Input
                    id="otherAmount"
                    name="otherAmount"
                    type="number"
                    step="0.01"
                    value={formData.otherAmount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Total Ingresos:</span>
                  <span className="font-bold text-lg">{totals.totalAmount.toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos</CardTitle>
              <CardDescription>Gastos del día</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelExpense">Combustible</Label>
                  <Input
                    id="fuelExpense"
                    name="fuelExpense"
                    type="number"
                    step="0.01"
                    value={formData.fuelExpense}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherExpenses">Otros gastos</Label>
                  <Input
                    id="otherExpenses"
                    name="otherExpenses"
                    type="number"
                    step="0.01"
                    value={formData.otherExpenses}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherExpenseNotes">Notas de gastos</Label>
                <Textarea
                  id="otherExpenseNotes"
                  name="otherExpenseNotes"
                  value={formData.otherExpenseNotes}
                  onChange={handleInputChange}
                  placeholder="Detalle de otros gastos..."
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Total Gastos:</span>
                  <span className="font-bold text-lg">{totals.totalExpenses.toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Resumen financiero del día</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Ingresos:</span>
                  <span>{totals.totalAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Gastos:</span>
                  <span>{totals.totalExpenses.toFixed(2)} €</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Importe Neto:</span>
                  <span>{totals.netAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Comisión Conductor (50%):</span>
                  <span>{totals.driverCommission.toFixed(2)} €</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Notas adicionales sobre la jornada..."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/conductor/registros-diarios")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Registro"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
