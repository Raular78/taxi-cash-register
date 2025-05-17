import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/app/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const userIdParam = searchParams.get("userId")

    // Convertir fechas
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setDate(new Date().getDate() - 30))

    const endDate = endDateParam ? new Date(endDateParam) : new Date()

    // Asegurarse de que endDate incluya todo el día
    endDate.setHours(23, 59, 59, 999)

    // Construir la cláusula where basada en el rol del usuario
    const whereClause: any = {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Si es conductor, solo ver sus propias entradas
    if (session.user.role === "driver") {
      whereClause.userId = Number.parseInt(session.user.id)
    }
    // Si es admin y se especifica un usuario, filtrar por ese usuario
    else if (session.user.role === "admin" && userIdParam) {
      whereClause.userId = Number.parseInt(userIdParam)
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      orderBy: {
        startTime: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Error al obtener entradas de tiempo:", error)
    return NextResponse.json({ error: "Error al obtener entradas de tiempo" }, { status: 500 })
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
    if (!data.startTime) {
      return NextResponse.json({ error: "Falta la hora de inicio" }, { status: 400 })
    }

    // Determinar el ID del usuario
    let userId: number

    if (session.user.role === "admin" && data.userId) {
      // Si es admin y se especifica un usuario
      userId = Number.parseInt(data.userId)
    } else {
      // Si es conductor, usar su propio ID
      userId = Number.parseInt(session.user.id)
    }

    console.log("Creando entrada de tiempo para userId:", userId)

    // Verificar si hay una entrada activa para este usuario
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    })

    if (activeEntry) {
      return NextResponse.json({ error: "Ya hay una entrada de tiempo activa para este usuario" }, { status: 400 })
    }

    // Crear la entrada de tiempo
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        breakTime: data.breakTime || 0,
        totalMinutes: data.totalMinutes,
        notes: data.notes,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Error al crear entrada de tiempo:", error)
    return NextResponse.json({ error: "Error al crear entrada de tiempo" }, { status: 500 })
  }
}
