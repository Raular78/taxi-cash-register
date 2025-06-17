"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import {
  Euro,
  Fuel,
  TrendingUp,
  Plus,
  FileText,
  BarChart3,
  Clock,
  MapPin,
  AlertCircle,
  Download,
  Star,
} from "lucide-react"
import Link from "next/link"
import TimeTracker from "@/app/components/TimeTracker"

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
  shiftStart?: string
  shiftEnd?: string
  driver?: {
    id: number
    username: string
  }
}

interface WeeklyData {
  week: string
  ingresos: number
  gastos: number
  comision: number
  dias: number
  kmTotal: number
}

interface Payroll {
  id: number
  netAmount: number
  baseSalary: number
  commissions: number
  bonuses: number
  deductions: number
  taxWithholding: number
  status: string
  paymentDate: string | null
  pdfUrl: string | null
}

interface PayrollResponse {
  found: boolean
  payroll?: Payroll
  defaultSalary?: number
}

export default function ConductorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [payrollData, setPayrollData] = useState<PayrollResponse | null>(null)
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [activeTab, setActiveTab] = useState<"resumen" | "detalles">("resumen")
  const [showPayrollDetails, setShowPayrollDetails] = useState(false)

  // Presets de fechas
  const datePresets = [
    {
      label: "Esta semana",
      range: {
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
    },
    {
      label: "Último mes",
      range: {
        from: startOfMonth(subDays(new Date(), 30)),
        to: endOfMonth(subDays(new Date(), 30)),
      },
    },
    {
      label: "Este mes",
      range: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "driver" && status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session) {
      fetchRecords()
      fetchPayrollData()
    }
  }, [session, dateRange])

  const fetchPayrollData = async () => {
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      const response = await fetch(`/api/payrolls/conductor?startDate=${fromDate}&endDate=${toDate}`)

      if (!response.ok) {
        throw new Error("Error al obtener datos de nómina")
      }

      const data = await response.json()
      setPayrollData(data)
      console.log("Payroll data:", data)
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      // Si hay error, usar valor por defecto
      setPayrollData({
        found: false,
        defaultSalary: 1400,
      })
    }
  }

  const fetchRecords = async () => {
    if (!session) return

    setLoading(true)
    setError(null)
    setDebugInfo("")

    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      console.log(`Fetching records from ${fromDate} to ${toDate}`)
      console.log("Current session:", session.user)

      // Cambiar a daily-records en lugar de records
      const response = await fetch(`/api/daily-records?from=${fromDate}&to=${toDate}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error ${response.status}: ${errorData.error || "Error desconocido"}`)
      }

      const data = await response.json()
      console.log("Records fetched:", data)

      // Actualizar información de debug
      setDebugInfo(`
      Usuario: ${session.user.username} (ID: ${session.user.id})
      Rol: ${session.user.role}
      Registros encontrados: ${Array.isArray(data) ? data.length : 0}
      Rango de fechas: ${fromDate} - ${toDate}
      Respuesta de la API: ${JSON.stringify(data, null, 2)}
    `)

      // Si no hay datos, usar un array vacío
      setRecords(Array.isArray(data) ? data : [])

      // Procesar datos semanales solo si hay registros
      if (Array.isArray(data) && data.length > 0) {
        processWeeklyData(data)
      } else {
        setWeeklyData([])
      }
    } catch (error) {
      console.error("Error fetching records:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(`No se pudieron cargar los registros: ${errorMessage}`)
      setDebugInfo(`
      Error: ${errorMessage}
      Usuario: ${session.user.username} (ID: ${session.user.id})
      Rol: ${session.user.role}
    `)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      // Establecer arrays vacíos para evitar errores en la UI
      setRecords([])
      setWeeklyData([])
    } finally {
      setLoading(false)
    }
  }

  const processWeeklyData = (records: DailyRecord[]) => {
    try {
      const weeklyMap = new Map<
        string,
        { ingresos: number; gastos: number; comision: number; dias: number; kmTotal: number }
      >()

      records.forEach((record) => {
        const date = new Date(record.date)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 })
        const weekKey = format(weekStart, "dd/MM", { locale: es })

        const existing = weeklyMap.get(weekKey) || { ingresos: 0, gastos: 0, comision: 0, dias: 0, kmTotal: 0 }

        weeklyMap.set(weekKey, {
          ingresos: existing.ingresos + (record.totalAmount || 0),
          gastos: existing.gastos + ((record.fuelExpense || 0) + (record.otherExpenses || 0)),
          comision: existing.comision + (record.driverCommission || 0),
          dias: existing.dias + 1,
          kmTotal: existing.kmTotal + (record.totalKm || 0),
        })
      })

      const weeklyArray = Array.from(weeklyMap.entries()).map(([week, data]) => ({
        week,
        ...data,
      }))

      setWeeklyData(weeklyArray)
    } catch (error) {
      console.error("Error processing weekly data:", error)
      setWeeklyData([])
    }
  }

  const calculateTotals = () => {
    return records.reduce(
      (acc, record) => ({
        totalIncome: acc.totalIncome + (record.totalAmount || 0),
        totalKm: acc.totalKm + (record.totalKm || 0),
        totalFuelExpense: acc.totalFuelExpense + ((record.fuelExpense || 0) + (record.otherExpenses || 0)),
        totalCommission: acc.totalCommission + (record.driverCommission || 0),
        totalCash: acc.totalCash + (record.cashAmount || 0),
        totalCard: acc.totalCard + (record.cardAmount || 0),
        totalInvoice: acc.totalInvoice + (record.invoiceAmount || 0),
        totalOther: acc.totalOther + (record.otherAmount || 0),
      }),
      {
        totalIncome: 0,
        totalKm: 0,
        totalFuelExpense: 0,
        totalCommission: 0,
        totalCash: 0,
        totalCard: 0,
        totalInvoice: 0,
        totalOther: 0,
      },
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
  }

  const handlePresetClick = (preset: { label: string; range: { from: Date; to: Date } }) => {
    setDateRange(preset.range)
  }

  // Calcular estadísticas del gráfico
  const getChartStats = () => {
    if (weeklyData.length === 0) return null

    const bestWeek = weeklyData.reduce((best, current) => (current.comision > best.comision ? current : best))

    const avgIncome = weeklyData.reduce((sum, week) => sum + week.ingresos, 0) / weeklyData.length
    const avgCommission = weeklyData.reduce((sum, week) => sum + week.comision, 0) / weeklyData.length
    const totalDays = weeklyData.reduce((sum, week) => sum + week.dias, 0)

    return {
      bestWeek,
      avgIncome,
      avgCommission,
      totalDays,
      avgDaysPerWeek: totalDays / weeklyData.length,
    }
  }

  // Si está cargando la sesión, mostrar un indicador de carga
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  // Si no hay sesión o el usuario no es conductor, no mostrar nada
  if (status === "authenticated" && session?.user?.role !== "driver") {
    return null
  }

  const totals = calculateTotals()
  const chartStats = getChartStats()

  // Determinar el valor de la nómina y calcular el efectivo
  const nominaValue = payrollData?.found ? payrollData.payroll?.netAmount : payrollData?.defaultSalary || 1400

  const cashBonus = Math.max(0, totals.totalCommission - nominaValue)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Panel del Conductor</h1>
            <p className="text-muted-foreground">
              Bienvenido, {session?.user?.username || "Conductor"}. Aquí tienes tu resumen de actividad.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/conductor/registros-diarios">
                <FileText className="h-4 w-4 mr-2" />
                Ver Registros
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/conductor/nominas">
                <Euro className="h-4 w-4 mr-2" />
                Mis Nóminas
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/conductor/nuevo-registro">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </Link>
            </Button>
          </div>
        </div>

        {/* Información de debug si hay error o no hay datos */}
        {(error || records.length === 0) && debugInfo && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Información de Debug
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-orange-700 whitespace-pre-wrap overflow-x-auto">{debugInfo}</pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={fetchRecords}>
                  Reintentar
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/registros-diarios">Ver Panel Admin</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros de fecha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Período de Consulta</CardTitle>
            <CardDescription>Selecciona el rango de fechas para ver tus estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <DateRangePicker dateRange={dateRange} onRangeChange={handleDateRangeChange} className="w-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando datos del {format(dateRange.from, "dd/MM/yyyy", { locale: es })} al{" "}
              {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>

        {/* Mensaje de error si hay alguno */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRecords} className="mt-2">
              Reintentar
            </Button>
          </div>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totals.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(dateRange.from, "dd/MM", { locale: es })} - {format(dateRange.to, "dd/MM", { locale: es })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kilómetros</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-20" /> : `${totals.totalKm} km`}
              </div>
              <p className="text-xs text-muted-foreground">Distancia recorrida</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Combustible</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totals.totalFuelExpense)}
              </div>
              <p className="text-xs text-muted-foreground">Gastos del período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisión Conductor</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-20" /> : formatCurrency(totals.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground">Tu comisión (35%)</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de evolución semanal mejorado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Análisis Semanal
            </CardTitle>
            <CardDescription>Evolución de ingresos, gastos y comisiones con estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : weeklyData.length > 0 ? (
              <div className="space-y-6">
                {/* Estadísticas rápidas */}
                {chartStats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center mb-2">
                        <Star className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">Mejor Semana</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-900">{chartStats.bestWeek.week}</div>
                        <div className="text-sm text-yellow-700">{formatCurrency(chartStats.bestWeek.comision)}</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-800 mb-2">Promedio Semanal</div>
                        <div className="text-lg font-bold text-blue-900">
                          {formatCurrency(chartStats.avgCommission)}
                        </div>
                        <div className="text-xs text-blue-600">comisión</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-800 mb-2">Días Trabajados</div>
                        <div className="text-lg font-bold text-green-900">{chartStats.totalDays}</div>
                        <div className="text-xs text-green-600">total</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-800 mb-2">Consistencia</div>
                        <div className="text-lg font-bold text-purple-900">{chartStats.avgDaysPerWeek.toFixed(1)}</div>
                        <div className="text-xs text-purple-600">días/semana</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gráfico mejorado */}
                <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-lg border">
                  <div className="h-80 w-full relative">
                    {/* Líneas de referencia */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4">
                      {[100, 75, 50, 25, 0].map((percent) => (
                        <div key={percent} className="border-t border-gray-200 border-dashed opacity-50" />
                      ))}
                    </div>

                    {/* Barras del gráfico */}
                    <div className="relative h-full flex items-end justify-center space-x-8 px-4">
                      {weeklyData.map((week, index) => {
                        const maxValue = Math.max(...weeklyData.map((w) => Math.max(w.ingresos, w.gastos, w.comision)))
                        const ingresosHeight = maxValue > 0 ? Math.max((week.ingresos / maxValue) * 85, 3) : 3
                        const gastosHeight = maxValue > 0 ? Math.max((week.gastos / maxValue) * 85, 3) : 3
                        const comisionHeight = maxValue > 0 ? Math.max((week.comision / maxValue) * 85, 3) : 3
                        const isBestWeek = chartStats?.bestWeek.week === week.week

                        return (
                          <div key={index} className="flex flex-col items-center space-y-3 relative">
                            {/* Estrella para mejor semana */}
                            {isBestWeek && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                                <Star className="h-5 w-5 text-yellow-500 animate-pulse drop-shadow-sm" />
                              </div>
                            )}

                            {/* Contenedor de barras */}
                            <div className="flex items-end space-x-1 h-72">
                              {/* Barra de Ingresos */}
                              <div
                                className={`w-8 rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg ${
                                  isBestWeek
                                    ? "bg-gradient-to-t from-green-700 via-green-500 to-green-300 shadow-green-300"
                                    : "bg-gradient-to-t from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 shadow-green-200"
                                }`}
                                style={{
                                  height: `${ingresosHeight}%`,
                                  minHeight: "8px",
                                }}
                                title={`Ingresos: ${formatCurrency(week.ingresos)}`}
                              />

                              {/* Barra de Gastos */}
                              <div
                                className={`w-8 rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg ${
                                  isBestWeek
                                    ? "bg-gradient-to-t from-red-700 via-red-500 to-red-300 shadow-red-300"
                                    : "bg-gradient-to-t from-red-600 to-red-400 hover:from-red-700 hover:to-red-500 shadow-red-200"
                                }`}
                                style={{
                                  height: `${gastosHeight}%`,
                                  minHeight: "8px",
                                }}
                                title={`Gastos: ${formatCurrency(week.gastos)}`}
                              />

                              {/* Barra de Comisión */}
                              <div
                                className={`w-8 rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg ${
                                  isBestWeek
                                    ? "bg-gradient-to-t from-blue-700 via-blue-500 to-blue-300 shadow-blue-300"
                                    : "bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-blue-200"
                                }`}
                                style={{
                                  height: `${comisionHeight}%`,
                                  minHeight: "8px",
                                }}
                                title={`Comisión: ${formatCurrency(week.comision)}`}
                              />
                            </div>

                            {/* Etiquetas de semana */}
                            <div className="text-center space-y-1">
                              <div
                                className={`text-sm font-medium ${
                                  isBestWeek ? "text-yellow-700 font-bold" : "text-gray-700"
                                }`}
                              >
                                {week.week}
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border">
                                {week.dias}d
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Leyenda mejorada */}
                  <div className="flex justify-center items-center mt-6 space-x-8 text-sm bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-green-400 rounded shadow-sm" />
                      <span className="font-medium text-gray-700">Ingresos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-red-600 to-red-400 rounded shadow-sm" />
                      <span className="font-medium text-gray-700">Gastos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded shadow-sm" />
                      <span className="font-medium text-gray-700">Comisión</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-gray-700">Mejor semana</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">No hay datos para mostrar</p>
                <p className="text-sm mt-1">Selecciona un período con registros para ver el análisis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs para resumen y detalles */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "resumen" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("resumen")}
          >
            Resumen
          </Button>
          <Button
            variant={activeTab === "detalles" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("detalles")}
          >
            Detalles
          </Button>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === "resumen" && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
              <CardDescription>
                {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Ingresos</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Efectivo:</span>
                          <span className="font-medium">{formatCurrency(totals.totalCash)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tarjeta:</span>
                          <span className="font-medium">{formatCurrency(totals.totalCard)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Facturación:</span>
                          <span className="font-medium">{formatCurrency(totals.totalInvoice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Otros:</span>
                          <span className="font-medium">{formatCurrency(totals.totalOther)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(totals.totalIncome)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div>
                        <h3 className="font-semibold mb-3">Nómina y Comisiones</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Comisión (35%):</span>
                            <span className="font-medium">{formatCurrency(totals.totalCommission)}</span>
                          </div>
                          <div className="pl-4 space-y-1 text-sm border-l-2 border-muted">
                            <div className="flex justify-between">
                              <span>Sujeto a Nómina:</span>
                              <span className="font-medium">{formatCurrency(nominaValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Efectivo:</span>
                              <span className="font-medium text-green-600">{formatCurrency(cashBonus)}</span>
                            </div>
                          </div>

                          {/* Información de nómina */}
                          {payrollData?.found && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-blue-800">Nómina Disponible</span>
                                <span className="text-sm text-blue-600">
                                  Estado: {payrollData.payroll?.status === "paid" ? "Pagada" : "Pendiente"}
                                </span>
                              </div>

                              {payrollData.payroll?.paymentDate && (
                                <div className="text-sm text-blue-600 mb-2">
                                  Fecha de pago:{" "}
                                  {format(new Date(payrollData.payroll.paymentDate), "dd/MM/yyyy", { locale: es })}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {payrollData.payroll?.pdfUrl && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={payrollData.payroll.pdfUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-2" />
                                      Descargar PDF
                                    </a>
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowPayrollDetails(!showPayrollDetails)}
                                >
                                  {showPayrollDetails ? "Ocultar" : "Ver"} Detalles
                                </Button>
                              </div>

                              {showPayrollDetails && payrollData.payroll && (
                                <div className="mt-3 pt-3 border-t border-blue-200 text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-blue-600">Salario base:</span>
                                      <div className="font-medium">
                                        {formatCurrency(payrollData.payroll.baseSalary)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Comisiones:</span>
                                      <div className="font-medium">
                                        {formatCurrency(payrollData.payroll.commissions)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Bonificaciones:</span>
                                      <div className="font-medium">{formatCurrency(payrollData.payroll.bonuses)}</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Deducciones:</span>
                                      <div className="font-medium">
                                        {formatCurrency(payrollData.payroll.deductions)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Retención fiscal:</span>
                                      <div className="font-medium">
                                        {formatCurrency(payrollData.payroll.taxWithholding)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Importe neto:</span>
                                      <div className="font-medium text-green-600">
                                        {formatCurrency(payrollData.payroll.netAmount)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {totals.totalCommission < nominaValue && (
                            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                              La comisión es menor que la nómina base. Diferencia:{" "}
                              {formatCurrency(nominaValue - totals.totalCommission)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-lg font-semibold">Ganancia Total:</span>
                        <p className="text-sm text-muted-foreground">Nómina + efectivo adicional</p>
                      </div>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(totals.totalCommission)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "detalles" && (
          <Card>
            <CardHeader>
              <CardTitle>Registros Detallados</CardTitle>
              <CardDescription>Lista de todos los registros en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : records.length > 0 ? (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <div className="font-medium">
                            {format(new Date(record.date), "EEEE, dd 'de' MMMM", { locale: es })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.shiftStart && record.shiftEnd && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {record.shiftStart} - {record.shiftEnd}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(record.totalAmount || 0)}</div>
                          <div className="text-sm text-muted-foreground">{record.totalKm || 0} km</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Efectivo:</span>
                          <div className="font-medium">{formatCurrency(record.cashAmount || 0)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tarjeta:</span>
                          <div className="font-medium">{formatCurrency(record.cardAmount || 0)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gastos:</span>
                          <div className="font-medium">
                            {formatCurrency((record.fuelExpense || 0) + (record.otherExpenses || 0))}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comisión:</span>
                          <div className="font-medium text-green-600">
                            {formatCurrency(record.driverCommission || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay registros en este período</p>
                  <p className="text-sm mt-2">
                    Los registros que crees desde el panel de administrador aparecerán aquí automáticamente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Control horario */}
        <TimeTracker />
      </div>
    </div>
  )
}
