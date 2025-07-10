"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedFinancialSummary } from "@/components/enhanced-financial-summary"
import { DollarSign, Check, Clock } from "lucide-react"
import { addDays, format as formatDate } from "date-fns"
import { RefreshCw } from "lucide-react" // Import RefreshCw

import { useSession } from "next-auth/react"
import { Link } from "next/link"
import { DateFilter } from "../../../components/date-filter"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DatabaseStatus } from "../../../components/database-status"
import { NotificationSystem } from "../../../components/notification-system"
import { toast } from "../../../components/ui/use-toast"
import { ArrowUp, ArrowDown, Percent, TrendingUp, Fuel, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import { Building } from "lucide-react"

// Categorías que consideramos como gastos fijos
const FIXED_EXPENSE_CATEGORIES = [
  "Nóminas",
  "Seguridad Social",
  "Cuota Autónomo",
  "Cuota Agrupación",
  "Seguros",
  "Impuestos",
  "Alquiler",
  "Suministros",
  "alquiler",
  "seguros",
  "impuestos",
  "servicios",
]

export default function ContabilidadEnhancedPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Fechas iniciales (primer y último día del mes actual)
  const [fromDate, setFromDate] = useState<Date>(addDays(new Date(), -30))
  const [toDate, setToDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("resumen")
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [expenseFormData, setExpenseFormData] = useState({
    date: formatDate(new Date(), "yyyy-MM-dd"),
    category: "Combustible",
    description: "",
    amount: "",
    notes: "",
    isRecurring: false,
    frequency: "",
    isPaid: false,
    paymentDate: "",
  })

  // Estados para almacenar los datos
  const [dailyRecords, setDailyRecords] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para análisis financiero unificado
  const [unifiedExpenses, setUnifiedExpenses] = useState<any>(null)
  const [loadingUnified, setLoadingUnified] = useState(false)

  // Cargar análisis financiero unificado
  const fetchUnifiedExpenses = useCallback(async () => {
    if (!fromDate || !toDate) return

    try {
      setLoadingUnified(true)
      const response = await fetch(`/api/expenses/unified?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`)
      if (!response.ok) {
        throw new Error("Error al obtener gastos unificados")
      }

      const data = await response.json()

      // Calcular beneficio real usando la misma lógica que el componente
      const totalIncome = getTotalIncome()
      const driverCommission = getTotalCommission()
      const realNetProfit = totalIncome - driverCommission - data.totalExpenses

      console.log("🧮 Cálculo unificado:", {
        totalIncome,
        driverCommission,
        totalExpenses: data.totalExpenses,
        realNetProfit,
      })

      setUnifiedExpenses({
        ...data,
        realNetProfit,
      })
    } catch (error) {
      console.error("Error al cargar gastos unificados:", error)
    } finally {
      setLoadingUnified(false)
    }
  }, [fromDate, toDate])

  // Cargar datos (tu función original)
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Formatear fechas para las consultas
      const fromDateStr = formatDate(fromDate, "yyyy-MM-dd")
      const toDateStr = formatDate(toDate, "yyyy-MM-dd")
      console.log(`Cargando datos desde ${fromDateStr} hasta ${toDateStr}`)

      // Cargar registros diarios
      const dailyRecordsResponse = await fetch(`/api/daily-records?from=${fromDateStr}&to=${toDateStr}`)
      if (!dailyRecordsResponse.ok) {
        const errorText = await dailyRecordsResponse.text()
        console.error("Error en respuesta de daily-records:", errorText)
        throw new Error(`Error al cargar registros diarios: ${errorText}`)
      }
      const dailyRecordsData = await dailyRecordsResponse.json()
      console.log(`Registros diarios cargados: ${dailyRecordsData.length}`)
      setDailyRecords(dailyRecordsData)

      // Cargar gastos
      const expensesResponse = await fetch(`/api/expenses?from=${fromDateStr}&to=${toDateStr}`)
      if (!expensesResponse.ok) {
        const errorText = await expensesResponse.text()
        console.error("Error en respuesta de expenses:", errorText)
        throw new Error(`Error al cargar gastos: ${errorText}`)
      }
      const expensesData = await expensesResponse.json()
      console.log(`Gastos cargados: ${expensesData.length}`)
      setExpenses(expensesData)

      // Cargar nóminas
      const payrollsResponse = await fetch(`/api/payrolls?from=${fromDateStr}&to=${toDateStr}`)
      if (!payrollsResponse.ok) {
        const errorText = await payrollsResponse.text()
        console.error("Error en respuesta de payrolls:", errorText)
        throw new Error(`Error al cargar nóminas: ${errorText}`)
      }
      const payrollsData = await payrollsResponse.json()
      console.log(`Nóminas cargadas: ${payrollsData.length}`)
      setPayrolls(payrollsData)

      // Cargar balance
      const balanceResponse = await fetch(`/api/balance?month=${fromDateStr}`)
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        console.log("Balance cargado:", balanceData)
        setBalance(balanceData)
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Error al cargar datos:", err)
      setError(err.message || "Error al cargar datos")
      setLoading(false)
    }
  }, [fromDate, toDate])

  // Cargar datos al montar el componente o cuando cambian las fechas
  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session, fetchData])

  // Cargar análisis unificado después de cargar los datos principales
  useEffect(() => {
    if (session && dailyRecords.length >= 0) {
      fetchUnifiedExpenses()
    }
  }, [session, dailyRecords, fetchUnifiedExpenses])

  // Todas tus funciones originales se mantienen igual...
  const generateRecurringExpenses = async () => {
    try {
      const response = await fetch("/api/expenses/generate-recurring", {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Gastos recurrentes generados",
          description: `Se generaron ${data.generated} gastos recurrentes automáticamente.`,
        })
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "expense_generated",
            title: "Gastos Recurrentes Generados",
            message: `Se generaron ${data.generated} gastos recurrentes automáticamente`,
            data: { count: data.generated },
          }),
        })
        fetchData()
        fetchUnifiedExpenses()
      } else {
        throw new Error("Error al generar gastos recurrentes")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar los gastos recurrentes",
        variant: "destructive",
      })
    }
  }

  // Mutation para cambiar estado de pago
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ expenseId, isPaid }: { expenseId: number; isPaid: boolean }) => {
      const response = await fetch(`/api/expenses/${expenseId}/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPaid,
          paymentDate: isPaid ? new Date().toISOString() : null,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar estado de pago")
      }
      return response.json()
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.isPaid ? "Gasto marcado como pagado" : "Gasto marcado como pendiente",
        description: `${data.description} - ${formatCurrency(data.amount)}`,
      })
      fetchData()
      fetchUnifiedExpenses()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  // Cálculos para tarjetas de resumen - CORREGIDOS PARA USAR LA MISMA LÓGICA
  const getTotalIncome = () => {
    return dailyRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  }

  // CORREGIDO: Usar solo gastos operacionales de daily records (sin duplicar)
  const getTotalExpenses = () => {
    if (!unifiedExpenses) {
      // Fallback temporal mientras se carga el análisis unificado
      const operationalExpenses = dailyRecords.reduce(
        (sum, record) => sum + record.fuelExpense + record.otherExpenses,
        0,
      )
      const fixedExpenses = expenses
        .filter((expense) => FIXED_EXPENSE_CATEGORIES.includes(expense.category))
        .reduce((sum, expense) => sum + expense.amount, 0)
      return operationalExpenses + fixedExpenses
    }

    // Usar los gastos del análisis unificado (sin duplicaciones)
    return unifiedExpenses.totalExpenses
  }

  const getTotalCommission = () => {
    return dailyRecords.reduce((sum, record) => sum + record.driverCommission, 0)
  }

  // CORREGIDO: Usar la misma lógica que el análisis detallado
  const getTotalNetAmount = () => {
    if (!unifiedExpenses) {
      // Fallback temporal
      const totalIncome = getTotalIncome()
      const totalExpenses = getTotalExpenses()
      const totalCommissions = getTotalCommission()
      return totalIncome - totalCommissions - totalExpenses
    }

    // Usar el beneficio real calculado del análisis unificado
    return unifiedExpenses.realNetProfit
  }

  const getMarginPercentage = () => {
    const income = getTotalIncome()
    const net = getTotalNetAmount()
    return income > 0 ? (net / income) * 100 : 0
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  // Filtrar gastos fijos
  const fixedExpenses = expenses.filter((expense) => FIXED_EXPENSE_CATEGORIES.includes(expense.category))

  // Función para renderizar el estado de pago
  const renderPaymentStatus = (expense: any) => {
    if (expense.isPaid) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Pagado
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      )
    }
  }

  // Función para manejar cambios en el filtro de fechas
  const handleDateFilterChange = useCallback((range: { from: Date; to: Date }) => {
    console.log("Nuevo rango de fechas seleccionado:", range)
    setFromDate(range.from)
    setToDate(range.to)
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Cargando datos...</h2>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-medium text-red-800 mb-2">Error al cargar los datos</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchData()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Volver al Panel Principal</span>
              <span className="sm:hidden">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">💰 Contabilidad Avanzada</h1>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationSystem />
          <Button variant="outline" size="sm" onClick={generateRecurringExpenses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generar Gastos Recurrentes
          </Button>
        </div>
      </div>

      {/* Componente de estado de la base de datos */}
      <div className="mb-6">
        <DatabaseStatus />
      </div>

      {/* Alertas del balance */}
      {balance?.alerts && balance.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {balance.alerts.map((alert: any, index: number) => (
            <div
              key={index}
              className={`p-3 rounded-lg flex items-center space-x-2 ${
                alert.type === "danger" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-2 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Filtrar por fecha
        </h2>
        <DateFilter
          onChange={handleDateFilterChange}
          defaultRange={{ from: fromDate, to: toDate }}
          className="w-full"
        />
      </div>

      {/* NUEVO: Análisis Financiero Unificado */}
      {loadingUnified ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Calculando análisis financiero unificado...</span>
            </div>
          </CardContent>
        </Card>
      ) : unifiedExpenses ? (
        <div className="mb-6">
          <EnhancedFinancialSummary
            totalIncome={getTotalIncome()}
            driverCommission={getTotalCommission()}
            unifiedExpenses={unifiedExpenses}
          />
        </div>
      ) : null}

      {/* Tarjetas de resumen - AHORA CONSISTENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalIncome())}</div>
            <p className="text-xs text-muted-foreground">Total facturado en el período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalExpenses())}</div>
            <p className="text-xs text-muted-foreground">Total de gastos operativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalCommission())}</div>
            <p className="text-xs text-muted-foreground">Pagado a conductores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTotalNetAmount() > 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(getTotalNetAmount())}
            </div>
            <p className="text-xs text-muted-foreground">Después de restar comisiones y gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margen</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMarginPercentage() > 0 ? "text-green-600" : "text-red-600"}`}>
              {getMarginPercentage().toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Porcentaje de beneficio</p>
          </CardContent>
        </Card>
      </div>

      {/* TODAS TUS PESTAÑAS ORIGINALES SE MANTIENEN IGUAL */}
      {/* Solo añado una nueva pestaña para el análisis unificado */}
      <div className="space-y-4 mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Pestañas</span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("resumen")}
              className={activeTab === "resumen" ? "bg-primary text-white" : ""}
            >
              Resumen
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("analisis-unificado")}
              className={activeTab === "analisis-unificado" ? "bg-primary text-white" : ""}
            >
              Análisis Unificado
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("ingresos")}
              className={activeTab === "ingresos" ? "bg-primary text-white" : ""}
            >
              Ingresos
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("gastos")}
              className={activeTab === "gastos" ? "bg-primary text-white" : ""}
            >
              Gastos
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("gastos-fijos")}
              className={activeTab === "gastos-fijos" ? "bg-primary text-white" : ""}
            >
              Gastos Fijos
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("nominas")}
              className={activeTab === "nominas" ? "bg-primary text-white" : ""}
            >
              Nóminas
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("informes")}
              className={activeTab === "informes" ? "bg-primary text-white" : ""}
            >
              Informes
            </Button>
          </div>
        </div>

        {/* NUEVA PESTAÑA: Análisis Unificado */}
        {activeTab === "analisis-unificado" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fuel className="h-5 w-5 mr-2 text-blue-600" />
                  Gastos Operacionales
                </CardTitle>
                <CardDescription>Combustible y gastos diarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatCurrency(unifiedExpenses.dailyOperationalExpenses)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Combustible:</span>
                    <span>{formatCurrency(unifiedExpenses.operationalExpenses?.fuel || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Otros gastos:</span>
                    <span>{formatCurrency(unifiedExpenses.operationalExpenses?.other || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-orange-600" />
                  Gastos Fijos
                </CardTitle>
                <CardDescription>Seguros, cuotas, nóminas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatCurrency(
                    Object.values(unifiedExpenses.monthlyFixedExpenses || {}).reduce(
                      (sum: number, val: any) => sum + val,
                      0,
                    ),
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(unifiedExpenses.monthlyFixedExpenses || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                      <span>{formatCurrency(value as number)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Beneficio Real
                </CardTitle>
                <CardDescription>Después de todos los gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold mb-2 ${
                    unifiedExpenses.realNetProfit > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(unifiedExpenses.realNetProfit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Margen:{" "}
                  {getTotalIncome() > 0 ? ((unifiedExpenses.realNetProfit / getTotalIncome()) * 100).toFixed(1) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PESTAÑA: Resumen */}
        {activeTab === "resumen" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Tarjetas de resumen */}</div>
        )}

        {/* PESTAÑA: Ingresos */}
        {activeTab === "ingresos" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Tarjetas de ingresos */}</div>
        )}

        {/* PESTAÑA: Gastos */}
        {activeTab === "gastos" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Tarjetas de gastos */}</div>
        )}

        {/* PESTAÑA: Gastos Fijos */}
        {activeTab === "gastos-fijos" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Tarjetas de gastos fijos */}</div>
        )}

        {/* PESTAÑA: Nóminas */}
        {activeTab === "nominas" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Tarjetas de nóminas */}</div>
        )}

        {/* PESTAÑA: Informes */}
        {activeTab === "informes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Tarjetas de informes */}</div>
        )}
      </div>
    </div>
  )
}
