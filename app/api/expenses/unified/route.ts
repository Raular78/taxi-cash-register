import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import prisma from "../../../lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)

    console.log(`🔍 Calculando gastos unificados del ${fromDate.toISOString()} al ${toDate.toISOString()}`)

    // 1. GASTOS FIJOS MENSUALES (SOLO de la tabla Expense)
    const fixedExpenses = await prisma.expense.findMany({
      where: {
        OR: [
          { isRecurring: true },
          {
            category: {
              in: ["Seguridad Social", "Cuota Autónomo", "Cuota Agrupación", "Gestoría", "Seguros", "Suministros"],
            },
          },
        ],
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    })

    console.log(`📋 Gastos fijos encontrados: ${fixedExpenses.length}`)

    // Agrupar gastos fijos por categoría
    const monthlyFixedExpenses = {
      seguridadSocial: 0,
      cuotaAutonomo: 0,
      cuotaAgrupacion: 0,
      gestoria: 0,
      seguros: 0,
      suministros: 0,
      otros: 0,
    }

    fixedExpenses.forEach((expense) => {
      const amount = expense.amount || 0
      switch (expense.category.toLowerCase()) {
        case "seguridad social":
          monthlyFixedExpenses.seguridadSocial += amount
          break
        case "cuota autónomo":
        case "cuota autonomo":
          monthlyFixedExpenses.cuotaAutonomo += amount
          break
        case "cuota agrupación":
        case "cuota agrupacion":
          monthlyFixedExpenses.cuotaAgrupacion += amount
          break
        case "gestoría":
        case "gestoria":
          monthlyFixedExpenses.gestoria += amount
          break
        case "seguros":
          monthlyFixedExpenses.seguros += amount
          break
        case "suministros":
          monthlyFixedExpenses.suministros += amount
          break
        default:
          monthlyFixedExpenses.otros += amount
          break
      }
    })

    // 2. GASTOS OPERACIONALES DIARIOS (SOLO de daily_records - NO duplicar)
    let dailyOperationalExpenses = 0

    try {
      const dailyRecords = await prisma.dailyRecord.findMany({
        where: {
          date: {
            gte: fromDate,
            lte: toDate,
          },
        },
      })

      // SOLO gastos operacionales de registros diarios (combustible + otros gastos del día)
      dailyOperationalExpenses = dailyRecords.reduce((sum, record) => {
        return sum + (record.fuelExpense || 0) + (record.otherExpenses || 0)
      }, 0)

      console.log(`🚗 Gastos operacionales de registros diarios: ${dailyOperationalExpenses}€`)
    } catch (error) {
      console.log("⚠️ No se pudieron obtener gastos de registros diarios:", error)
    }

    // 3. GASTOS VARIABLES (gastos no recurrentes y no fijos de la tabla Expense)
    // EXCLUIR categorías que ya están en gastos fijos Y combustible para evitar duplicación
    const variableExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: false,
        category: {
          notIn: [
            "Seguridad Social",
            "Cuota Autónomo",
            "Cuota Agrupación",
            "Gestoría",
            "Seguros",
            "Suministros",
            "Combustible", // EXCLUIR combustible para evitar duplicar con daily records
          ],
        },
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    })

    const totalVariableExpenses = variableExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    console.log(`📊 Gastos variables (sin duplicar): ${totalVariableExpenses}€`)

    // 4. CALCULAR TOTALES SIN DUPLICACIONES
    const totalFixedExpenses = Object.values(monthlyFixedExpenses).reduce((sum, amount) => sum + amount, 0)
    const totalExpenses = totalFixedExpenses + dailyOperationalExpenses + totalVariableExpenses

    console.log(`💰 Resumen de gastos SIN duplicaciones:`)
    console.log(`   - Gastos fijos: ${totalFixedExpenses}€`)
    console.log(`   - Gastos operacionales (daily records): ${dailyOperationalExpenses}€`)
    console.log(`   - Gastos variables (sin combustible): ${totalVariableExpenses}€`)
    console.log(`   - TOTAL: ${totalExpenses}€`)

    // 5. RESULTADO FINAL
    const result = {
      monthlyFixedExpenses,
      dailyOperationalExpenses,
      variableExpenses: totalVariableExpenses,
      totalExpenses,
      realNetProfit: 0, // Se calculará en el frontend
      breakdown: {
        fixedExpensesDetail: fixedExpenses,
        variableExpensesDetail: variableExpenses,
        totalFixedExpenses,
        totalVariableExpenses,
        totalOperationalExpenses: dailyOperationalExpenses,
        note: "Gastos calculados sin duplicaciones. Combustible solo desde daily_records.",
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Error al calcular gastos unificados:", error)
    return NextResponse.json(
      { error: "Error al calcular gastos unificados: " + (error as Error).message },
      { status: 500 },
    )
  }
}
