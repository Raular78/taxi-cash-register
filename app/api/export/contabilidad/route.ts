import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/options"
import prisma from "../../../lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de la consulta
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: "Se requieren fechas de inicio y fin" }, { status: 400 })
    }

    // Obtener registros diarios
    const dailyRecords = await prisma.dailyRecord.findMany({
      where: {
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Obtener gastos
    let expenses = []
    try {
      expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
          status: "approved",
        },
        orderBy: {
          date: "desc",
        },
      })
    } catch (error) {
      console.log("Error al consultar gastos:", error)
    }

    // Obtener nóminas
    let payrolls = []
    try {
      payrolls = await prisma.payroll.findMany({
        where: {
          periodEnd: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
          status: "paid",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          periodEnd: "desc",
        },
      })
    } catch (error) {
      console.log("Error al consultar nóminas:", error)
    }

    // Calcular totales
    const totalIncome = dailyRecords.reduce((sum, record) => sum + record.totalAmount, 0)
    const totalFuelExpense = dailyRecords.reduce((sum, record) => sum + record.fuelExpense, 0)
    const totalOtherExpenses = dailyRecords.reduce((sum, record) => sum + record.otherExpenses, 0)
    const totalCommission = dailyRecords.reduce((sum, record) => sum + record.driverCommission, 0)
    const totalOperationalExpenses = totalFuelExpense + totalOtherExpenses
    const totalFixedExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalPayrolls = payrolls.reduce((sum, payroll) => sum + payroll.netAmount, 0)
    const totalExpenses = totalOperationalExpenses + totalFixedExpenses + totalPayrolls
    const netProfit = totalIncome - totalExpenses

    // Generar CSV
    let csv = "INFORME DE CONTABILIDAD\n"
    csv += `Período: ${format(new Date(fromDate), "dd/MM/yyyy", { locale: es })} - ${format(new Date(toDate), "dd/MM/yyyy", { locale: es })}\n\n`

    csv += "RESUMEN\n"
    csv += `Ingresos Totales,${totalIncome.toString().replace(".", ",")}\n`
    csv += `Gastos Operativos,${totalOperationalExpenses.toString().replace(".", ",")}\n`
    csv += `Gastos Fijos,${totalFixedExpenses.toString().replace(".", ",")}\n`
    csv += `Nóminas,${totalPayrolls.toString().replace(".", ",")}\n`
    csv += `Comisiones,${totalCommission.toString().replace(".", ",")}\n`
    csv += `Gastos Totales,${totalExpenses.toString().replace(".", ",")}\n`
    csv += `Beneficio Neto,${netProfit.toString().replace(".", ",")}\n\n`

    csv += "DETALLE DE INGRESOS\n"
    csv += "Fecha,Conductor,Efectivo,Tarjeta,Factura,Otros,Total\n"
    dailyRecords.forEach((record) => {
      const date = format(new Date(record.date), "dd/MM/yyyy", { locale: es })
      const driver = record.driver?.username || `Conductor ${record.driverId}`
      const cashAmount = record.cashAmount.toString().replace(".", ",")
      const cardAmount = record.cardAmount.toString().replace(".", ",")
      const invoiceAmount = record.invoiceAmount.toString().replace(".", ",")
      const otherAmount = record.otherAmount.toString().replace(".", ",")
      const totalAmount = record.totalAmount.toString().replace(".", ",")

      csv += `${date},${driver},${cashAmount},${cardAmount},${invoiceAmount},${otherAmount},${totalAmount}\n`
    })
    csv += "\n"

    csv += "DETALLE DE GASTOS OPERATIVOS\n"
    csv += "Fecha,Conductor,Combustible,Otros Gastos,Comisión,Total\n"
    dailyRecords.forEach((record) => {
      const date = format(new Date(record.date), "dd/MM/yyyy", { locale: es })
      const driver = record.driver?.username || `Conductor ${record.driverId}`
      const fuelExpense = record.fuelExpense.toString().replace(".", ",")
      const otherExpenses = record.otherExpenses.toString().replace(".", ",")
      const driverCommission = record.driverCommission.toString().replace(".", ",")
      const totalExpense = (record.fuelExpense + record.otherExpenses + record.driverCommission)
        .toString()
        .replace(".", ",")

      csv += `${date},${driver},${fuelExpense},${otherExpenses},${driverCommission},${totalExpense}\n`
    })
    csv += "\n"

    csv += "DETALLE DE GASTOS FIJOS\n"
    csv += "Fecha,Categoría,Descripción,Importe\n"
    expenses.forEach((expense) => {
      const date = format(new Date(expense.date), "dd/MM/yyyy", { locale: es })
      const category = expense.category.replace(/,/g, ";")
      const description = expense.description.replace(/,/g, ";")
      const amount = expense.amount.toString().replace(".", ",")

      csv += `${date},${category},${description},${amount}\n`
    })
    csv += "\n"

    csv += "DETALLE DE NÓMINAS\n"
    csv += "Período,Empleado,Salario Base,Comisiones,Bonos,Deducciones,Retención,Neto\n"
    payrolls.forEach((payroll) => {
      const period = `${format(new Date(payroll.periodStart), "dd/MM/yyyy", { locale: es })} - ${format(new Date(payroll.periodEnd), "dd/MM/yyyy", { locale: es })}`
      const employee = payroll.user?.username || `Empleado ${payroll.userId}`
      const baseSalary = payroll.baseSalary.toString().replace(".", ",")
      const commissions = payroll.commissions.toString().replace(".", ",")
      const bonuses = payroll.bonuses.toString().replace(".", ",")
      const deductions = payroll.deductions.toString().replace(".", ",")
      const taxWithholding = payroll.taxWithholding.toString().replace(".", ",")
      const netAmount = payroll.netAmount.toString().replace(".", ",")

      csv += `${period},${employee},${baseSalary},${commissions},${bonuses},${deductions},${taxWithholding},${netAmount}\n`
    })

    // Configurar respuesta
    const response = new NextResponse(csv)
    response.headers.set("Content-Type", "text/csv; charset=utf-8")
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="contabilidad_${format(new Date(), "yyyyMMdd")}.csv"`,
    )

    return response
  } catch (error) {
    console.error("Error al exportar informe de contabilidad:", error)
    return NextResponse.json({ error: "Error al exportar informe de contabilidad" }, { status: 500 })
  }
}
