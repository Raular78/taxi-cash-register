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

interface Record {
  id: number
  date: string
  origin: string
  destination: string
  distance: number
  fare: number
  tip: number
  totalAmount: number
  paymentMethod: string
  driverId: number
  driver?: {
    id: number
    username: string
  }
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    if (session) {
      fetchDailyRecords()
      fetchRecords()
      fetchExpenses()
    }
  }, [session, dateRange])

  const fetchDailyRecords = async () => {
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      const response = await fetch(`/api/daily-records?from=${fromDate}&to=${toDate}`)
      if (!response.ok) {
        throw new Error("Error al obtener registros diarios")
      }

      const data = await response.json()
      console.log("Registros diarios obtenidos:", data.length)
      setDailyRecords(data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/records")
      if (!response.ok) {
        throw new Error("Error al obtener registros")
      }

      const data = await response.json()
      console.log("Registros individuales obtenidos:", data.length)
      setRecords(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      const response = await fetch(`/api/expenses?from=${fromDate}&to=${toDate}`)
      if (!response.ok) {
        throw new Error("Error al obtener gastos")
      }

      const data = await response.json()
      console.log("Gastos obtenidos:", data.length)
      setExpenses(data)
    } catch (error) {
      console.error("Error al cargar gastos:", error)
    }
  }

  // Cálculos para tarjetas de resumen
  const getTotalIncome = () => {
    return dailyRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  }

  const getTotalKm = () => {
    return dailyRecords.reduce((sum, record) => sum + record.totalKm, 0)
  }

  const getTotalExpenses = () => {
    // Gastos de registros diarios (combustible y otros)
    const dailyExpenses = dailyRecords.reduce((sum, record) => sum + record.fuelExpense + record.otherExpenses, 0)

    // Gastos de la tabla Expense
    const additionalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    console.log("Gastos diarios:", dailyExpenses, "Gastos adicionales:", additionalExpenses)

    return dailyExpenses + additionalExpenses
  }

  // Modificar la función getTotalNetAmount para que reste correctamente los gastos
  const getTotalNetAmount = () => {
    const totalIncome = getTotalIncome()
    const totalExpenses = getTotalExpenses()
    const totalCommissions = getTotalCommission()

    // Corregir el cálculo para restar tanto comisiones como gastos
    return totalIncome - totalExpenses - totalCommissions
  }

  const getTotalCommission = () => {
    return dailyRecords.reduce((sum, record) => sum + record.driverCommission, 0)
  }

  const getTotalServices = () => {
    return records.length
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

        acc[date].ingresos += record.totalAmount
        acc[date].gastos += record.fuelExpense + record.otherExpenses
        acc[date].comision += record.driverCommission
        acc[date].neto += record.netAmount
        acc[date].km += record.totalKm

        return acc
      },
      {} as Record<string, any>,
    )

    // Convertir a array y ordenar por fecha
    return Object.values(groupedByDate).sort((a, b) => {
      const dateA = new Date(a.date.split("/").reverse().join("/"))
      const dateB = new Date(b.date.split("/").reverse().join("/"))
      return dateA.getTime() - dateB.getTime()
    })
  }

  const chartData = prepareChartData()

  // Preparar datos para gráfico de métodos de pago
  const preparePaymentMethodData = () => {
    const paymentData = {
      efectivo: dailyRecords.reduce((sum, record) => sum + record.cashAmount, 0),
      tarjeta: dailyRecords.reduce((sum, record) => sum + record.cardAmount, 0),
      factura: dailyRecords.reduce((sum, record) => sum + record.invoiceAmount, 0),
      otros: dailyRecords.reduce((sum, record) => sum + record.otherAmount, 0),
    }

    return [
      { name: "Efectivo", value: paymentData.efectivo },
      { name: "Tarjeta", value: paymentData.tarjeta },
      { name: "Factura", value: paymentData.factura },
      { name: "Otros", value: paymentData.otros },
    ]
  }

  const paymentMethodData = preparePaymentMethodData()

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Panel de Administrador</h1>
        <div className="flex space-x-2">
          <DateRangePicker
            dateRange={{ from: dateRange.from, to: dateRange.to }}
            onRangeChange={(range) => setDateRange({ from: range.from, to: range.to })}
          />
          <Button variant="outline" onClick={() => window.open("/api/export/daily-records", "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </Button>
        </div>
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
        <TabsList>
          <TabsTrigger value="overview">Registros</TabsTrigger>
          <TabsTrigger value="conductores">Conductores</TabsTrigger>
          <TabsTrigger value="control-horario">Control Horario</TabsTrigger>
          <TabsTrigger value="nominas">Nóminas</TabsTrigger>
          <TabsTrigger value="contabilidad">Contabilidad</TabsTrigger>
        </TabsList>

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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registros Recientes</CardTitle>
                <CardDescription>Últimos servicios registrados en el sistema</CardDescription>
                <div className="flex space-x-2">
  <Button asChild>
    <Link href="/admin/registros-diarios">
      <FileText className="h-4 w-4 mr-2" />
      Ver todos los registros
    </Link>
  </Button>
  <Button asChild>
    <Link href="/admin/nuevo-registro">
      <Plus className="h-4 w-4 mr-2" />
      Nuevo Registro
    </Link>
  </Button>
  <Button asChild>
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
                          <TableCell>{formatCurrency(record.fuelExpense + record.otherExpenses)}</TableCell>
                          <TableCell>{formatCurrency(record.driverCommission)}</TableCell>
                          <TableCell>{formatCurrency(record.netAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No hay registros disponibles.</p>
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
                <Link href="/admin/conductores">
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
              <div className="flex space-x-2">
                <Button asChild>
                  <Link href="/admin/nominas">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver nóminas
                  </Link>
                </Button>
                <Button asChild>
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
