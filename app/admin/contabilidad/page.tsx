"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Percent,
  CreditCard,
  FileText,
  TrendingUp,
  Fuel,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { DateFilter } from "../../../components/date-filter"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DatabaseStatus } from "../../../components/database-status"
import { toast } from "../../../components/ui/use-toast"

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

export default function ContabilidadPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Fechas iniciales (primer y último día del mes actual)
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)))
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()))

  const [activeTab, setActiveTab] = useState("resumen")
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [expenseFormData, setExpenseFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    category: "Combustible",
    description: "",
    amount: "",
    notes: "",
  })

  // Estados para almacenar los datos
  const [dailyRecords, setDailyRecords] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Formatear fechas para las consultas
      const fromDateStr = format(fromDate, "yyyy-MM-dd")
      const toDateStr = format(toDate, "yyyy-MM-dd")

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

  // Mutation para añadir un nuevo gasto
  const addExpenseMutation = useMutation({
    mutationFn: async (newExpense: any) => {
      console.log("Enviando datos de gasto:", newExpense)

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(errorData.error || "Error al crear gasto")
      }

      const data = await response.json()
      console.log("Respuesta del servidor:", data)
      return data
    },
    onSuccess: (data) => {
      // Mostrar mensaje de éxito
      toast({
        title: "Gasto creado",
        description: `Se ha creado el gasto de ${formatCurrency(data.amount)} correctamente.`,
        variant: "default",
      })

      // Recargar datos
      fetchData()

      // Cerrar diálogo y resetear formulario
      setIsAddExpenseDialogOpen(false)
      setExpenseFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        category: "Combustible",
        description: "",
        amount: "",
        notes: "",
      })
    },
    onError: (error) => {
      console.error("Error en la mutación:", error)
      toast({
        title: "Error",
        description: `No se pudo crear el gasto: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  // Función para manejar cambios en el filtro de fechas
  const handleDateFilterChange = useCallback((range: { from: Date; to: Date }) => {
    console.log("Nuevo rango de fechas seleccionado:", range)
    setFromDate(range.from)
    setToDate(range.to)
  }, [])

  const handleExpenseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setExpenseFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleExpenseSelectChange = (name: string, value: string) => {
    setExpenseFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddExpense = async () => {
    try {
      if (!expenseFormData.category || !expenseFormData.description || !expenseFormData.amount) {
        toast({
          title: "Campos incompletos",
          description: "Por favor, completa todos los campos obligatorios",
          variant: "destructive",
        })
        return
      }

      const amount = Number.parseFloat(expenseFormData.amount.replace(",", "."))
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Importe inválido",
          description: "Por favor, introduce un importe válido",
          variant: "destructive",
        })
        return
      }

      // Use the mutation to add the expense
      addExpenseMutation.mutate({
        date: expenseFormData.date,
        category: expenseFormData.category,
        description: expenseFormData.description,
        amount,
        notes: expenseFormData.notes || null,
        status: "approved", // Aprobamos automáticamente
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el gasto",
        variant: "destructive",
      })
    }
  }

  // Filtrar gastos fijos
  const fixedExpenses = expenses.filter((expense) => FIXED_EXPENSE_CATEGORIES.includes(expense.category))

  // Cálculos para tarjetas de resumen
  const getTotalIncome = () => {
    return dailyRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  }

  const getTotalExpenses = () => {
    // Gastos operacionales de registros diarios
    const operationalExpenses = dailyRecords.reduce((sum, record) => sum + record.fuelExpense + record.otherExpenses, 0)

    // Todos los gastos de la tabla de gastos (no solo los fijos)
    const allExpensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Nóminas
    const payrollsTotal = payrolls.reduce((sum, payroll) => sum + payroll.netAmount, 0)

    console.log("Calculando total de gastos:", {
      operationalExpenses,
      allExpensesTotal,
      payrollsTotal,
      total: operationalExpenses + allExpensesTotal + payrollsTotal,
    })

    return operationalExpenses + allExpensesTotal + payrollsTotal
  }

  const getTotalCommission = () => {
    return dailyRecords.reduce((sum, record) => sum + record.driverCommission, 0)
  }

  // Modificar la función getTotalNetAmount para que reste correctamente los gastos
  const getTotalNetAmount = () => {
    const totalIncome = getTotalIncome()
    const totalExpenses = getTotalExpenses()
    const totalCommissions = getTotalCommission()

    // El beneficio neto es ingresos - gastos - comisiones
    const netAmount = totalIncome - totalExpenses - totalCommissions

    console.log("Calculando beneficio neto:", {
      totalIncome,
      totalExpenses,
      totalCommissions,
      netAmount,
    })

    return netAmount
  }

  const getMarginPercentage = () => {
    const income = getTotalIncome()
    const net = getTotalNetAmount()
    return income > 0 ? (net / income) * 100 : 0
  }

  // Datos para gráficos
  const prepareMonthlyData = () => {
    // Agrupar por mes
    const groupedByMonth = dailyRecords.reduce(
      (acc, record) => {
        const month = format(new Date(record.date), "MM/yyyy")
        if (!acc[month]) {
          acc[month] = {
            month,
            ingresos: 0,
            gastos: 0,
            comision: 0,
            neto: 0,
          }
        }

        acc[month].ingresos += record.totalAmount
        acc[month].gastos += record.fuelExpense + record.otherExpenses
        acc[month].comision += record.driverCommission
        acc[month].neto += record.netAmount

        return acc
      },
      {} as Record<string, any>,
    )

    // Añadir gastos fijos por mes
    fixedExpenses.forEach((expense) => {
      const month = format(new Date(expense.date), "MM/yyyy")
      if (groupedByMonth[month]) {
        groupedByMonth[month].gastos += expense.amount
        groupedByMonth[month].neto -= expense.amount
      }
    })

    // Añadir nóminas por mes
    payrolls.forEach((payroll) => {
      const month = format(new Date(payroll.periodEnd), "MM/yyyy")
      if (groupedByMonth[month]) {
        groupedByMonth[month].gastos += payroll.netAmount
        groupedByMonth[month].neto -= payroll.netAmount
      }
    })

    // Convertir a array y ordenar por mes
    return Object.values(groupedByMonth).sort((a, b) => {
      const [monthA, yearA] = a.month.split("/")
      const [monthB, yearB] = b.month.split("/")
      const dateA = new Date(Number.parseInt(yearA), Number.parseInt(monthA) - 1)
      const dateB = new Date(Number.parseInt(yearB), Number.parseInt(monthB) - 1)
      return dateA.getTime() - dateB.getTime()
    })
  }

  const monthlyData = prepareMonthlyData()

  // Datos para gráfico de distribución de gastos
  const prepareExpensesData = () => {
    const totalFuel = expenses
      .filter((expense) => expense.category === "Combustible")
      .reduce((sum, expense) => sum + expense.amount, 0)

    const totalOther = expenses
      .filter((expense) => expense.category !== "Combustible" && !FIXED_EXPENSE_CATEGORIES.includes(expense.category))
      .reduce((sum, expense) => sum + expense.amount, 0)

    const totalCommission = getTotalCommission()
    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalPayrolls = payrolls.reduce((sum, payroll) => sum + payroll.netAmount, 0)

    return [
      { name: "Combustible", value: totalFuel },
      { name: "Otros gastos", value: totalOther },
      { name: "Comisiones", value: totalCommission },
      { name: "Gastos fijos", value: totalFixed },
      { name: "Nóminas", value: totalPayrolls },
    ]
  }

  const expensesData = prepareExpensesData()
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  // Calcular total anual de gastos fijos
  const calculateAnnualFixedExpenses = () => {
    return fixedExpenses.reduce((total, expense) => {
      let annualAmount = expense.amount
      // Multiplicar por frecuencia si existe
      if (expense.frequency) {
        switch (expense.frequency) {
          case "monthly":
            annualAmount *= 12
            break
          case "quarterly":
            annualAmount *= 4
            break
          case "biannual":
            annualAmount *= 2
            break
          // Para anual, ya es el importe anual
        }
      }
      return total + annualAmount
    }, 0)
  }

  const annualFixedExpensesTotal = calculateAnnualFixedExpenses()

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
          <h1 className="text-2xl md:text-3xl font-bold">Contabilidad</h1>
        </div>
      </div>

      {/* Componente de estado de la base de datos */}
      <div className="mb-6">
        <DatabaseStatus />
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-2">Filtrar por fecha</h2>
        <DateFilter
          onChange={handleDateFilterChange}
          defaultRange={{ from: fromDate, to: toDate }}
          className="w-full"
        />
      </div>

      {/* Tarjetas de resumen */}
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

        {/* Asegurar que la descripción en la tarjeta de Beneficio Neto sea correcta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalNetAmount())}</div>
            <p className="text-xs text-muted-foreground">Después de restar comisiones y gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margen</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMarginPercentage().toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Porcentaje de beneficio</p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas */}
      <Tabs defaultValue="resumen" value={activeTab} onValueChange={setActiveTab} className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="gastos-fijos">Gastos Fijos</TabsTrigger>
          <TabsTrigger value="nominas">Nóminas</TabsTrigger>
          <TabsTrigger value="informes">Informes</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolución Mensual</CardTitle>
                <CardDescription>Ingresos, gastos y beneficio neto</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#4f46e5" />
                      <Bar dataKey="gastos" name="Gastos" fill="#ef4444" />
                      <Bar dataKey="neto" name="Beneficio Neto" fill="#10b981" />
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
                <CardTitle>Distribución de Gastos</CardTitle>
                <CardDescription>Desglose por categoría</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {expensesData.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
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
                <CardTitle>Resumen por Conductor</CardTitle>
                <CardDescription>Ingresos y gastos por conductor</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {dailyRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conductor</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead>Gastos</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Neto</TableHead>
                        <TableHead>Margen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(
                        dailyRecords.reduce(
                          (acc, record) => {
                            const driverId = record.driverId
                            const driverName = record.driver?.username || `Conductor ${driverId}`

                            if (!acc[driverId]) {
                              acc[driverId] = {
                                name: driverName,
                                ingresos: 0,
                                gastos: 0,
                                comision: 0,
                                neto: 0,
                              }
                            }

                            acc[driverId].ingresos += record.totalAmount
                            acc[driverId].gastos += record.fuelExpense + record.otherExpenses
                            acc[driverId].comision += record.driverCommission
                            acc[driverId].neto += record.netAmount

                            return acc
                          },
                          {} as Record<string, any>,
                        ),
                      ).map(([driverId, data]) => (
                        <TableRow key={driverId}>
                          <TableCell>{data.name}</TableCell>
                          <TableCell>{formatCurrency(data.ingresos)}</TableCell>
                          <TableCell>{formatCurrency(data.gastos)}</TableCell>
                          <TableCell>{formatCurrency(data.comision)}</TableCell>
                          <TableCell>{formatCurrency(data.neto)}</TableCell>
                          <TableCell>
                            {data.ingresos > 0 ? ((data.neto / data.ingresos) * 100).toFixed(2) : 0}%
                          </TableCell>
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

        <TabsContent value="ingresos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detalle de Ingresos</CardTitle>
                <CardDescription>Desglose por método de pago</CardDescription>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Efectivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dailyRecords.reduce((sum, record) => sum + (record.cashAmount || 0), 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tarjeta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dailyRecords.reduce((sum, record) => sum + (record.cardAmount || 0), 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Facturación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dailyRecords.reduce((sum, record) => sum + (record.invoiceAmount || 0), 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Otros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dailyRecords.reduce((sum, record) => sum + (record.otherAmount || 0), 0))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {dailyRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Conductor</TableHead>
                        <TableHead>Efectivo</TableHead>
                        <TableHead>Tarjeta</TableHead>
                        <TableHead>Facturación</TableHead>
                        <TableHead>Otros</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell>{record.driver?.username || `Conductor ${record.driverId}`}</TableCell>
                          <TableCell>{formatCurrency(record.cashAmount || 0)}</TableCell>
                          <TableCell>{formatCurrency(record.cardAmount || 0)}</TableCell>
                          <TableCell>{formatCurrency(record.invoiceAmount || 0)}</TableCell>
                          <TableCell>{formatCurrency(record.otherAmount || 0)}</TableCell>
                          <TableCell>{formatCurrency(record.totalAmount)}</TableCell>
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

        <TabsContent value="gastos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detalle de Gastos</CardTitle>
                <CardDescription>Desglose por categoría</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => window.open("/api/export/expenses", "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => setIsAddExpenseDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Gasto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Combustible</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        expenses
                          .filter((expense) => expense.category === "Combustible")
                          .reduce((sum, expense) => sum + expense.amount, 0),
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Otros Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        expenses
                          .filter((expense) => expense.category !== "Combustible")
                          .reduce((sum, expense) => sum + expense.amount, 0),
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Importe</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                expense.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : expense.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {expense.status === "approved"
                                ? "Aprobado"
                                : expense.status === "rejected"
                                  ? "Rechazado"
                                  : "Pendiente"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No hay gastos registrados en este período.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gastos-fijos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gastos Fijos</CardTitle>
                <CardDescription>Nóminas, seguridad social, cuotas y otros gastos fijos</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => window.open("/api/export/expenses?type=fixed", "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button asChild>
                  <Link href="/admin/gastos-fijos">
                    <Plus className="h-4 w-4 mr-2" />
                    Gestionar Gastos Fijos
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(
                  fixedExpenses.reduce(
                    (acc, expense) => {
                      if (!acc[expense.category]) {
                        acc[expense.category] = 0
                      }
                      acc[expense.category] += expense.amount
                      return acc
                    },
                    {} as Record<string, number>,
                  ),
                ).map(([category, amount]) => (
                  <Card key={category} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatCurrency(amount)}</div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="bg-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Gastos Fijos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Proyección Anual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(annualFixedExpensesTotal)}</div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expense.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : expense.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {expense.status === "approved"
                            ? "Aprobado"
                            : expense.status === "rejected"
                              ? "Rechazado"
                              : "Pendiente"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nominas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Nóminas</CardTitle>
                <CardDescription>Pagos a empleados</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => window.open("/api/export/payrolls", "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button asChild>
                  <Link href="/admin/nominas">
                    <Plus className="h-4 w-4 mr-2" />
                    Gestionar Nóminas
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Nóminas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(payrolls.reduce((sum, payroll) => sum + payroll.netAmount, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Salario Base</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(payrolls.reduce((sum, payroll) => sum + payroll.baseSalary, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Comisiones y Bonos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(
                        payrolls.reduce((sum, payroll) => sum + payroll.commissions + payroll.bonuses, 0),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {payrolls.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Salario Base</TableHead>
                        <TableHead>Comisiones</TableHead>
                        <TableHead>Bonos</TableHead>
                        <TableHead>Deducciones</TableHead>
                        <TableHead>Retención</TableHead>
                        <TableHead>Neto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell>
                            {format(new Date(payroll.periodStart), "dd/MM/yyyy", { locale: es })} -{" "}
                            {format(new Date(payroll.periodEnd), "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>{payroll.user?.username || `Empleado ${payroll.userId}`}</TableCell>
                          <TableCell>{formatCurrency(payroll.baseSalary)}</TableCell>
                          <TableCell>{formatCurrency(payroll.commissions)}</TableCell>
                          <TableCell>{formatCurrency(payroll.bonuses)}</TableCell>
                          <TableCell>{formatCurrency(payroll.deductions)}</TableCell>
                          <TableCell>{formatCurrency(payroll.taxWithholding)}</TableCell>
                          <TableCell>{formatCurrency(payroll.netAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No hay nóminas registradas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="informes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Informes Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Informe Mensual</h3>
                        <p className="text-sm text-muted-foreground">Resumen completo del mes</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Informe de Ingresos</h3>
                        <p className="text-sm text-muted-foreground">Desglose por método de pago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Fuel className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Informe de Gastos</h3>
                        <p className="text-sm text-muted-foreground">Desglose por categoría</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Informe de Rentabilidad</h3>
                        <p className="text-sm text-muted-foreground">Análisis de márgenes y beneficios</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generar Informe Personalizado</CardTitle>
                <CardDescription>Selecciona los parámetros para tu informe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Informe</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Resumen General</option>
                        <option>Ingresos Detallados</option>
                        <option>Gastos Detallados</option>
                        <option>Análisis de Rentabilidad</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Formato</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>PDF</option>
                        <option>Excel</option>
                        <option>CSV</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <div className="flex space-x-2">
                      <select className="w-full p-2 border rounded-md">
                        <option>Último Mes</option>
                        <option>Último Trimestre</option>
                        <option>Último Año</option>
                        <option>Personalizado</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Incluir Gráficos</label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includeCharts" className="rounded" />
                      <label htmlFor="includeCharts">Añadir visualizaciones gráficas</label>
                    </div>
                  </div>

                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Informe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para añadir gasto */}
      <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Gasto</DialogTitle>
            <DialogDescription>
              Introduce los datos del gasto. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">Fecha *</Label>
              <Input
                id="expense-date"
                name="date"
                type="date"
                value={expenseFormData.date}
                onChange={handleExpenseInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoría *</Label>
              <Select
                value={expenseFormData.category}
                onValueChange={(value) => handleExpenseSelectChange("category", value)}
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Combustible">Combustible</SelectItem>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                  <SelectItem value="Limpieza">Limpieza</SelectItem>
                  <SelectItem value="alquiler">Alquiler</SelectItem>
                  <SelectItem value="seguros">Seguros</SelectItem>
                  <SelectItem value="impuestos">Impuestos</SelectItem>
                  <SelectItem value="servicios">Servicios</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Descripción *</Label>
              <Input
                id="expense-description"
                name="description"
                value={expenseFormData.description}
                onChange={handleExpenseInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Importe (€) *</Label>
              <Input
                id="expense-amount"
                name="amount"
                type="text"
                value={expenseFormData.amount}
                onChange={handleExpenseInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notas</Label>
              <Input
                id="expense-notes"
                name="notes"
                value={expenseFormData.notes}
                onChange={handleExpenseInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending}>
              {addExpenseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

