"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "../../../components/Layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDown, Printer, BarChart2, PieChart, TrendingUp } from "lucide-react"
import { SimpleDateRangePicker } from "@/components/ui/simple-date-range-picker"

export default function InformesFinancieros() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1), // 1 de enero del año actual
    to: new Date(),
  })
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
  }, [dateRange])

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
    <Layout title="Informes Financieros">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Informes Financieros</h1>
          <div className="flex flex-col md:flex-row gap-2">
            <SimpleDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Seleccionar rango de fechas"
            />
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

        <Tabs defaultValue="ingresos-gastos">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ingresos-gastos">Ingresos y Gastos</TabsTrigger>
            <TabsTrigger value="rentabilidad">Rentabilidad</TabsTrigger>
            <TabsTrigger value="conductores">Análisis por Conductor</TabsTrigger>
          </TabsList>

          <TabsContent value="ingresos-gastos">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ingresos y Gastos</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">120.000,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +15% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">80.000,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-red-500" />
                            +8% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">40.000,00 €</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +25% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">Gráfico de evolución de ingresos y gastos por mes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Desglose de Ingresos</h3>
                        <div className="h-60 bg-gray-800 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <PieChart className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">Gráfico de distribución de ingresos</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Desglose de Gastos</h3>
                        <div className="h-60 bg-gray-800 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <PieChart className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">Gráfico de distribución de gastos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rentabilidad">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Rentabilidad</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Margen de Beneficio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">33,33%</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +5% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">ROI</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">25,00%</div>
                          <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                            +3% respecto al período anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Punto de Equilibrio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">60.000,00 €</div>
                          <p className="text-xs text-muted-foreground">Ingresos mínimos para cubrir costes</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">Gráfico de evolución de rentabilidad por mes</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Indicadores de Rentabilidad</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Indicador</th>
                            <th className="px-4 py-2 text-right">Valor Actual</th>
                            <th className="px-4 py-2 text-right">Valor Anterior</th>
                            <th className="px-4 py-2 text-right">Variación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Margen Bruto</td>
                            <td className="px-4 py-2 text-right">45,00%</td>
                            <td className="px-4 py-2 text-right">42,00%</td>
                            <td className="px-4 py-2 text-right text-green-500">+3,00%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Margen Operativo</td>
                            <td className="px-4 py-2 text-right">35,00%</td>
                            <td className="px-4 py-2 text-right">32,00%</td>
                            <td className="px-4 py-2 text-right text-green-500">+3,00%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Margen Neto</td>
                            <td className="px-4 py-2 text-right">33,33%</td>
                            <td className="px-4 py-2 text-right">28,00%</td>
                            <td className="px-4 py-2 text-right text-green-500">+5,33%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">ROI</td>
                            <td className="px-4 py-2 text-right">25,00%</td>
                            <td className="px-4 py-2 text-right">22,00%</td>
                            <td className="px-4 py-2 text-right text-green-500">+3,00%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">ROE</td>
                            <td className="px-4 py-2 text-right">30,00%</td>
                            <td className="px-4 py-2 text-right">27,00%</td>
                            <td className="px-4 py-2 text-right text-green-500">+3,00%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conductores">
            <Card>
              <CardHeader>
                <CardTitle>Análisis por Conductor</CardTitle>
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
                        <p className="text-gray-500">Gráfico comparativo de ingresos por conductor</p>
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
                            <td className="px-4 py-2 text-right">120</td>
                            <td className="px-4 py-2 text-right">3.600,00 €</td>
                            <td className="px-4 py-2 text-right">180</td>
                            <td className="px-4 py-2 text-right">20,00 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">María López</td>
                            <td className="px-4 py-2 text-right">110</td>
                            <td className="px-4 py-2 text-right">3.300,00 €</td>
                            <td className="px-4 py-2 text-right">165</td>
                            <td className="px-4 py-2 text-right">20,00 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Carlos Rodríguez</td>
                            <td className="px-4 py-2 text-right">130</td>
                            <td className="px-4 py-2 text-right">3.900,00 €</td>
                            <td className="px-4 py-2 text-right">195</td>
                            <td className="px-4 py-2 text-right">20,00 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Ana Martínez</td>
                            <td className="px-4 py-2 text-right">100</td>
                            <td className="px-4 py-2 text-right">3.000,00 €</td>
                            <td className="px-4 py-2 text-right">150</td>
                            <td className="px-4 py-2 text-right">20,00 €</td>
                            <td className="px-4 py-2 text-right">30,00 €</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Pedro Sánchez</td>
                            <td className="px-4 py-2 text-right">140</td>
                            <td className="px-4 py-2 text-right">4.200,00 €</td>
                            <td className="px-4 py-2 text-right">210</td>
                            <td className="px-4 py-2 text-right">20,00 €</td>
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
        </Tabs>
      </div>
    </Layout>
  )
}
