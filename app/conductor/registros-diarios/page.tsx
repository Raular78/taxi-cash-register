"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Search, Plus, Eye, ArrowLeft, Clock, MapPin, Euro, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  driverCommission: number
  netAmount: number
  notes?: string
  shiftStart?: string
  shiftEnd?: string
  imageUrl?: string
}

export default function ConductorRegistrosDiariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [viewRecord, setViewRecord] = useState<DailyRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "driver") {
      router.push("/dashboard")
    }
  }, [status, session, router])

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

  const viewRecordDetails = (record: DailyRecord) => {
    setViewRecord(record)
    setIsViewDialogOpen(true)
  }

  const viewFullImage = () => {
    if (viewRecord?.imageUrl) {
      setIsImageDialogOpen(true)
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
      record.id.toString().includes(searchTerm) || format(new Date(record.date), "dd/MM/yyyy").includes(searchTerm),
  )

  const getTotalAmount = () => {
    return filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  }

  const getTotalKm = () => {
    return filteredRecords.reduce((sum, record) => sum + record.totalKm, 0)
  }

  const getTotalCommission = () => {
    return filteredRecords.reduce((sum, record) => sum + record.driverCommission, 0)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "driver") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/conductor")} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Mis Registros Diarios</h1>
              <p className="text-muted-foreground">Gestiona tus jornadas de trabajo</p>
            </div>
          </div>
          <Button asChild className="w-full lg:w-auto">
            <a href="/conductor/nuevo-registro">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Registro
            </a>
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(getTotalAmount())}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kilómetros</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-24" /> : `${getTotalKm()} km`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mi Comisión</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(getTotalCommission())}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra tus registros por fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID o fecha..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="lg:w-80">
                <DateRangePicker dateRange={dateRange} onRangeChange={setDateRange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de registros */}
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
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {/* Vista móvil */}
                <div className="block lg:hidden space-y-3">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">
                            {format(new Date(record.date), "dd/MM/yyyy", { locale: es })}
                          </div>
                          <div className="text-sm text-muted-foreground">ID: {record.id}</div>
                        </div>
                        <div className="flex items-center">
                          {record.imageUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mr-1"
                              onClick={() => {
                                setViewRecord(record)
                                setIsImageDialogOpen(true)
                              }}
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => viewRecordDetails(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <div className="font-medium">{formatCurrency(record.totalAmount)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Km:</span>
                          <div className="font-medium">{record.totalKm} km</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comisión:</span>
                          <div className="font-medium text-green-600">{formatCurrency(record.driverCommission)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Horario:</span>
                          <div className="font-medium">
                            {record.shiftStart && record.shiftEnd
                              ? `${record.shiftStart}-${record.shiftEnd}`
                              : "No registrado"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista desktop */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Km</TableHead>
                        <TableHead>Efectivo</TableHead>
                        <TableHead>Tarjeta</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Gastos</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>{format(new Date(record.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell>
                            {record.shiftStart && record.shiftEnd ? (
                              <div className="flex items-center text-sm">
                                <Clock className="h-3 w-3 mr-1" />
                                {record.shiftStart}-{record.shiftEnd}
                              </div>
                            ) : (
                              "No registrado"
                            )}
                          </TableCell>
                          <TableCell>{record.totalKm} km</TableCell>
                          <TableCell>{formatCurrency(record.cashAmount)}</TableCell>
                          <TableCell>{formatCurrency(record.cardAmount)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(record.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(record.fuelExpense + record.otherExpenses)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(record.driverCommission)}
                          </TableCell>
                          <TableCell>
                            {record.imageUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setViewRecord(record)
                                  setIsImageDialogOpen(true)
                                }}
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">Sin imagen</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {record.imageUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setViewRecord(record)
                                    setIsImageDialogOpen(true)
                                  }}
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => viewRecordDetails(record)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No hay registros en este período</div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo para ver detalles */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Jornada</DialogTitle>
              <DialogDescription>
                {viewRecord && format(new Date(viewRecord.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </DialogDescription>
            </DialogHeader>

            {viewRecord && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Información General</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span>{format(new Date(viewRecord.date), "dd/MM/yyyy", { locale: es })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horario:</span>
                        <span>
                          {viewRecord.shiftStart && viewRecord.shiftEnd
                            ? `${viewRecord.shiftStart} - ${viewRecord.shiftEnd}`
                            : "No registrado"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kilómetros:</span>
                        <span>
                          {viewRecord.startKm} - {viewRecord.endKm} ({viewRecord.totalKm} km)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Ingresos</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Efectivo:</span>
                        <span>{formatCurrency(viewRecord.cashAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarjeta:</span>
                        <span>{formatCurrency(viewRecord.cardAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Facturación:</span>
                        <span>{formatCurrency(viewRecord.invoiceAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Otros:</span>
                        <span>{formatCurrency(viewRecord.otherAmount)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>{formatCurrency(viewRecord.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Gastos</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Combustible:</span>
                        <span>{formatCurrency(viewRecord.fuelExpense)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Otros gastos:</span>
                        <span>{formatCurrency(viewRecord.otherExpenses)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total gastos:</span>
                          <span>{formatCurrency(viewRecord.fuelExpense + viewRecord.otherExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Comisión</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tu comisión (35%):</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(viewRecord.driverCommission)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ganancia neta:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            viewRecord.driverCommission - viewRecord.fuelExpense - viewRecord.otherExpenses,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {viewRecord.notes && (
                  <div>
                    <h3 className="font-medium mb-2">Notas</h3>
                    <p className="text-sm text-muted-foreground">{viewRecord.notes}</p>
                  </div>
                )}

                {viewRecord.imageUrl && (
                  <div>
                    <h3 className="font-medium mb-2">Imagen de la Hoja</h3>
                    <div className="border rounded-md overflow-hidden cursor-pointer" onClick={viewFullImage}>
                      <img
                        src={viewRecord.imageUrl || "/placeholder.svg"}
                        alt="Hoja de registro"
                        className="w-full h-auto max-h-[200px] object-contain"
                      />
                      <div className="bg-black/5 p-2 text-center text-sm text-muted-foreground">
                        Haz clic para ampliar
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo para ver imagen completa */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Imagen de la Hoja</DialogTitle>
              <DialogDescription>
                {viewRecord && format(new Date(viewRecord.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            {viewRecord?.imageUrl && (
              <div className="flex justify-center">
                <img
                  src={viewRecord.imageUrl || "/placeholder.svg"}
                  alt="Hoja de registro"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
