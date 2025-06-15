import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { prisma } from "../../lib/prisma"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month")

    // Si no se especifica mes, usar el actual
    const targetDate = monthParam ? new Date(monthParam) : new Date()
    const startDate = startOfMonth(targetDate)
    const endDate = endOfMonth(targetDate)

    console.log(`📊 Calculando balance para: ${format(startDate, "MMMM yyyy", { locale: es })}`)

    // Obtener ingresos del mes (desde daily_records)
    const dailyRecords = await prisma.dailyRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
        fuelExpense: true,
        otherExpenses: true,
        driverCommission: true,
        netAmount: true,
        date: true,
      },
    })

    // Obtener gastos del mes
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        category: true,
        description: true,
        date: true,
      },
    })

    // Calcular totales
    const totalIncome = dailyRecords.reduce((sum, record) => sum + record.totalAmount, 0)
    const totalFuelExpenses = dailyRecords.reduce((sum, record) => sum + record.fuelExpense, 0)
    const totalOtherExpenses = dailyRecords.reduce((sum, record) => sum + record.otherExpenses, 0)
    const totalDriverCommissions = dailyRecords.reduce((sum, record) => sum + record.driverCommission, 0)
    const totalNetIncome = dailyRecords.reduce((sum, record) => sum + record.netAmount, 0)

    const totalFixedExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Balance final
    const finalBalance = totalNetIncome - totalFixedExpenses

    // Gastos por categoría
    const expensesByCategory = expenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0
        }
        acc[expense.category] += expense.amount
        return acc
      },
      {} as Record<string, number>,
    )

    // Añadir gastos operativos
    expensesByCategory["Combustible"] = (expensesByCategory["Combustible"] || 0) + totalFuelExpenses
    expensesByCategory["Otros Gastos Operativos"] =
      (expensesByCategory["Otros Gastos Operativos"] || 0) + totalOtherExpenses
    expensesByCategory["Comisiones Conductores"] =
      (expensesByCategory["Comisiones Conductores"] || 0) + totalDriverCommissions

    const response = {
      month: format(targetDate, "MMMM yyyy", { locale: es }),
      period: {
        start: startDate,
        end: endDate,
      },
      income: {
        total: totalIncome,
        net: totalNetIncome,
        records: dailyRecords.length,
      },
      expenses: {
        operational: {
          fuel: totalFuelExpenses,
          other: totalOtherExpenses,
          commissions: totalDriverCommissions,
          total: totalFuelExpenses + totalOtherExpenses + totalDriverCommissions,
        },
        fixed: {
          total: totalFixedExpenses,
          byCategory: expensesByCategory,
          count: expenses.length,
        },
        total: totalFuelExpenses + totalOtherExpenses + totalDriverCommissions + totalFixedExpenses,
      },
      balance: {
        gross: totalIncome - (totalFuelExpenses + totalOtherExpenses + totalDriverCommissions),
        net: finalBalance,
        percentage: totalIncome > 0 ? (finalBalance / totalIncome) * 100 : 0,
      },
      alerts: [],
    }

    // Generar alertas
    if (finalBalance < 0) {
      response.alerts.push({
        type: "danger",
        message: `Balance negativo: ${finalBalance.toFixed(2)}€`,
      })
    } else if (finalBalance < totalIncome * 0.1) {
      response.alerts.push({
        type: "warning",
        message: `Balance bajo: solo ${((finalBalance / totalIncome) * 100).toFixed(1)}% de margen`,
      })
    }

    if (totalFixedExpenses > totalIncome * 0.6) {
      response.alerts.push({
        type: "warning",
        message: `Gastos fijos muy altos: ${((totalFixedExpenses / totalIncome) * 100).toFixed(1)}% de los ingresos`,
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error al calcular balance:", error)
    return NextResponse.json({ error: "Error al calcular balance" }, { status: 500 })
  }
}
