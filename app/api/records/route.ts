import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "..\auth\options"
import prisma from "..\..\lib\db"
import { parseISO, startOfDay, endOfDay } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")
    const driverIdParam = searchParams.get("driverId")

    // Construir cláusula where
    const whereClause: any = {}

    // Filtrar por rango de fechas si se proporcionan
    if (fromDate && toDate) {
      whereClause.date = {
        gte: startOfDay(parseISO(fromDate)),
        lte: endOfDay(parseISO(toDate)),
      }
    }

    // Si el usuario es conductor, mostrar solo sus registros
    // Si es admin y se especifica un driverId, filtrar por ese conductor
    if (session.user.role === "driver") {
      // Buscar el ID del usuario en la base de datos
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
      })

      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      whereClause.driverId = user.id
    } else if (driverIdParam && driverIdParam !== "all") {
      // Convertir a número para evitar problemas con Prisma
      whereClause.driverId = Number.parseInt(driverIdParam, 10)
    }

    // Log para depuración
    console.log("Cláusula where:", whereClause)

    // Obtener registros
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
            email: true,
          },
        },
      },
    })

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

    // Validar datos mínimos requeridos
    if (!data.date || !data.driverId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Crear registro
    const dailyRecord = await prisma.dailyRecord.create({
      data: {
        date: new Date(data.date),
        driverId: data.driverId,
        startKm: data.startKm || 0,
        endKm: data.endKm || 0,
        totalKm: data.totalKm || 0,
        cashAmount: data.cashAmount || 0,
        cardAmount: data.cardAmount || 0,
        invoiceAmount: data.invoiceAmount || 0,
        otherAmount: data.otherAmount || 0,
        totalAmount: data.totalAmount || 0,
        fuelExpense: data.fuelExpense || 0,
        otherExpenses: data.otherExpenses || 0,
        otherExpenseNotes: data.otherExpenseNotes,
        driverCommission: data.driverCommission || 0,
        netAmount: data.netAmount || 0,
        notes: data.notes,
        shiftStart: data.shiftStart,
        shiftEnd: data.shiftEnd,
        imageUrl: data.imageUrl,
      },
    })

    return NextResponse.json(dailyRecord)
  } catch (error) {
    console.error("Error al crear registro diario:", error)
    return NextResponse.json({ error: "Error al crear registro diario" }, { status: 500 })
  }
}
