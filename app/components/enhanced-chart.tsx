"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"

interface WeeklyData {
  week: string
  ingresos: number
  gastos: number
  comision: number
  dias: number
  kmPromedio: number
}

interface EnhancedChartProps {
  weeklyData: WeeklyData[]
  previousPeriodData?: WeeklyData[]
  loading?: boolean
}

export default function EnhancedChart({ weeklyData, previousPeriodData, loading }: EnhancedChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Análisis Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando análisis...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (weeklyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Análisis Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No hay datos para mostrar en este período
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estadísticas
  const totalIngresos = weeklyData.reduce((sum, week) => sum + week.ingresos, 0)
  const totalGastos = weeklyData.reduce((sum, week) => sum + week.gastos, 0)
  const totalComision = weeklyData.reduce((sum, week) => sum + week.comision, 0)
  const promedioSemanal = totalIngresos / weeklyData.length
  const mejorSemana = weeklyData.reduce((max, week) => (week.ingresos > max.ingresos ? week : max), weeklyData[0])

  // Calcular tendencia
  const primeraMitad = weeklyData.slice(0, Math.ceil(weeklyData.length / 2))
  const segundaMitad = weeklyData.slice(Math.ceil(weeklyData.length / 2))
  const promedioPrimera = primeraMitad.reduce((sum, w) => sum + w.ingresos, 0) / primeraMitad.length
  const promedioSegunda = segundaMitad.reduce((sum, w) => sum + w.ingresos, 0) / segundaMitad.length
  const tendencia = promedioSegunda > promedioPrimera ? "up" : promedioSegunda < promedioPrimera ? "down" : "stable"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const maxValue = Math.max(...weeklyData.map((w) => Math.max(w.ingresos, w.gastos, w.comision)))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Análisis Semanal Avanzado
          </div>
          <div className="flex items-center space-x-2">
            {tendencia === "up" && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Tendencia Positiva
              </Badge>
            )}
            {tendencia === "down" && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <TrendingDown className="h-3 w-3 mr-1" />
                Tendencia Negativa
              </Badge>
            )}
            {tendencia === "stable" && (
              <Badge variant="secondary">
                <Minus className="h-3 w-3 mr-1" />
                Estable
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>Análisis detallado de ingresos, gastos y comisiones con tendencias</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Estadísticas Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Promedio Semanal</div>
            <div className="text-lg font-bold text-blue-800">{formatCurrency(promedioSemanal)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Mejor Semana</div>
            <div className="text-lg font-bold text-green-800">{formatCurrency(mejorSemana.ingresos)}</div>
            <div className="text-xs text-green-600">{mejorSemana.week}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Total Comisión</div>
            <div className="text-lg font-bold text-purple-800">{formatCurrency(totalComision)}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Eficiencia</div>
            <div className="text-lg font-bold text-orange-800">
              {totalIngresos > 0 ? Math.round(((totalIngresos - totalGastos) / totalIngresos) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Gráfico Mejorado */}
        <div className="h-80 w-full">
          <div className="flex items-end justify-between h-full space-x-1">
            {weeklyData.map((week, index) => {
              const ingresosHeight = maxValue > 0 ? (week.ingresos / maxValue) * 100 : 0
              const gastosHeight = maxValue > 0 ? (week.gastos / maxValue) * 100 : 0
              const comisionHeight = maxValue > 0 ? (week.comision / maxValue) * 100 : 0
              const netHeight = maxValue > 0 ? ((week.ingresos - week.gastos) / maxValue) * 100 : 0

              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2 group">
                  {/* Indicador de rendimiento */}
                  <div className="text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black text-white px-2 py-1 rounded text-xs">
                      <div>Ingresos: {formatCurrency(week.ingresos)}</div>
                      <div>Gastos: {formatCurrency(week.gastos)}</div>
                      <div>Neto: {formatCurrency(week.ingresos - week.gastos)}</div>
                      <div>Comisión: {formatCurrency(week.comision)}</div>
                      {week.dias > 0 && <div>Días: {week.dias}</div>}
                      {week.kmPromedio > 0 && <div>Km/día: {Math.round(week.kmPromedio)}</div>}
                    </div>
                  </div>

                  {/* Barras del gráfico */}
                  <div className="flex items-end space-x-1 h-64">
                    {/* Barra de ingresos */}
                    <div className="relative">
                      <div
                        className="bg-gradient-to-t from-green-500 to-green-400 w-6 rounded-t shadow-sm hover:shadow-md transition-shadow"
                        style={{ height: `${ingresosHeight}%` }}
                      />
                      {week.ingresos > promedioSemanal && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Barra de gastos */}
                    <div
                      className="bg-gradient-to-t from-red-500 to-red-400 w-6 rounded-t shadow-sm"
                      style={{ height: `${gastosHeight}%` }}
                    />

                    {/* Barra de comisión */}
                    <div
                      className="bg-gradient-to-t from-blue-500 to-blue-400 w-6 rounded-t shadow-sm"
                      style={{ height: `${comisionHeight}%` }}
                    />

                    {/* Barra de neto */}
                    <div
                      className="bg-gradient-to-t from-purple-500 to-purple-400 w-6 rounded-t shadow-sm"
                      style={{ height: `${netHeight}%` }}
                    />
                  </div>

                  {/* Etiqueta de semana */}
                  <span className="text-xs text-muted-foreground font-medium">{week.week}</span>

                  {/* Indicador de mejor semana */}
                  {week.week === mejorSemana.week && (
                    <Badge variant="default" className="text-xs">
                      ⭐ Mejor
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>

          {/* Leyenda mejorada */}
          <div className="flex justify-center mt-6 space-x-6 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded mr-2" />
              <span>Ingresos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-400 rounded mr-2" />
              <span>Gastos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded mr-2" />
              <span>Comisión</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-400 rounded mr-2" />
              <span>Neto</span>
            </div>
          </div>
        </div>

        {/* Insights adicionales */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">💡 Insights del Período</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Consistencia:</span>
              <span className="ml-2">
                {weeklyData.every((w) => Math.abs(w.ingresos - promedioSemanal) < promedioSemanal * 0.2)
                  ? "Muy consistente"
                  : "Variable"}
              </span>
            </div>
            <div>
              <span className="font-medium">Eficiencia promedio:</span>
              <span className="ml-2">
                {Math.round(((totalIngresos - totalGastos) / totalIngresos) * 100)}% de margen
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
