"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { DateRangePicker } from "../../../components/ui/date-range-picker"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "../../../components/ui/use-toast"
import { UploadIcon as FileUpload, FileText, Eye, Download, Search, Plus, Trash2, Edit, ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import BackToAdminButton from "../../../components/BackToAdminButton"
import { useRouter } from "next/navigation"

interface DailyRecord {
  id: number
  date: string
  startKm: number
  endKm: number
  totalKm: number
  cashAmount: number
  cardAmount: number
  invoiceAmount: number
  otherAmount: number
  totalAmount: number
  fuelExpense: number
  otherExpenses: number
  otherExpenseNotes?: string
  driverCommission: number
  netAmount: number
  notes?: string
  shiftStart?: string
  shiftEnd?: string
  imageUrl?: string
  driverId: number
  driver?: {
    id: number
    username: string
  }
}

interface User {
  id: number
  username: string
}

export default function AdminDailyRecordsPage() {
  const { data: session } = useSession()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [driverFilter, setDriverFilter] = useState<string>("all")
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [viewRecord, setViewRecord] = useState<DailyRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (session) {
      fetchRecords()
      fetchDrivers()
    }
  }, [session, dateRange, driverFilter])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      let url = `/api/records?from=${fromDate}&to=${toDate}`

      if (driverFilter !== "all") {
        url += `&driverId=${driverFilter}`
      }

      const response = await fetch(url)
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

  // Conductores de respaldo para usar si la API falla
  const fallbackDrivers = [
    { id: 1, username: "Conductor 1" },
    { id: 2, username: "Conductor 2" },
  ]

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

  const viewRecordDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/daily-records/${id}`)
      if (!response.ok) {
        throw new Error("Error al obtener detalles del registro")
      }
      const data = await response.json()
      setViewRecord(data)
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del registro",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = (id: number) => {
    setRecordToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteRecord = async () => {
    if (!recordToDelete) return

    try {
      const response = await fetch(`/api/daily-records/${recordToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el registro")
      }

      toast({
        title: "Éxito",
        description: "Registro eliminado correctamente",
      })

      setIsDeleteDialogOpen(false)
      fetchRecords()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      })
    }
  }

  const exportToExcel = async () => {
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      let url = `/api/export/daily-records?from=${fromDate}&to=${toDate}`

      if (driverFilter !== "all") {
        url += `&driverId=${driverFilter}`
      }

      window.open(url, "_blank")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar a Excel",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const filteredRecords = records.filter(
    (record) =>
      record.driver?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toString().includes(searchTerm),
  )

  const getTotalAmount = () => {
    return filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  }

  const getTotalKm = () => {
    return filteredRecords.reduce((sum, record) => sum + record.totalKm, 0)
  }

  const getTotalNetAmount = () => {
    return filteredRecords.reduce((sum, record) => sum + record.netAmount, 0)
  }

  // Función para manejar el cambio de rango de fechas
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    console.log("Nuevo rango de fechas:", range)
    setDateRange(range)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BackToAdminButton />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Registro de Jornadas</h1>
        <Button onClick={() => router.push("/admin/nuevo-registro")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Jornada
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(getTotalAmount())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Kilómetros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-6 w-24" /> : `${getTotalKm()} km`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Neto Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(getTotalNetAmount())}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra los registros por rango de fechas y conductor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por conductor o ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Usar el componente DateRangePicker con la nueva API */}
            <DateRangePicker dateRange={dateRange} onRangeChange={handleDateRangeChange} />

            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar conductor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los conductores</SelectItem>
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

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Jornadas</CardTitle>
          <CardDescription>
            Mostrando jornadas del {format(dateRange.from, "dd/MM/yyyy", { locale: es })} al{" "}
            {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
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
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
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
                    <TableHead>Imagen</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.id}</TableCell>
                      <TableCell>{format(new Date(record.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>{record.driver?.username || "N/A"}</TableCell>
                      <TableCell>{record.totalKm} km</TableCell>
                      <TableCell>{formatCurrency(record.cashAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.cardAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.invoiceAmount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.fuelExpense + record.otherExpenses)}</TableCell>
                      <TableCell>{formatCurrency(record.driverCommission)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.netAmount)}</TableCell>
                      <TableCell>
                        {record.imageUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(record.imageUrl, "_blank")}
                            title="Ver imagen"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin imagen</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => viewRecordDetails(record.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => confirmDelete(record.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No se encontraron registros</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Jornada</DialogTitle>
            <DialogDescription>Introduce los datos de la jornada laboral</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Imagen de la Hoja (opcional)</Label>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("imageUpload")?.click()}
                  disabled={isUploading}
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

      {/* Diálogo para ver detalles del registro */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Jornada</DialogTitle>
            <DialogDescription>
              {viewRecord && format(new Date(viewRecord.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Información General</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Fecha:</span>
                      <p>{format(new Date(viewRecord.date), "dd/MM/yyyy", { locale: es })}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Conductor:</span>
                      <p>{viewRecord.driver?.username || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Horario:</span>
                      <p>
                        {viewRecord.shiftStart || "No registrado"} - {viewRecord.shiftEnd || "No registrado"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Kilómetros:</span>
                      <p>
                        {viewRecord.startKm} - {viewRecord.endKm} ({viewRecord.totalKm} km)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Ingresos</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Efectivo:</span>
                      <p>{formatCurrency(viewRecord.cashAmount)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Tarjeta:</span>
                      <p>{formatCurrency(viewRecord.cardAmount)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Facturación:</span>
                      <p>{formatCurrency(viewRecord.invoiceAmount)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Otros:</span>
                      <p>{formatCurrency(viewRecord.otherAmount)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <p className="font-medium">{formatCurrency(viewRecord.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Gastos y Comisión</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Gasolina:</span>
                      <p>{formatCurrency(viewRecord.fuelExpense)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Otros Gastos:</span>
                      <p>{formatCurrency(viewRecord.otherExpenses)}</p>
                    </div>
                    {viewRecord.otherExpenseNotes && (
                      <div>
                        <span className="text-sm text-muted-foreground">Concepto:</span>
                        <p>{viewRecord.otherExpenseNotes}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-muted-foreground">Comisión Conductor:</span>
                      <p className="font-medium">{formatCurrency(viewRecord.driverCommission)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Neto Empresa:</span>
                      <p>{formatCurrency(viewRecord.netAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {viewRecord.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notas</h3>
                  <p className="text-sm">{viewRecord.notes}</p>
                </div>
              )}

              {viewRecord.imageUrl && (
                <div>
                  <h3 className="font-medium mb-2">Imagen de la Hoja</h3>
                  <div
                    className="border rounded-md overflow-hidden cursor-pointer"
                    onClick={() => window.open(viewRecord.imageUrl, "_blank")}
                  >
                    <img
                      src={viewRecord.imageUrl || "/placeholder.svg"}
                      alt="Hoja de registro"
                      className="w-full h-auto max-h-[200px] object-contain"
                    />
                    <div className="bg-black/5 p-2 text-center text-sm text-muted-foreground">
                      Haz clic para abrir en nueva pestaña
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteRecord}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
