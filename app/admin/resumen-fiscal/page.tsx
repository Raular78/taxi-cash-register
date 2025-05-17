"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "../../components/Layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDown, FileText, BarChart2 } from 'lucide-react'
import { SimpleDateRangePicker } from "@/components/ui/simple-date-range-picker"
import { Badge } from "@/components/ui/badge"

export default function ResumenFiscal() {
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
    <Layout title="Resumen Fiscal">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Resumen Fiscal</h1>
          <div className="flex flex-col md:flex-row gap-2">
            <SimpleDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Seleccionar rango de fechas"
            />
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="resumen">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumen">Resumen Anual</TabsTrigger>
            <TabsTrigger value="retenciones">Retenciones</TabsTrigger>
            <TabsTrigger value="modelos">Modelos Fiscales</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Fiscal Anual</CardTitle>
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
                          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">120.000,00 €</div>
                          <p className="text-xs text-muted-foreground">Base imponible para impuestos</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Impuestos Pagados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">30.000,00 €</div>
                          <p className="text-xs text-muted-foreground">Total de impuestos del período</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Tasa Efectiva</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">25,00%</div>
                          <p className="text-xs text-muted-foreground">Porcentaje de impuestos sobre ingresos</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="h-80 bg-gray-800 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-500">Gráfico de distribución de impuestos por tipo</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Desglose de Impuestos</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Tipo de Impuesto</th>
                            <th className="px-4 py-2 text-right">Base Imponible</th>
                            <th className="px-4 py-2 text-right">Tipo</th>
                            <th className="px-4 py-2 text-right">Importe</th>
                            <th className="px-4 py-2 text-right">% del Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">IVA</td>
                            <td className="px-4 py-2 text-right">100.000,00 €</td>
                            <td className="px-4 py-2 text-right">21%</td>
                            <td className="px-4 py-2 text-right">21.000,00 €</td>
                            <td className="px-4 py-2 text-right">70,00%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">IRPF</td>
                            <td className="px-4 py-2 text-right">20.000,00 €</td>
                            <td className="px-4 py-2 text-right">15%</td>
                            <td className="px-4 py-2 text-right">3.000,00 €</td>
                            <td className="px-4 py-2 text-right">10,00%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Impuesto de Sociedades</td>
                            <td className="px-4 py-2 text-right">24.000,00 €</td>
                            <td className="px-4 py-2 text-right">25%</td>
                            <td className="px-4 py-2 text-right">6.000,00 €</td>
                            <td className="px-4 py-2 text-right">20,00%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retenciones">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Retenciones</CardTitle>
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
                          <CardTitle className="text-sm font-medium">Retenciones Practicadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">3.000,00 €</div>
                          <p className="text-xs text-muted-foreground">Total retenciones a conductores</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Retenciones Soportadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">500,00 €</div>
                          <p className="text-xs text-muted-foreground">Total retenciones de clientes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Saldo Neto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">2.500,00 €</div>
                          <p className="text-xs text-muted-foreground">A ingresar a Hacienda</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Detalle de Retenciones por Conductor</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Conductor</th>
                            <th className="px-4 py-2 text-right">Base Imponible</th>
                            <th className="px-4 py-2 text-right">Tipo</th>
                            <th className="px-4 py-2 text-right">Retención</th>
                            <th className="px-4 py-2 text-center">Modelo</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Juan Pérez</td>
                            <td className="px-4 py-2 text-right">4.000,00 €</td>
                            <td className="px-4 py-2 text-right">15%</td>
                            <td className="px-4 py-2 text-right">600,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Modelo 111
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">María López</td>
                            <td className="px-4 py-2 text-right">4.000,00 €</td>
                            <td className="px-4 py-2 text-right">15%</td>
                            <td className="px-4 py-2 text-right">600,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Modelo 111
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Carlos Rodríguez</td>
                            <td className="px-4 py-2 text-right">4.000,00 €</td>
                            <td className="px-4 py-2 text-right">15%</td>
                            <td className="px-4 py-2 text-right">600,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Modelo 111
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Ana Martínez</td>
                            <td className="px-4 py-2 text-right">4.000,00 €</td>
                            <td className="px-4 py-2 text-right">15%</td>
                            <td className="px-4 py-2 text-right">600,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Modelo 111
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Pedro Sánchez</td>
                            <td className="px-4 py-2 text-right">4.000,00 €</td>
                            <td className="px-4 py-2 text-right">15%</td>
                            <td className="px-4 py-2 text-right">600,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Modelo 111
                              </Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Modelo 190
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="modelos">
            <Card>
              <CardHeader>
                <CardTitle>Modelos Fiscales Presentados</CardTitle>
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
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Descripción</th>
                            <th className="px-4 py-2 text-left">Período</th>
                            <th className="px-4 py-2 text-right">Importe</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 111</td>
                            <td className="px-4 py-2">Retenciones e ingresos a cuenta. IRPF</td>
                            <td className="px-4 py-2">1T 2023</td>
                            <td className="px-4 py-2 text-right">750,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 303</td>
                            <td className="px-4 py-2">IVA. Autoliquidación</td>
                            <td className="px-4 py-2">1T 2023</td>
                            <td className="px-4 py-2 text-right">5.250,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 111</td>
                            <td className="px-4 py-2">Retenciones e ingresos a cuenta. IRPF</td>
                            <td className="px-4 py-2">2T 2023</td>
                            <td className="px-4 py-2 text-right">750,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 303</td>
                            <td className="px-4 py-2">IVA. Autoliquidación</td>
                            <td className="px-4 py-2">2T 2023</td>
                            <td className="px-4 py-2 text-right">5.250,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 111</td>
                            <td className="px-4 py-2">Retenciones e ingresos a cuenta. IRPF</td>
                            <td className="px-4 py-2">3T 2023</td>
                            <td className="px-4 py-2 text-right">750,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 303</td>
                            <td className="px-4 py-2">IVA. Autoliquidación</td>
                            <td className="px-4 py-2">3T 2023</td>
                            <td className="px-4 py-2 text-right">5.250,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 111</td>
                            <td className="px-4 py-2">Retenciones e ingresos a cuenta. IRPF</td>
                            <td className="px-4 py-2">4T 2023</td>
                            <td className="px-4 py-2 text-right">750,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pendiente
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 303</td>
                            <td className="px-4 py-2">IVA. Autoliquidación</td>
                            <td className="px-4 py-2">4T 2023</td>
                            <td className="px-4 py-2 text-right">5.250,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pendiente
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 190</td>
                            <td className="px-4 py-2">Resumen anual de retenciones e ingresos a cuenta</td>
                            <td className="px-4 py-2">Anual 2023</td>
                            <td className="px-4 py-2 text-right">3.000,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pendiente
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 390</td>
                            <td className="px-4 py-2">Resumen anual de IVA</td>
                            <td className="px-4 py-2">Anual 2023</td>
                            <td className="px-4 py-2 text-right">21.000,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pendiente
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Modelo 190
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Modelo 390
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
