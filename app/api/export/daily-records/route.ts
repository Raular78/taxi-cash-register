import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/api/auth/options"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const driverId = searchParams.get("driverId")
    const format = searchParams.get("format") || "csv"

    const whereClause: any = {}

    // Si es conductor, solo puede ver sus propios registros
    if (session.user.role === "driver") {
      whereClause.driverId = Number.parseInt(session.user.id)
    } else if (session.user.role === "admin" && driverId && driverId !== "all") {
      whereClause.driverId = Number.parseInt(driverId)
    }

    // Filtro de fechas
    if (from && to) {
      whereClause.date = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const records = await prisma.dailyRecord.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      include: {
        driver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (format === "json") {
      return NextResponse.json(records)
    }

    // Generar CSV
    const csvHeaders = [
      "ID",
      "Fecha",
      "Conductor",
      "Hora Inicio",
      "Hora Fin",
      "Km Inicio",
      "Km Fin",
      "Total Km",
      "Efectivo",
      "Tarjeta",
      "Facturación",
      "Otros Ingresos",
      "Total Ingresos",
      "Gastos Combustible",
      "Otros Gastos",
      "Total Gastos",
      "Comisión Conductor",
      "Neto Empresa",
      "Notas",
    ]

    const csvRows = records.map((record) => [
      record.id,
      new Date(record.date).toLocaleDateString("es-ES"),
      record.driver?.username || "N/A",
      record.shiftStart || "",
      record.shiftEnd || "",
      record.startKm,
      record.endKm,
      record.totalKm,
      record.cashAmount.toFixed(2),
      record.cardAmount.toFixed(2),
      record.invoiceAmount.toFixed(2),
      record.otherAmount.toFixed(2),
      record.totalAmount.toFixed(2),
      record.fuelExpense.toFixed(2),
      record.otherExpenses.toFixed(2),
      (record.fuelExpense + record.otherExpenses).toFixed(2),
      record.driverCommission.toFixed(2),
      record.netAmount.toFixed(2),
      record.notes || "",
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const fileName = `registros_diarios_${from}_${to}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar registros:", error)
    return NextResponse.json({ error: "Error al exportar registros" }, { status: 500 })
  }
}
