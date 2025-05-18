"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { toast } from "../../../components/ui/use-toast"
import { UploadIcon as FileUpload, ArrowLeft } from "lucide-react"
import BackToAdminButton from "../../../components/BackToAdminButton"
import { useEffect } from "react"

interface User {
  id: number
  username: string
}

export default function NuevoRegistroPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [drivers, setDrivers] = useState<User[]>([])
  const [newRecord, setNewRecord] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    driverId: "",
    startKm: "",
    endKm: "",
    cashAmount: "",
    cardAmount: "",
    invoiceAmount: "",
    otherAmount: "",
    fuelExpense: "",
    otherExpenses: "",
    otherExpenseNotes: "",
    shiftStart: "",
    shiftEnd: "",
    notes: "",
    imageUrl: "",
  })

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      // Usar el nuevo endpoint con un timestamp para evitar la caché
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/drivers?t=${timestamp}`)

      if (!response.ok) {
        throw new Error(`Error al obtener conductores: ${response.status}`)
      }

      const data = await response.json()

      // Verificar explícitamente que data es un array
      if (Array.isArray(data) && data.length > 0) {
        console.log("Conductores obtenidos correctamente:", data)
        setDrivers(data)
      } else {
        console.warn("Usando conductores de respaldo porque la API devolvió un array vacío o un formato incorrecto")
        setDrivers([
          { id: 1, username: "Conductor 1" },
          { id: 2, username: "Conductor 2" },
        ])
      }
    } catch (error) {
      console.error("Error al obtener conductores, usando datos de respaldo:", error)
      setDrivers([
        { id: 1, username: "Conductor 1" },
        { id: 2, username: "Conductor 2" },
      ])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewRecord((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewRecord((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateTotals = () => {
    const startKm = Number.parseInt(newRecord.startKm) || 0
    const endKm = Number.parseInt(newRecord.endKm) || 0
    const totalKm = endKm - startKm

    const cashAmount = Number.parseFloat(newRecord.cashAmount) || 0
    const cardAmount = Number.parseFloat(newRecord.cardAmount) || 0
    const invoiceAmount = Number.parseFloat(newRecord.invoiceAmount) || 0
    const otherAmount = Number.parseFloat(newRecord.otherAmount) || 0
    const totalAmount = cashAmount + cardAmount + invoiceAmount + otherAmount

    const fuelExpense = Number.parseFloat(newRecord.fuelExpense) || 0
    const otherExpenses = Number.parseFloat(newRecord.otherExpenses) || 0
    const totalExpenses = fuelExpense + otherExpenses

    // Asumimos comisión del 35% sobre el total después de gastos
    const driverCommission = (totalAmount - totalExpenses) * 0.35
    const netAmount = totalAmount - totalExpenses - driverCommission

    return {
      totalKm,
      totalAmount,
      totalExpenses,
      driverCommission,
      netAmount,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRecord.driverId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un conductor",
        variant: "destructive",
      })
      return
    }

    const { totalKm, totalAmount, driverCommission, netAmount } = calculateTotals()

    const recordData = {
      ...newRecord,
      driverId: Number.parseInt(newRecord.driverId),
      startKm: Number.parseInt(newRecord.startKm),
      endKm: Number.parseInt(newRecord.endKm),
      totalKm,
      cashAmount: Number.parseFloat(newRecord.cashAmount) || 0,
      cardAmount: Number.parseFloat(newRecord.cardAmount) || 0,
      invoiceAmount: Number.parseFloat(newRecord.invoiceAmount) || 0,
      otherAmount: Number.parseFloat(newRecord.otherAmount) || 0,
      totalAmount,
      fuelExpense: Number.parseFloat(newRecord.fuelExpense) || 0,
      otherExpenses: Number.parseFloat(newRecord.otherExpenses) || 0,
      driverCommission,
      netAmount,
    }

    try {
      const response = await fetch("/api/daily-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recordData),
      })

      if (!response.ok) {
        throw new Error("Error al crear el registro")
      }

      toast({
        title: "Éxito",
        description: "Registro de jornada creado correctamente",
      })

      // Redirigir a la página de registros diarios
      router.push("/admin/registros-diarios")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el registro",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Aquí iría la lógica para subir la imagen a un servicio de almacenamiento
      // Por ahora, simularemos una URL

      setTimeout(() => {
        setNewRecord((prev) => ({
          ...prev,
          imageUrl: URL.createObjectURL(file), // Esto es temporal, en producción usaríamos la URL real
        }))
        setIsUploading(false)
      }, 1000)
    } catch (error) {
      console.error("Error al subir imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <BackToAdminButton />
        <Button variant="outline" onClick={() => router.push("/admin/registros-diarios")} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Registros Diarios
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Registrar Nueva Jornada</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Jornada</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" name="date" type="date" value={newRecord.date} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Conductor</Label>
                <Select value={newRecord.driverId} onValueChange={(value) => handleSelectChange("driverId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(drivers) ? (
                      drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.username}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="error">Error al cargar conductores</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftStart">Hora Inicio</Label>
                <Input
                  id="shiftStart"
                  name="shiftStart"
                  type="time"
                  value={newRecord.shiftStart}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shiftEnd">Hora Fin</Label>
                <Input
                  id="shiftEnd"
                  name="shiftEnd"
                  type="time"
                  value={newRecord.shiftEnd}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startKm">Kilómetros Inicio</Label>
                <Input
                  id="startKm"
                  name="startKm"
                  type="number"
                  value={newRecord.startKm}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endKm">Kilómetros Fin</Label>
                <Input
                  id="endKm"
                  name="endKm"
                  type="number"
                  value={newRecord.endKm}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Ingresos</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cashAmount">Efectivo</Label>
                    <Input
                      id="cashAmount"
                      name="cashAmount"
                      type="number"
                      step="0.01"
                      value={newRecord.cashAmount}
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
                      value={newRecord.cardAmount}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceAmount">Facturación</Label>
                    <Input
                      id="invoiceAmount"
                      name="invoiceAmount"
                      type="number"
                      step="0.01"
                      value={newRecord.invoiceAmount}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherAmount">Otros Ingresos</Label>
                    <Input
                      id="otherAmount"
                      name="otherAmount"
                      type="number"
                      step="0.01"
                      value={newRecord.otherAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Gastos</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuelExpense">Gasolina</Label>
                    <Input
                      id="fuelExpense"
                      name="fuelExpense"
                      type="number"
                      step="0.01"
                      value={newRecord.fuelExpense}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherExpenses">Otros Gastos</Label>
                    <Input
                      id="otherExpenses"
                      name="otherExpenses"
                      type="number"
                      step="0.01"
                      value={newRecord.otherExpenses}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherExpenseNotes">Concepto Otros Gastos</Label>
                    <Input
                      id="otherExpenseNotes"
                      name="otherExpenseNotes"
                      value={newRecord.otherExpenseNotes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Input id="notes" name="notes" value={newRecord.notes} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label>Imagen de la Hoja (opcional)</Label>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("imageUpload")?.click()}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  <FileUpload className="mr-2 h-4 w-4" />
                  {isUploading ? "Subiendo..." : "Subir Imagen"}
                </Button>

                {newRecord.imageUrl && <span className="text-sm text-green-600">Imagen cargada</span>}

                <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {newRecord.imageUrl && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <img
                    src={newRecord.imageUrl || "/placeholder.svg"}
                    alt="Hoja de registro"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Resumen Calculado</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kilómetros</p>
                  <p className="font-medium">{calculateTotals().totalKm} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ingresos</p>
                  <p className="font-medium">{formatCurrency(calculateTotals().totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comisión Conductor</p>
                  <p className="font-medium">{formatCurrency(calculateTotals().driverCommission)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Neto Empresa</p>
                  <p className="font-medium">{formatCurrency(calculateTotals().netAmount)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/registros-diarios")}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Guardar Registro
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
