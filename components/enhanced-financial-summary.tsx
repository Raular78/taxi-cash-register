"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"

interface EnhancedFinancialSummaryProps {
  totalIncome: number
  driverCommission: number
  unifiedExpenses: {
    // Gastos fijos mensuales (de la tabla Expense)
    monthlyFixedExpenses: {
      seguridadSocial: number
      cuotaAutonomo: number
      cuotaAgrupacion: number
      gestoria: number
      seguros: number
      suministros: number
      otros: number
    }
    // Gastos operacionales diarios (combustible + otros gastos del día)
    dailyOperationalExpenses: number
    // Gastos variables (gastos no recurrentes de la tabla Expense)
    variableExpenses: number
    // Total de todos los gastos
    totalExpenses: number
    // Beneficio real después de TODO
    realNetProfit: number
  }
}

export function EnhancedFinancialSummary({
  totalIncome,
  driverCommission,
  unifiedExpenses,
}: EnhancedFinancialSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  if (!unifiedExpenses) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Calculando gastos unificados...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Cálculo del desglose de comisión del conductor
  const NOMINA_BASE = 1400 // Nómina fija del conductor
  const efectivoAdicional = Math.max(0, driverCommission - NOMINA_BASE)
  const nominaReal = Math.min(driverCommission, NOMINA_BASE)

  const profitMargin = totalIncome > 0 ? (unifiedExpenses.realNetProfit / totalIncome) * 100 : 0
  const isHealthyMargin = profitMargin > 15

  return (
    <div className="space-y-6">
      {/* Resumen financiero completo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isHealthyMargin ? (
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
            )}
            Análisis Financiero Detallado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingresos */}
            <div>
              <h3 className="font-semibold mb-3 text-green-700">💰 Ingresos</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Facturado:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
              </div>
            </div>

            {/* Gastos Desglosados */}
            <div>
              <h3 className="font-semibold mb-3 text-red-700">💸 Gastos Totales</h3>
              <div className="space-y-2">
                {/* Comisión del conductor con desglose */}
                <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                  <div className="flex justify-between text-sm font-medium">
                    <span>🚗 Comisión Total Conductor:</span>
                    <span className="text-orange-600">{formatCurrency(driverCommission)}</span>
                  </div>
                  <div className="ml-4 mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>├── Nómina (fija):</span>
                      <span className="text-blue-600">{formatCurrency(nominaReal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>└── Efectivo adicional:</span>
                      <span className="text-green-600">{formatCurrency(efectivoAdicional)}</span>
                    </div>
                  </div>
                  {driverCommission < NOMINA_BASE && (
                    <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                      ⚠️ Comisión menor que nómina base. Diferencia: {formatCurrency(NOMINA_BASE - driverCommission)}
                    </div>
                  )}
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="text-xs font-medium text-gray-600 mb-1">GASTOS FIJOS MENSUALES:</div>
                  <div className="flex justify-between text-xs">
                    <span>• Seguridad Social:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.seguridadSocial)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>• Cuota Autónomo:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.cuotaAutonomo)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>• Cuota Agrupación:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.cuotaAgrupacion)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>• Gestoría:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.gestoria)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>• Seguros:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.seguros)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>• Suministros:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.suministros)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>• Otros Fijos:</span>
                    <span>{formatCurrency(unifiedExpenses.monthlyFixedExpenses.otros)}</span>
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>⛽ Gastos Operacionales Diarios:</span>
                    <span className="text-blue-600">{formatCurrency(unifiedExpenses.dailyOperationalExpenses)}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">(Combustible + otros gastos del período)</div>
                </div>

                <div className="flex justify-between text-sm">
                  <span>📋 Gastos Variables:</span>
                  <span className="text-purple-600">{formatCurrency(unifiedExpenses.variableExpenses)}</span>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-red-600">
                    <span>TOTAL GASTOS:</span>
                    <span>{formatCurrency(unifiedExpenses.totalExpenses + driverCommission)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beneficio Real */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-blue-900">💎 Beneficio Neto Real</h3>
                <p className="text-sm text-blue-700">Después de TODOS los gastos y comisiones</p>
                <p className="text-xs text-blue-600 mt-1">
                  Fórmula: Ingresos - Comisión Total - Gastos Fijos - Gastos Operacionales - Gastos Variables
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${unifiedExpenses.realNetProfit > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(unifiedExpenses.realNetProfit)}
                </div>
                <div className={`text-sm ${isHealthyMargin ? "text-green-600" : "text-red-600"}`}>
                  Margen: {profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Desglose de cálculo mejorado */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <h4 className="font-medium mb-2">🧮 Desglose del Cálculo:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Ingresos totales:</span>
                <span className="text-green-600">+{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between border-l-2 border-orange-300 pl-2">
                <span>Comisión total conductor:</span>
                <span className="text-red-600">-{formatCurrency(driverCommission)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 ml-4">
                <span>├── Nómina fija:</span>
                <span>-{formatCurrency(nominaReal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 ml-4">
                <span>└── Efectivo adicional:</span>
                <span>-{formatCurrency(efectivoAdicional)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos fijos mensuales:</span>
                <span className="text-red-600">
                  -
                  {formatCurrency(
                    unifiedExpenses.monthlyFixedExpenses.seguridadSocial +
                      unifiedExpenses.monthlyFixedExpenses.cuotaAutonomo +
                      unifiedExpenses.monthlyFixedExpenses.cuotaAgrupacion +
                      unifiedExpenses.monthlyFixedExpenses.gestoria +
                      unifiedExpenses.monthlyFixedExpenses.seguros +
                      unifiedExpenses.monthlyFixedExpenses.suministros +
                      unifiedExpenses.monthlyFixedExpenses.otros,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gastos operacionales:</span>
                <span className="text-red-600">-{formatCurrency(unifiedExpenses.dailyOperationalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos variables:</span>
                <span className="text-red-600">-{formatCurrency(unifiedExpenses.variableExpenses)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-medium">
                <span>Beneficio neto:</span>
                <span className={unifiedExpenses.realNetProfit > 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(unifiedExpenses.realNetProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Información adicional para el conductor */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📋 Información del Conductor:</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Comisión acumulada (35%):</span>
                <span className="font-medium">{formatCurrency(driverCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Nómina mensual:</span>
                <span className="font-medium">{formatCurrency(nominaReal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo a recibir:</span>
                <span className="font-medium text-green-600">{formatCurrency(efectivoAdicional)}</span>
              </div>
              {efectivoAdicional > 0 && (
                <div className="text-xs text-blue-700 mt-2 p-2 bg-blue-100 rounded">
                  ✅ El conductor ha superado su nómina base y recibirá {formatCurrency(efectivoAdicional)} adicionales
                  en efectivo.
                </div>
              )}
              {driverCommission < NOMINA_BASE && (
                <div className="text-xs text-orange-700 mt-2 p-2 bg-orange-100 rounded">
                  ⚠️ La comisión aún no alcanza la nómina base. Faltan {formatCurrency(NOMINA_BASE - driverCommission)}{" "}
                  para completarla.
                </div>
              )}
            </div>
          </div>

          {/* Alertas */}
          {!isHealthyMargin && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  ⚠️ Margen de beneficio bajo ({profitMargin.toFixed(1)}%). Se recomienda revisar gastos o aumentar
                  tarifas.
                </span>
              </div>
            </div>
          )}

          {unifiedExpenses.realNetProfit < 0 && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-800">
                  🚨 PÉRDIDAS: Los gastos superan los ingresos. Revisar urgentemente la estructura de costos.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
