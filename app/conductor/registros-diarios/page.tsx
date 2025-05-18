"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "..\..\..\components\ui/card"
import { Button } from "..\..\..\components\ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "..\..\..\components\ui/tabs"
import { ChevronLeft, Download, Edit, Plus } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { SimpleDateRangePicker } from "..\..\components\ui\simple-date-range-picker"

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
  otherExpenseNotes: string | null
  driverCommission: number
  netAmount: number
  notes: string | null
  shiftStart: string | null
  shiftEnd: string | null
  imageUrl: string | null
  driverId: number
  createdAt: string
  updatedAt: string
  driver: {
    id: number
    username: string
    email: string
  }
}

export default function DailyRecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && dateRange?.from && dateRange?.to) {
      fetchDailyRecords()
    }
  }, [status, dateRange])

  const fetchDailyRecords = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setIsLoading(true)
    try {
      const formattedStartDate = format(dateRange.from, "yyyy-MM-dd")
      const formattedEndDate = format(dateRange.to, "yyyy-MM-dd")

      const response = await fetch(`/api/daily-records?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)

      if (response.ok) {
        const data = await response.json()
        setDailyRecords(data)
      } else {
        console.error("Error al obtener registros diarios")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotals = () => {
    return dailyRecords.reduce(
      (acc, record) => {
        acc.totalKm += record.totalKm
        acc.totalAmount += record.totalAmount
        acc.cashAmount += record.cashAmount
        acc.cardAmount += record.cardAmount
        acc.invoiceAmount += record.invoiceAmount
        acc.otherAmount += record.otherAmount
        acc.fuelExpense += record.fuelExpense
        acc.otherExpenses += record.otherExpenses
        acc.driverCommission += record.driverCommission
        acc.netAmount += record.netAmount
        return acc
      },
      {
        totalKm: 0,
        totalAmount: 0,
        cashAmount: 0,
        cardAmount: 0,
        invoiceAmount: 0,
        otherAmount: 0,
        fuelExpense: 0,
        otherExpenses: 0,
        driverCommission: 0,
        netAmount: 0,
      },
    )
  }

  const totals = calculateTotals()

  const handleEditRecord = (id: number) => {
    router.push(`/conductor/editar-registro/${id}`)
  }

  const handleExportToPDF = () => {
    // Implementar exportación a PDF
    alert("Exportación a PDF no implementada aún")
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push("/conductor")} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Registros Diarios</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <SimpleDateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

          <Button onClick={() => router.push("/conductor/nuevo-registro")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen del Período</CardTitle>
          <CardDescription>
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", {
                  locale: es,
                })}`
              : "Selecciona un rango de fechas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Kilómetros Totales</div>
              <div className="text-2xl font-bold">{totals.totalKm} km</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Ingresos Totales</div>
              <div className="text-2xl font-bold">{totals.totalAmount.toFixed(2)}€</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Gastos Totales</div>
              <div className="text-2xl font-bold">{(totals.fuelExpense + totals.otherExpenses).toFixed(2)}€</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Comisión Conductor</div>
              <div className="text-2xl font-bold">{totals.driverCommission.toFixed(2)}€</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleExportToPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar a PDF
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="tabla" className="mb-6">
        <TabsList>
          <TabsTrigger value="tabla">Vista de Tabla</TabsTrigger>
          <TabsTrigger value="tarjetas">Vista de Tarjetas</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla">
          <Card>
            <CardHeader>
              <CardTitle>Listado de Registros</CardTitle>
              <CardDescription>{dailyRecords.length} registros encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Km</th>
                        <th className="text-right py-2">Efectivo</th>
                        <th className="text-right py-2">Tarjeta</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">Combustible</th>
                        <th className="text-right py-2">Comisión</th>
                        <th className="text-right py-2">Neto</th>
                        <th className="text-center py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{format(new Date(record.date), "dd/MM/yyyy")}</td>
                          <td className="text-right py-2">{record.totalKm} km</td>
                          <td className="text-right py-2">{record.cashAmount.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.cardAmount.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.totalAmount.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.fuelExpense.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.driverCommission.toFixed(2)}€</td>
                          <td className="text-right py-2">{record.netAmount.toFixed(2)}€</td>
                          <td className="text-center py-2">
                            <div className="flex justify-center space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record.id)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay registros para el período seleccionado</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarjetas">
          {dailyRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{format(new Date(record.date), "dd/MM/yyyy")}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </div>
                    <CardDescription>
                      {record.totalKm} km • {record.shiftStart || "N/A"} - {record.shiftEnd || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">Efectivo</div>
                        <div>{record.cashAmount.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tarjeta</div>
                        <div>{record.cardAmount.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Combustible</div>
                        <div>{record.fuelExpense.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Otros gastos</div>
                        <div>{record.otherExpenses.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Comisión</div>
                        <div>{record.driverCommission.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Neto</div>
                        <div className="font-bold">{record.netAmount.toFixed(2)}€</div>
                      </div>
                    </div>
                    {record.notes && (
                      <div className="mt-2 text-sm">
                        <div className="text-gray-500">Notas</div>
                        <div>{record.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No hay registros para el período seleccionado</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
