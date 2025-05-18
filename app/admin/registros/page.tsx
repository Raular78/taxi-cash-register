"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "..\..\..\components\ui/card"
import { Button } from "..\..\..\components\ui/button"
import { Input } from "..\..\..\components\ui/input"
import { Label } from "..\..\..\components\ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "..\..\..\components\ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "..\..\..\components\ui/dialog"
import { DateRangePicker } from "..\..\..\components\ui/date-range-picker"
import { Skeleton } from "..\..\..\components\ui/skeleton"
import { toast } from "..\..\..\components\ui/use-toast"
import { UploadIcon as FileUpload } from "lucide-react"

export default function RecordsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [newRecord, setNewRecord] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchRecords()
    }
  }, [session, dateRange])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      const response = await fetch(`/api/records?from=${fromDate}&to=${toDate}`)
      if (!response.ok) {
        throw new Error("Error al obtener registros")
      }
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { totalKm, totalAmount, driverCommission, netAmount } = calculateTotals()

    const recordData = {
      ...newRecord,
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
      const response = await fetch("/api/records", {
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

      setNewRecord({
        date: format(new Date(), "yyyy-MM-dd"),
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

      setIsDialogOpen(false)
      fetchRecords()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el registro",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Registro de Jornadas</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Nueva Jornada</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra los registros por rango de fechas</CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onFromChange={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
            onToChange={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jornadas Registradas</CardTitle>
          <CardDescription>
            Mostrando jornadas del {format(dateRange.from, "dd/MM/yyyy")} al {format(dateRange.to, "dd/MM/yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Km</TableHead>
                    <TableHead>Efectivo</TableHead>
                    <TableHead>Tarjeta</TableHead>
                    <TableHead>Facturación</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Gastos</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Neto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{record.user?.username || "N/A"}</TableCell>
                      <TableCell>{record.totalKm} km</TableCell>
                      <TableCell>{formatCurrency(record.cashAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.cardAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.invoiceAmount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.fuelExpense + record.otherExpenses)}</TableCell>
                      <TableCell>{formatCurrency(record.driverCommission)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.netAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay registros para el período seleccionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Jornada</DialogTitle>
            <DialogDescription>Introduce los datos de la jornada laboral completa</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" name="date" type="date" value={newRecord.date} onChange={handleInputChange} required />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="imageUpload">Imagen de la Hoja (opcional)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("imageUpload").click()}
                  disabled={isUploading}
                >
                  <FileUpload className="mr-2 h-4 w-4" />
                  {isUploading ? "Subiendo..." : "Subir Imagen"}
                </Button>
                {newRecord.imageUrl && <span className="text-sm text-green-600">Imagen cargada</span>}
                <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Resumen Calculado</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Registro</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

