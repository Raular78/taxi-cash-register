"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { DateRangePicker } from "../../components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"
import {
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Car,
  Fuel,
  Download,
  Plus,
  FileUp,
} from "lucide-react"
import Link from "next/link"

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
  driverId: number
  driver?: {
    id: number
    username: string
  }
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (session) {
      fetchDailyRecords()
    }
  }, [session, dateRange])

  const fetchDailyRecords = async () => {
    try {
      setLoading(true)
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      console.log("Fetching daily records from:", fromDate, "to:", toDate)

      const response = await fetch(`/api/daily-records?from=${fromDate}&to=${toDate}`)
      if (!response.ok) {
        throw new Error("Error al obtener registros diarios")
      }

      const data = await response.json()
      console.log("Registros diarios obtenidos:", data.length, data)
      setDailyRecords(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos para tarjetas de resumen basados únicamente en dailyRecords
  const getTotalIncome = () => {
    const total = dailyRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0)
    console.log("Total income calculated:", total)
    return total
  }

  const getTotalKm = () => {
    const total = dailyRecords.reduce((sum, record) => sum + (record.totalKm || 0), 0)
    console.log("Total km calculated:", total)
    return total
  }

  const getTotalExpenses = () => {
    const total = dailyRecords.reduce((sum, record) => sum + (record.fuelExpense || 0) + (record.otherExpenses || 0), 0)
    console.log("Total expenses calculated:", total)
    return total
  }

  const getTotalCommission = () => {
    const total = dailyRecords.reduce((sum, record) => sum + (record.driverCommission || 0), 0)
    console.log("Total commission calculated:", total)
    return total
  }

  const getTotalNetAmount = () => {
    const totalIncome = getTotalIncome()
    const totalExpenses = getTotalExpenses()
    const totalCommissions = getTotalCommission()
    const net = totalIncome - totalExpenses - totalCommissions
    console.log("Net amount calculated:", { totalIncome, totalExpenses, totalCommissions, net })
    return net
  }

  const getTotalServices = () => {
    return dailyRecords.length
  }

  // Datos para gráficos
  const prepareChartData = () => {
    // Agrupar por fecha
    const groupedByDate = dailyRecords.reduce(
      (acc, record) => {
        const date = format(new Date(record.date), "dd/MM")
        if (!acc[date]) {
          acc[date] = {
            date,
            ingresos: 0,
            gastos: 0,
            comision: 0,
            neto: 0,
            km: 0,
          }
        }

        acc[date].ingresos += record.totalAmount || 0
        acc[date].gastos += (record.fuelExpense || 0) + (record.otherExpenses || 0)
        acc[date].comision += record.driverCommission || 0
        acc[date].neto += record.netAmount || 0
        acc[date].km += record.totalKm || 0

        return acc
      },
      {} as Record<string, any>,
    )

    // Convertir a array y ordenar por fecha
    const chartData = Object.values(groupedByDate).sort((a, b) => {
      const dateA = new Date(a.date.split("/").reverse().join("/"))
      const dateB = new Date(b.date.split("/").reverse().join("/"))
      return dateA.getTime() - dateB.getTime()
    })

    console.log("Chart data prepared:", chartData)
    return chartData
  }

  const chartData = prepareChartData()

  // Preparar datos para gráfico de métodos de pago
  const preparePaymentMethodData = () => {
    const paymentData = {
      efectivo: dailyRecords.reduce((sum, record) => sum + (record.cashAmount || 0), 0),
      tarjeta: dailyRecords.reduce((sum, record) => sum + (record.cardAmount || 0), 0),
      factura: dailyRecords.reduce((sum, record) => sum + (record.invoiceAmount || 0), 0),
      otros: dailyRecords.reduce((sum, record) => sum + (record.otherAmount || 0), 0),
    }

    const result = [
      { name: "Efectivo", value: paymentData.efectivo },
      { name: "Tarjeta", value: paymentData.tarjeta },
      { name: "Factura", value: paymentData.factura },
      { name: "Otros", value: paymentData.otros },
    ]

    console.log("Payment method data prepared:", result)
    return result
  }

  const paymentMethodData = preparePaymentMethodData()

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p>Cargando datos del dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Panel de Administrador</h1>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <DateRangePicker
            dateRange={{ from: dateRange.from, to: dateRange.to }}
            onRangeChange={(range) => setDateRange({ from: range.from, to: range.to })}
          />
          <Button
            variant="outline"
            onClick={() => window.open("/api/export/daily-records", "_blank")}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </Button>
        </div>
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
        Debug: {dailyRecords.length} registros cargados | Período: {format(dateRange.from, "dd/MM/yyyy")} -{" "}
        {format(dateRange.to, "dd/MM/yyyy")}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recaudación Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalIncome())}</div>
            <p className="text-xs text-muted-foreground">
              Comisión conductores: {formatCurrency(getTotalCommission())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Neto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalNetAmount())}</div>
            <p className="text-xs text-muted-foreground">Después de restar comisiones y gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalExpenses())}</div>
            <p className="text-xs text-muted-foreground">Total de gastos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalServices()}</div>
            <p className="text-xs text-muted-foreground">Total de servicios registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="w-full min-w-max">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Registros
            </TabsTrigger>
            <TabsTrigger value="conductores" className="text-xs sm:text-sm">
              Conductores
            </TabsTrigger>
            <TabsTrigger value="control-horario" className="text-xs sm:text-sm">
              Control Horario
            </TabsTrigger>
            <TabsTrigger value="nominas" className="text-xs sm:text-sm">
              Nóminas
            </TabsTrigger>
            <TabsTrigger value="contabilidad" className="text-xs sm:text-sm">
              Contabilidad
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Evolución Semanal</CardTitle>
                <CardDescription>Ingresos, gastos y comisiones</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#4f46e5" />
                      <Bar dataKey="gastos" name="Gastos" fill="#ef4444" />
                      <Bar dataKey="comision" name="Comisión" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
                <CardDescription>Distribución por tipo de pago</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {paymentMethodData.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={paymentMethodData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="value" name="Importe" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kilómetros Recorridos</CardTitle>
                <CardDescription>Evolución diaria</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `${value} km`} />
                      <Line type="monotone" dataKey="km" name="Kilómetros" stroke="#4f46e5" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Registros Recientes</CardTitle>
                <CardDescription>Últimos servicios registrados en el sistema</CardDescription>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/admin/registros-diarios">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver todos los registros
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/admin/nuevo-registro">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Registro
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/admin/importar-registros">
                    <FileUp className="h-4 w-4 mr-2" />
                    Importar Registros
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dailyRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Conductor</TableHead>
                        <TableHead>Km</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead>Gastos</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Neto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyRecords.slice(0, 5).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell>{record.driver?.username || "N/A"}</TableCell>
                          <TableCell>{record.totalKm} km</TableCell>
                          <TableCell>{formatCurrency(record.totalAmount)}</TableCell>
                          <TableCell>
                            {formatCurrency((record.fuelExpense || 0) + (record.otherExpenses || 0))}
                          </TableCell>
                          <TableCell>{formatCurrency(record.driverCommission)}</TableCell>
                          <TableCell>{formatCurrency(record.netAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No hay registros disponibles para el período seleccionado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conductores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conductores</CardTitle>
                <CardDescription>Gestión de conductores</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/usuarios">
                  <Users className="h-4 w-4 mr-2" />
                  Ver conductores
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p>
                Accede a la gestión completa de conductores para ver detalles, añadir nuevos conductores o modificar
                existentes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="control-horario">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Control Horario</CardTitle>
                <CardDescription>Gestión de horarios y jornadas</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/control-horario">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver control horario
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p>
                Accede al control horario para ver las jornadas de los conductores, horas trabajadas y gestionar el
                tiempo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nominas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Nóminas</CardTitle>
                <CardDescription>Gestión de nóminas y pagos</CardDescription>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/admin/nominas">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver nóminas
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/admin/nueva-nomina">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva nómina
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p>
                Accede a la gestión de nóminas para crear nuevas nóminas, ver el historial de pagos y gestionar la
                documentación.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contabilidad">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contabilidad</CardTitle>
                <CardDescription>Informes financieros y contabilidad</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/contabilidad">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver contabilidad
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p>Accede a los informes financieros, balance de ingresos y gastos, y exportación de datos contables.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
