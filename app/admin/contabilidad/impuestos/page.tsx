"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "../../../components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from "../../../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"
import { FileDown, FileText, AlertCircle } from "lucide-react"
import { SimpleDateRangePicker } from "../../../../components/ui/simple-date-range-picker"
import { Alert, AlertDescription, AlertTitle } from "../../../../components/ui/alert"
import { Badge } from "../../../../components/ui/badge"

export default function GestionImpuestos() {
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
    <Layout title="Gestión de Impuestos">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Gestión de Impuestos</h1>
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

        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Próximos vencimientos</AlertTitle>
          <AlertDescription>Modelo 303 (IVA Trimestral) - Fecha límite: 20/04/2023</AlertDescription>
        </Alert>

        <Tabs defaultValue="iva">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="iva">IVA</TabsTrigger>
            <TabsTrigger value="irpf">IRPF</TabsTrigger>
            <TabsTrigger value="is">Impuesto Sociedades</TabsTrigger>
            <TabsTrigger value="modelos">Modelos Fiscales</TabsTrigger>
          </TabsList>

          <TabsContent value="iva">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de IVA</CardTitle>
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
                          <CardTitle className="text-sm font-medium">IVA Repercutido</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">4.200,00 €</div>
                          <p className="text-xs text-muted-foreground">Base imponible: 20.000,00 €</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">IVA Soportado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">2.100,00 €</div>
                          <p className="text-xs text-muted-foreground">Base imponible: 10.000,00 €</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Resultado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">2.100,00 €</div>
                          <p className="text-xs text-muted-foreground">A ingresar</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Detalle de IVA por Trimestres</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Período</th>
                            <th className="px-4 py-2 text-right">Base Imponible Repercutido</th>
                            <th className="px-4 py-2 text-right">IVA Repercutido</th>
                            <th className="px-4 py-2 text-right">Base Imponible Soportado</th>
                            <th className="px-4 py-2 text-right">IVA Soportado</th>
                            <th className="px-4 py-2 text-right">Resultado</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">1T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
                            <td className="px-4 py-2 text-right">1.050,00 €</td>
                            <td className="px-4 py-2 text-right">2.500,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">2T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
                            <td className="px-4 py-2 text-right">1.050,00 €</td>
                            <td className="px-4 py-2 text-right">2.500,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">3T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
                            <td className="px-4 py-2 text-right">1.050,00 €</td>
                            <td className="px-4 py-2 text-right">2.500,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Presentado
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">4T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
                            <td className="px-4 py-2 text-right">1.050,00 €</td>
                            <td className="px-4 py-2 text-right">2.500,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-right">525,00 €</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pendiente
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
                  Generar Modelo 303
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="irpf">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de IRPF</CardTitle>
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
                          <p className="text-xs text-muted-foreground">Base imponible: 20.000,00 €</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Retenciones Soportadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">500,00 €</div>
                          <p className="text-xs text-muted-foreground">Base imponible: 2.500,00 €</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Resultado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">2.500,00 €</div>
                          <p className="text-xs text-muted-foreground">A ingresar</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Detalle de Retenciones por Trimestres</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Período</th>
                            <th className="px-4 py-2 text-right">Base Retenciones</th>
                            <th className="px-4 py-2 text-right">Retenciones</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">1T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
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
                            <td className="px-4 py-2">2T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
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
                            <td className="px-4 py-2">3T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
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
                            <td className="px-4 py-2">4T 2023</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
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
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Modelo 111
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="is">
            <Card>
              <CardHeader>
                <CardTitle>Impuesto de Sociedades</CardTitle>
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
                          <CardTitle className="text-sm font-medium">Resultado Contable</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">25.000,00 €</div>
                          <p className="text-xs text-muted-foreground">Antes de impuestos</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Base Imponible</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">22.000,00 €</div>
                          <p className="text-xs text-muted-foreground">Después de ajustes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Cuota Íntegra (25%)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">5.500,00 €</div>
                          <p className="text-xs text-muted-foreground">A ingresar</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-semibold mb-4">Histórico de Impuesto de Sociedades</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-2 text-left">Ejercicio</th>
                            <th className="px-4 py-2 text-right">Resultado Contable</th>
                            <th className="px-4 py-2 text-right">Base Imponible</th>
                            <th className="px-4 py-2 text-right">Cuota Íntegra</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">2021</td>
                            <td className="px-4 py-2 text-right">20.000,00 €</td>
                            <td className="px-4 py-2 text-right">18.000,00 €</td>
                            <td className="px-4 py-2 text-right">4.500,00 €</td>
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
                            <td className="px-4 py-2">2022</td>
                            <td className="px-4 py-2 text-right">22.000,00 €</td>
                            <td className="px-4 py-2 text-right">20.000,00 €</td>
                            <td className="px-4 py-2 text-right">5.000,00 €</td>
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
                            <td className="px-4 py-2">2023</td>
                            <td className="px-4 py-2 text-right">25.000,00 €</td>
                            <td className="px-4 py-2 text-right">22.000,00 €</td>
                            <td className="px-4 py-2 text-right">5.500,00 €</td>
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
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Modelo 200
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="modelos">
            <Card>
              <CardHeader>
                <CardTitle>Modelos Fiscales</CardTitle>
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
                            <th className="px-4 py-2 text-left">Periodicidad</th>
                            <th className="px-4 py-2 text-left">Próximo Vencimiento</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="px-4 py-2">Modelo 111</td>
                            <td className="px-4 py-2">Retenciones e ingresos a cuenta. IRPF</td>
                            <td className="px-4 py-2">Trimestral</td>
                            <td className="px-4 py-2">20/04/2023</td>
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
                            <td className="px-4 py-2">Modelo 115</td>
                            <td className="px-4 py-2">Retenciones e ingresos a cuenta. Alquileres</td>
                            <td className="px-4 py-2">Trimestral</td>
                            <td className="px-4 py-2">20/04/2023</td>
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
                            <td className="px-4 py-2">Trimestral</td>
                            <td className="px-4 py-2">20/04/2023</td>
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
                            <td className="px-4 py-2">Modelo 130</td>
                            <td className="px-4 py-2">IRPF. Empresarios y profesionales</td>
                            <td className="px-4 py-2">Trimestral</td>
                            <td className="px-4 py-2">20/04/2023</td>
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
                            <td className="px-4 py-2">Modelo 200</td>
                            <td className="px-4 py-2">Impuesto sobre Sociedades</td>
                            <td className="px-4 py-2">Anual</td>
                            <td className="px-4 py-2">25/07/2023</td>
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
                            <td className="px-4 py-2">IVA. Resumen anual</td>
                            <td className="px-4 py-2">Anual</td>
                            <td className="px-4 py-2">30/01/2024</td>
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
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
