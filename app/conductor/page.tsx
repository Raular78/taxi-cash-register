"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format, startOfWeek, endOfWeek, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { CalendarDays, Car, CreditCard, DollarSign, FileText, Fuel, Plus, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface DailyRecord {
  id: number
  date: string
  totalKm: number
  totalAmount: number
  cashAmount: number
  cardAmount: number
  fuelExpense: number
  driverCommission: number
  netAmount: number
  shiftStart: string | null
  shiftEnd: string | null
}

interface ChartData {
  name: string
  ingresos: number
  gastos: number
  comision: number
}

export default function ConductorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartData[]>([])

  // Estado para el selector de rango de fechas
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && dateRange?.from && dateRange?.to) {
      fetchData(dateRange.from, dateRange.to)
    }
  }, [status, dateRange])

  const fetchData = async (startDate: Date, endDate: Date) => {
    setIsLoading(true)
    try {
      // Obtener registros diarios del rango de fechas seleccionado
      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")

      const recordsResponse = await fetch(
        `/api/daily-records?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
      )

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setDailyRecords(recordsData)

        // Preparar datos para el gráfico
        const chartData = processChartData(recordsData)
        setChartData(chartData)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const processChartData = (records: DailyRecord[]): ChartData[] => {
    // Agrupar por día de la semana
    const groupedByDay = records.reduce((acc: Record<string, ChartData>, record) => {
      const date = new Date(record.date)
      const dayName = format(date, "EEE", { locale: es })

      if (!acc[dayName]) {
        acc[dayName] = {
          name: dayName,
          ingresos: 0,
          gastos: 0,
          comision: 0,
        }
      }

      acc[dayName].ingresos += record.totalAmount
      acc[dayName].gastos += record.fuelExpense
      acc[dayName].comision += record.driverCommission

      return acc
    }, {})

    // Convertir a array para el gráfico
    return Object.values(groupedByDay)
  }

  const calculateTotals = () => {
    return dailyRecords.reduce(
      (acc, record) => {
        acc.totalKm += record.totalKm
        acc.totalAmount += record.totalAmount
        acc.cashAmount += record.cashAmount
        acc.cardAmount += record.cardAmount
        acc.fuelExpense += record.fuelExpense
        acc.driverCommission += record.driverCommission
        acc.netAmount += record.netAmount
        return acc
      },
      {
        totalKm: 0,
        totalAmount: 0,
        cashAmount: 0,
        cardAmount: 0,
        fuelExpense: 0,
        driverCommission: 0,
        netAmount: 0,
      },
    )
  }

  const totals = calculateTotals()

  // Funciones para los presets de fechas
  const setThisWeek = () => {
    setDateRange({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    })
  }

  const setLastMonth = () => {
    const today = new Date()
    const lastMonth = subMonths(today, 1)
    setDateRange({
      from: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Panel del Conductor</h1>
        <div className="flex flex-wrap gap-2">
          {/* Selector de rango de fechas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white text-black border-2 shadow-xl"
              align="end"
              sideOffset={5}
              style={{ backgroundColor: "white", color: "black", opacity: 1 }}
            >
              <div className="p-3 border-b bg-white text-black" style={{ backgroundColor: "white", color: "black" }}>
                <div className="flex justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={setThisWeek} className="text-black border-black">
                    Esta semana
                  </Button>
                  <Button variant="outline" size="sm" onClick={setLastMonth} className="text-black border-black">
                    Último mes
                  </Button>
                </div>
              </div>
              <div className="bg-white p-4 rounded-b-md" style={{ backgroundColor: "white" }}>
                <style jsx global>{`
                  .rdp {
                    --rdp-cell-size: 40px;
                    --rdp-accent-color: #0000ff;
                    --rdp-background-color: #e7edff;
                    --rdp-accent-color-dark: #3003e1;
                    --rdp-background-color-dark: #180270;
                    --rdp-outline: 2px solid var(--rdp-accent-color);
                    --rdp-outline-selected: 2px solid rgba(0, 0, 0, 0.75);
                    --rdp-selected-color: #fff;
                    --rdp-text-color: black;
                    margin: 0;
                  }
                  .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                    color: white;
                    background-color: var(--rdp-accent-color);
                  }
                  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                    background-color: #f0f0f0;
                  }
                `}</style>
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className="bg-white border rounded-md"
                  classNames={{
                    day_selected: "bg-blue-600 text-white",
                    day_today: "bg-gray-100 text-black font-bold",
                    day_range_middle: "bg-blue-100 text-black",
                    day_range_end: "bg-blue-600 text-white",
                    day_range_start: "bg-blue-600 text-white",
                    button: "text-black hover:bg-gray-100",
                    caption_label: "text-black font-bold",
                    nav_button: "text-black hover:bg-gray-100",
                    table: "bg-white border-collapse",
                    head_cell: "text-black font-bold",
                    cell: "text-black",
                    day: "text-black hover:bg-gray-100",
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={() => router.push("/conductor/registros-diarios")}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Registros
          </Button>
          <Button onClick={() => router.push("/conductor/nuevo-registro")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                "Período seleccionado"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-green-500" />
              {totals.totalAmount.toFixed(2)}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kilómetros</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                "Período seleccionado"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Car className="mr-2 h-5 w-5 text-blue-500" />
              {totals.totalKm} km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos Combustible</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                "Período seleccionado"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Fuel className="mr-2 h-5 w-5 text-red-500" />
              {totals.fuelExpense.toFixed(2)}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comisión Conductor</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                "Período seleccionado"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-purple-500" />
              {totals.driverCommission.toFixed(2)}€
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Evolución Semanal</CardTitle>
            <CardDescription>Ingresos, gastos y comisiones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" />
                    <Bar dataKey="gastos" name="Gastos" fill="#ef4444" />
                    <Bar dataKey="comision" name="Comisión" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay datos suficientes para mostrar el gráfico</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen" className="mb-6">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
              <CardDescription>
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -
                    {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                  </>
                ) : (
                  "Período seleccionado"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Ingresos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Efectivo:</span>
                      <span>{totals.cashAmount.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarjeta:</span>
                      <span>{totals.cardAmount.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{totals.totalAmount.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Gastos y Comisiones</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Combustible:</span>
                      <span>{totals.fuelExpense.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comisión:</span>
                      <span>{totals.driverCommission.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Neto:</span>
                      <span>{totals.netAmount.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/conductor/registros-diarios")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Ver todos los registros
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="detalles">
          <Card>
            <CardHeader>
              <CardTitle>Registros Diarios</CardTitle>
              <CardDescription>Registros del período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Km</th>
                        <th className="text-right py-2">Ingresos</th>
                        <th className="text-right py-2">Gastos</th>
                        <th className="text-right py-2">Comisión</th>
                        <th className="text-right py-2">Horario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{format(new Date(record.date), "dd/MM/yyyy")}</td>
                          <td className="text-right py-2">{record.totalKm} km</td>
                          <td className="text-right py-2">{record.totalAmount.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.fuelExpense.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.driverCommission.toFixed(2)}€</td>
                          <td className="text-right py-2">
                            {record.shiftStart && record.shiftEnd
                              ? `${record.shiftStart} - ${record.shiftEnd}`
                              : "No registrado"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">No hay registros para este período</div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/conductor/nuevo-registro")}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir nuevo registro
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

