"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "../../components/Layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "..\..\..\components\ui/card"
import { Button } from "..\..\..\components\ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "..\..\..\components\ui/tabs"
import { FileDown, Printer, BarChart2, PieChart, TrendingUp, Calendar } from "lucide-react"
import { SimpleDateRangePicker } from "..\..\..\components\ui/simple-date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "..\..\..\components\ui/select"

export default function Informes() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1), // 1 de enero del año actual
    to: new Date(),
  })
  const [reportType, setReportType] = useState("diario")
  const router = useRouter()

  // Redirigir si no está autenticado o no es admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/conductor")
    }
  }, [status, session, router])

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [dateRange, reportType])

  if (status === "loading") {
    return (
      <Layout title="Cargando...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Informes">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Informes</h1>
          <div className="flex flex-col md:flex-row gap-2">
            <SimpleDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Seleccionar rango de fechas"
            />
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de informe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diario</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="conductores">Conductores</TabsTrigger>
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informe General</CardTitle>
                <CardDescription>
                  Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">1.250</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +15% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">35.750,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +12% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">12.500,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-red-500" />
                            +5% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">23.250,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +18% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">Gráfico de evolución de ingresos y gastos</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Distribución de Ingresos</h3>
                        <div className="h-60 bg-gray-800 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <PieChart className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">Gráfico de distribución de ingresos</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Distribución de Servicios</h3>
                        <div className="h-60 bg-gray-800 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <PieChart className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">Gráfico de distribución de servicios</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conductores">
            <Card>
              <CardHeader>
                <CardTitle>Informe de Conductores</CardTitle>
                <CardDescription>
                  Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">Gráfico comparativo de rendimiento por conductor</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Rendimiento por Conductor</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Conductor</th>
                            <th className="px-4 py-2 text-right">Servicios</th>
                            <th className="px-4 py-2 text-right">Ingresos</th>
                            <th className="px-4 py-2 text-right">Horas</th>
                            <th className="px-4 py-2 text-right">Ingresos/Hora</th>
                            <th className="px-4 py-2 text-right">Ingresos/Servicio</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Juan Pérez</td>
                            <td className="px-4 py-2 text-right">250</td>
                            <td className="px-4 py-2 text-right">7.500,00 €</td>
                            <td className="px-4 py-2 text-right">180</td>
                            <td className="px-4 py-2 text-right">41,67 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">María López</td>
                            <td className="px-4 py-2 text-right">230</td>
                            <td className="px-4 py-2 text-right">6.900,00 €</td>
                            <td className="px-4 py-2 text-right">165</td>
                            <td className="px-4 py-2 text-right">41,82 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Carlos Rodríguez</td>
                            <td className="px-4 py-2 text-right">270</td>
                            <td className="px-4 py-2 text-right">8.100,00 €</td>
                            <td className="px-4 py-2 text-right">195</td>
                            <td className="px-4 py-2 text-right">41,54 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Ana Martínez</td>
                            <td className="px-4 py-2 text-right">210</td>
                            <td className="px-4 py-2 text-right">6.300,00 €</td>
                            <td className="px-4 py-2 text-right">150</td>
                            <td className="px-4 py-2 text-right">42,00 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Pedro Sánchez</td>
                            <td className="px-4 py-2 text-right">290</td>
                            <td className="px-4 py-2 text-right">8.700,00 €</td>
                            <td className="px-4 py-2 text-right">210</td>
                            <td className="px-4 py-2 text-right">41,43 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicios">
            <Card>
              <CardHeader>
                <CardTitle>Informe de Servicios</CardTitle>
                <CardDescription>
                  Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">1.250</div>
                          <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Promedio Diario</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">42</div>
                          <p className="text-xs text-muted-foreground">Servicios por día</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Ingreso Promedio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">28,60 €</div>
                          <p className="text-xs text-muted-foreground">Por servicio</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">18 min</div>
                          <p className="text-xs text-muted-foreground">Por servicio</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Distribución por Día de la Semana</h3>
                        <div className="h-60 bg-gray-800 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <BarChart2 className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">Gráfico de servicios por día de la semana</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Distribución por Hora del Día</h3>
                        <div className="h-60 bg-gray-800 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <BarChart2 className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">Gráfico de servicios por hora del día</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Calendario de Servicios</h3>
                      <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                          <p className="text-gray-500">Calendario de densidad de servicios</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financiero">
            <Card>
              <CardHeader>
                <CardTitle>Informe Financiero</CardTitle>
                <CardDescription>
                  Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">35.750,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +12% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">12.500,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-red-500" />
                            +5% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">23.250,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +18% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Margen de Beneficio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">65,03%</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +3% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">Gráfico de evolución financiera</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Desglose de Ingresos</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="px-4 py-2 text-left">Concepto</th>
                                <th className="px-4 py-2 text-right">Importe</th>
                                <th className="px-4 py-2 text-right">% del Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Efectivo</td>
                                <td className="px-4 py-2 text-right">21.450,00 €</td>
                                <td className="px-4 py-2 text-right">60,00%</td>
                              </tr>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Tarjeta</td>
                                <td className="px-4 py-2 text-right">10.725,00 €</td>
                                <td className="px-4 py-2 text-right">30,00%</td>
                              </tr>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Facturación</td>
                                <td className="px-4 py-2 text-right">3.575,00 €</td>
                                <td className="px-4 py-2 text-right">10,00%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Desglose de Gastos</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="px-4 py-2 text-left">Concepto</th>
                                <th className="px-4 py-2 text-right">Importe</th>
                                <th className="px-4 py-2 text-right">% del Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Combustible</td>
                                <td className="px-4 py-2 text-right">6.250,00 €</td>
                                <td className="px-4 py-2 text-right">50,00%</td>
                              </tr>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Mantenimiento</td>
                                <td className="px-4 py-2 text-right">2.500,00 €</td>
                                <td className="px-4 py-2 text-right">20,00%</td>
                              </tr>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Seguros</td>
                                <td className="px-4 py-2 text-right">1.875,00 €</td>
                                <td className="px-4 py-2 text-right">15,00%</td>
                              </tr>
                              <tr className="border-b border-gray-700">
                                <td className="px-4 py-2">Otros</td>
                                <td className="px-4 py-2 text-right">1.875,00 €</td>
                                <td className="px-4 py-2 text-right">15,00%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
