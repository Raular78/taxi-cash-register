"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "../../../components/Layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDown, Printer } from "lucide-react"
import { SimpleDateRangePicker } from "@/components/ui/simple-date-range-picker"

export default function BalanceContable() {
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
    <Layout title="Balance Contable">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Balance Contable</h1>
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

        <Tabs defaultValue="balance">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="perdidas-ganancias">Pérdidas y Ganancias</TabsTrigger>
            <TabsTrigger value="libro-diario">Libro Diario</TabsTrigger>
          </TabsList>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Balance de Situación</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Activo */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Activo</h3>
                        <div className="space-y-4">
                          <div className="border-b border-gray-700 pb-2">
                            <h4 className="font-medium">Activo No Corriente</h4>
                            <div className="flex justify-between mt-2">
                              <span>Inmovilizado material</span>
                              <span>25.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Inmovilizado intangible</span>
                              <span>5.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Inversiones financieras a largo plazo</span>
                              <span>10.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-2 font-medium">
                              <span>Total Activo No Corriente</span>
                              <span>40.000,00 €</span>
                            </div>
                          </div>

                          <div className="border-b border-gray-700 pb-2">
                            <h4 className="font-medium">Activo Corriente</h4>
                            <div className="flex justify-between mt-2">
                              <span>Existencias</span>
                              <span>2.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Deudores comerciales</span>
                              <span>15.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Tesorería</span>
                              <span>18.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-2 font-medium">
                              <span>Total Activo Corriente</span>
                              <span>35.000,00 €</span>
                            </div>
                          </div>

                          <div className="flex justify-between font-bold">
                            <span>TOTAL ACTIVO</span>
                            <span>75.000,00 €</span>
                          </div>
                        </div>
                      </div>

                      {/* Pasivo y Patrimonio Neto */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Pasivo y Patrimonio Neto</h3>
                        <div className="space-y-4">
                          <div className="border-b border-gray-700 pb-2">
                            <h4 className="font-medium">Patrimonio Neto</h4>
                            <div className="flex justify-between mt-2">
                              <span>Capital</span>
                              <span>30.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Reservas</span>
                              <span>10.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Resultado del ejercicio</span>
                              <span>5.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-2 font-medium">
                              <span>Total Patrimonio Neto</span>
                              <span>45.000,00 €</span>
                            </div>
                          </div>

                          <div className="border-b border-gray-700 pb-2">
                            <h4 className="font-medium">Pasivo No Corriente</h4>
                            <div className="flex justify-between mt-2">
                              <span>Deudas a largo plazo</span>
                              <span>15.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-2 font-medium">
                              <span>Total Pasivo No Corriente</span>
                              <span>15.000,00 €</span>
                            </div>
                          </div>

                          <div className="border-b border-gray-700 pb-2">
                            <h4 className="font-medium">Pasivo Corriente</h4>
                            <div className="flex justify-between mt-2">
                              <span>Deudas a corto plazo</span>
                              <span>5.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Acreedores comerciales</span>
                              <span>10.000,00 €</span>
                            </div>
                            <div className="flex justify-between mt-2 font-medium">
                              <span>Total Pasivo Corriente</span>
                              <span>15.000,00 €</span>
                            </div>
                          </div>

                          <div className="flex justify-between font-bold">
                            <span>TOTAL PASIVO Y PATRIMONIO NETO</span>
                            <span>75.000,00 €</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perdidas-ganancias">
            <Card>
              <CardHeader>
                <CardTitle>Cuenta de Pérdidas y Ganancias</CardTitle>
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
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold mb-4">Ingresos</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Importe neto de la cifra de negocios</span>
                          <span>120.000,00 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Otros ingresos de explotación</span>
                          <span>5.000,00 €</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total Ingresos</span>
                          <span>125.000,00 €</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold mb-4">Gastos</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Aprovisionamientos</span>
                          <span>-30.000,00 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gastos de personal</span>
                          <span>-50.000,00 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Otros gastos de explotación</span>
                          <span>-25.000,00 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amortización del inmovilizado</span>
                          <span>-10.000,00 €</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total Gastos</span>
                          <span>-115.000,00 €</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold mb-4">Resultado de Explotación</h3>
                      <div className="flex justify-between font-medium">
                        <span>Resultado de Explotación</span>
                        <span>10.000,00 €</span>
                      </div>
                    </div>

                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold mb-4">Resultado Financiero</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Ingresos financieros</span>
                          <span>500,00 €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gastos financieros</span>
                          <span>-1.500,00 €</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Resultado Financiero</span>
                          <span>-1.000,00 €</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold mb-4">Resultado Antes de Impuestos</h3>
                      <div className="flex justify-between font-medium">
                        <span>Resultado Antes de Impuestos</span>
                        <span>9.000,00 €</span>
                      </div>
                    </div>

                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold mb-4">Impuesto sobre Beneficios</h3>
                      <div className="flex justify-between font-medium">
                        <span>Impuesto sobre Beneficios (25%)</span>
                        <span>-2.250,00 €</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Resultado del Ejercicio</h3>
                      <div className="flex justify-between font-bold">
                        <span>RESULTADO DEL EJERCICIO</span>
                        <span>6.750,00 €</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="libro-diario">
            <Card>
              <CardHeader>
                <CardTitle>Libro Diario</CardTitle>
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-2 text-left">Fecha</th>
                          <th className="px-4 py-2 text-left">Concepto</th>
                          <th className="px-4 py-2 text-left">Cuenta</th>
                          <th className="px-4 py-2 text-right">Debe</th>
                          <th className="px-4 py-2 text-right">Haber</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2">01/01/2023</td>
                          <td className="px-4 py-2">Apertura del ejercicio</td>
                          <td className="px-4 py-2">Banco c/c</td>
                          <td className="px-4 py-2 text-right">15.000,00 €</td>
                          <td className="px-4 py-2 text-right"></td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2">Capital social</td>
                          <td className="px-4 py-2 text-right"></td>
                          <td className="px-4 py-2 text-right">15.000,00 €</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2">15/01/2023</td>
                          <td className="px-4 py-2">Factura de servicio</td>
                          <td className="px-4 py-2">Clientes</td>
                          <td className="px-4 py-2 text-right">1.210,00 €</td>
                          <td className="px-4 py-2 text-right"></td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2">Ingresos por servicios</td>
                          <td className="px-4 py-2 text-right"></td>
                          <td className="px-4 py-2 text-right">1.000,00 €</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2">H.P. IVA repercutido</td>
                          <td className="px-4 py-2 text-right"></td>
                          <td className="px-4 py-2 text-right">210,00 €</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2">20/01/2023</td>
                          <td className="px-4 py-2">Cobro factura cliente</td>
                          <td className="px-4 py-2">Banco c/c</td>
                          <td className="px-4 py-2 text-right">1.210,00 €</td>
                          <td className="px-4 py-2 text-right"></td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2">Clientes</td>
                          <td className="px-4 py-2 text-right"></td>
                          <td className="px-4 py-2 text-right">1.210,00 €</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2">31/01/2023</td>
                          <td className="px-4 py-2">Factura de gasolina</td>
                          <td className="px-4 py-2">Combustible</td>
                          <td className="px-4 py-2 text-right">200,00 €</td>
                          <td className="px-4 py-2 text-right"></td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2">H.P. IVA soportado</td>
                          <td className="px-4 py-2 text-right">42,00 €</td>
                          <td className="px-4 py-2 text-right"></td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2">Banco c/c</td>
                          <td className="px-4 py-2 text-right"></td>
                          <td className="px-4 py-2 text-right">242,00 €</td>
                        </tr>
                      </tbody>
                    </table>
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
