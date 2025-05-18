import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import prisma from "../../../lib/db"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const driverId = searchParams.get("driverId")

    const whereClause: any = {}

    // Filtro por fecha
    if (from && to) {
      whereClause.date = {
        gte: new Date(`${from}T00:00:00Z`),
        lte: new Date(`${to}T23:59:59Z`),
      }
    }

    // Filtro por conductor
    if (driverId && driverId !== "all") {
      whereClause.driverId = Number.parseInt(driverId)
    } else if (session.user.role === "driver") {
      // Si es conductor, solo ve sus propios registros
      whereClause.driverId = Number.parseInt(session.user.id)
    }

    const records = await prisma.dailyRecord.findMany({
      where: whereClause,
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

    // Preparar datos para Excel
    const data = records.map((record) => ({
      ID: record.id,
      Fecha: format(new Date(record.date), "dd/MM/yyyy", { locale: es }),
      Conductor: record.driver?.username || "N/A",
      "Km Inicio": record.startKm,
      "Km Fin": record.endKm,
      "Total Km": record.totalKm,
      "Hora Inicio": record.shiftStart || "",
      "Hora Fin": record.shiftEnd || "",
      Efectivo: record.cashAmount.toFixed(2),
      Tarjeta: record.cardAmount.toFixed(2),
      Facturación: record.invoiceAmount.toFixed(2),
      "Otros Ingresos": record.otherAmount.toFixed(2),
      "Total Ingresos": record.totalAmount.toFixed(2),
      Gasolina: record.fuelExpense.toFixed(2),
      "Otros Gastos": record.otherExpenses.toFixed(2),
      "Concepto Otros Gastos": record.otherExpenseNotes || "",
      "Comisión Conductor": record.driverCommission.toFixed(2),
      "Neto Empresa": record.netAmount.toFixed(2),
      Notas: record.notes || "",
    }))

    // Crear libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros Diarios")

    // Ajustar anchos de columna
    const colWidths = [
      { wch: 5 }, // ID
      { wch: 12 }, // Fecha
      { wch: 15 }, // Conductor
      { wch: 10 }, // Km Inicio
      { wch: 10 }, // Km Fin
      { wch: 10 }, // Total Km
      { wch: 12 }, // Hora Inicio
      { wch: 12 }, // Hora Fin
      { wch: 12 }, // Efectivo
      { wch: 12 }, // Tarjeta
      { wch: 12 }, // Facturación
      { wch: 15 }, // Otros Ingresos
      { wch: 15 }, // Total Ingresos
      { wch: 12 }, // Gasolina
      { wch: 12 }, // Otros Gastos
      { wch: 25 }, // Concepto Otros Gastos
      { wch: 18 }, // Comisión Conductor
      { wch: 15 }, // Neto Empresa
      { wch: 30 }, // Notas
    ]
    worksheet["!cols"] = colWidths

    // Generar archivo
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Configurar respuesta
    const fileName = `registros_diarios_${from}_a_${to}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar registros diarios:", error)
    return NextResponse.json({ error: "Error al exportar registros diarios" }, { status: 500 })
  }
}
