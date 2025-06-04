import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()

    // Asegurarse de que el driverId sea el del usuario autenticado si es conductor
    if (session.user.role === "driver") {
      data.driverId = Number.parseInt(session.user.id)
    }

    // Guardar en dailyRecord en lugar de record
    const record = await prisma.dailyRecord.create({
      data: {
        date: new Date(data.date),
        startKm: data.startKm || 0,
        endKm: data.endKm || 0,
        totalKm: data.totalKm || 0,
        cashAmount: Number.parseFloat(data.cashAmount) || 0,
        cardAmount: Number.parseFloat(data.cardAmount) || 0,
        invoiceAmount: Number.parseFloat(data.invoiceAmount) || 0,
        otherAmount: Number.parseFloat(data.otherAmount) || 0,
        totalAmount: Number.parseFloat(data.totalAmount) || 0,
        fuelExpense: Number.parseFloat(data.fuelExpense) || 0,
        otherExpenses: Number.parseFloat(data.otherExpenses) || 0,
        otherExpenseNotes: data.otherExpenseNotes || null,
        driverCommission: Number.parseFloat(data.driverCommission) || 0,
        netAmount: Number.parseFloat(data.netAmount) || 0,
        notes: data.notes || null,
        shiftStart: data.shiftStart || null,
        shiftEnd: data.shiftEnd || null,
        imageUrl: data.imageUrl || null,
        driverId: data.driverId,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error al crear registro:", error)
    return NextResponse.json({ error: "Error al crear el registro" }, { status: 500 })
  }
}

export async function GET(request) {
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

    // Consultar dailyRecord en lugar de record
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

    // Mapear los datos de dailyRecord a formato Record para compatibilidad
    const mappedRecords = records.map((record) => ({
      id: record.id,
      date: record.date,
      origin: "Servicio diario", // Valor por defecto
      destination: "Múltiples destinos", // Valor por defecto
      distance: record.totalKm,
      fare: record.totalAmount,
      tip: 0, // No hay propina en dailyRecord
      totalAmount: record.totalAmount,
      paymentMethod: "mixed", // Método mixto
      driverId: record.driverId,
      driver: record.driver,
    }))

    return NextResponse.json(mappedRecords)
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 })
  }
}
