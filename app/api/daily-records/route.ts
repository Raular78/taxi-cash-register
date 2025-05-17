import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Construir la cláusula where para la consulta
    const whereClause: any = {}

    // Filtrar por fecha si se proporcionan los parámetros
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999) // Incluir todo el día final

      console.log("Cláusula where:", {
        date: { gte: fromDate, lte: toDate },
      })

      whereClause.date = {
        gte: fromDate,
        lte: toDate,
      }
    }

    // Filtrar por conductor si se proporciona el ID
    if (driverId) {
      whereClause.driverId = Number(driverId)
    }

    // Realizar la consulta a la base de datos
    const dailyRecords = await prisma.dailyRecord.findMany({
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

    console.log(`Registros diarios encontrados: ${dailyRecords.length}`)

    // Si no hay registros, devolver un array vacío en lugar de un error
    return NextResponse.json(dailyRecords)
  } catch (error) {
    console.error("Error al obtener registros diarios:", error)
    return NextResponse.json({ error: "Error al obtener registros diarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()

    // Validar datos requeridos
    if (!data.date || !data.driverId || data.totalAmount === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Crear el registro diario
    const dailyRecord = await prisma.dailyRecord.create({
      data: {
        date: new Date(data.date),
        startKm: data.startKm || 0,
        endKm: data.endKm || 0,
        totalKm: data.totalKm || 0,
        cashAmount: data.cashAmount || 0,
        cardAmount: data.cardAmount || 0,
        invoiceAmount: data.invoiceAmount || 0,
        otherAmount: data.otherAmount || 0,
        totalAmount: data.totalAmount,
        fuelExpense: data.fuelExpense || 0,
        otherExpenses: data.otherExpenses || 0,
        otherExpenseNotes: data.otherExpenseNotes || null,
        driverCommission: data.driverCommission || 0,
        netAmount: data.netAmount || 0,
        notes: data.notes || null,
        shiftStart: data.shiftStart || null,
        shiftEnd: data.shiftEnd || null,
        imageUrl: data.imageUrl || null,
        driverId: Number(data.driverId),
      },
    })

    return NextResponse.json(dailyRecord)
  } catch (error) {
    console.error("Error al crear registro diario:", error)
    return NextResponse.json({ error: "Error al crear registro diario" }, { status: 500 })
  }
}
