import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/options"
import prisma from "..\..\..\lib\db"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    console.log("Sesión en time-entries/admin:", session)

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si es admin (ya no es estrictamente necesario, pero lo mantenemos por seguridad)
    const isAdmin = session.user.role === "admin"
    if (!isAdmin) {
      console.log("Usuario no es admin:", session.user)
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Obtener parámetros de la consulta
    const searchParams = request.nextUrl.searchParams
    const driverId = searchParams.get("driverId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir la consulta
    const whereClause: any = {}

    if (driverId) {
      whereClause.userId = Number.parseInt(driverId)
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Obtener entradas de tiempo
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    })

    console.log(`Obtenidas ${timeEntries.length} entradas de tiempo para admin`)

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Error al obtener entradas de tiempo:", error)
    return NextResponse.json({ error: "Error al obtener entradas de tiempo" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()

    // Validar datos
    if (!data.userId || !data.startTime) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Crear entrada de tiempo
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: Number.parseInt(data.userId),
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        breakTime: data.breakTime || 0,
        totalMinutes: data.totalMinutes || null,
        notes: data.notes || null,
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

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Error al crear entrada de tiempo:", error)
    return NextResponse.json({ error: "Error al crear entrada de tiempo" }, { status: 500 })
  }
}
