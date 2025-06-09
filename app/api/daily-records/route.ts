import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/lib/auth" // ✅ Corregido el import

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("Sesión completa:", JSON.stringify(session, null, 2))

    if (!session || !session.user) {
      console.error("No hay sesión o usuario autenticado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()
    console.log("Datos recibidos:", JSON.stringify(data, null, 2))
    console.log("Usuario en sesión:", JSON.stringify(session.user, null, 2))

    // ✅ ARREGLO: Asegurar que el driverId sea el del usuario autenticado si es conductor
    let driverId: number | undefined

    if (session.user.role === "driver") {
      // Asegurarse de que el ID existe y es un número
      if (session.user.id) {
        driverId = Number.parseInt(session.user.id)
        console.log("Usuario conductor, usando driverId de sesión:", driverId)
      } else {
        console.error("El usuario conductor no tiene ID en la sesión")
      }
    } else if (session.user.role === "admin" && data.driverId) {
      driverId = Number.parseInt(data.driverId)
      console.log("Usuario admin, usando driverId del formulario:", driverId)
    }

    // Validar que el driverId sea válido
    if (!driverId || isNaN(driverId)) {
      console.error("driverId inválido o no encontrado:", driverId)

      // ✅ SOLUCIÓN TEMPORAL: Si es conductor y no hay driverId, buscar el usuario en la base de datos
      if (session.user.role === "driver" && session.user.username) {
        console.log("Intentando encontrar driverId por username:", session.user.username)
        const user = await prisma.user.findFirst({
          where: { username: session.user.username },
        })

        if (user) {
          driverId = user.id
          console.log("driverId encontrado por username:", driverId)
        } else {
          console.error("No se encontró usuario con username:", session.user.username)
          return NextResponse.json({ error: "No se pudo determinar el conductor" }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: "ID de conductor inválido" }, { status: 400 })
      }
    }

    const record = await prisma.dailyRecord.create({
      data: {
        date: new Date(data.date),
        startKm: data.startKm,
        endKm: data.endKm,
        totalKm: data.totalKm,
        cashAmount: data.cashAmount,
        cardAmount: data.cardAmount,
        invoiceAmount: data.invoiceAmount,
        otherAmount: data.otherAmount,
        totalAmount: data.totalAmount,
        fuelExpense: data.fuelExpense,
        otherExpenses: data.otherExpenses,
        otherExpenseNotes: data.otherExpenseNotes || null,
        driverCommission: data.driverCommission,
        netAmount: data.netAmount,
        notes: data.notes || null,
        shiftStart: data.shiftStart || null,
        shiftEnd: data.shiftEnd || null,
        imageUrl: data.imageUrl || null,
        driverId: driverId, // ✅ Usar el driverId correcto
      },
    })

    console.log("Registro creado exitosamente:", record)
    return NextResponse.json(record)
  } catch (error) {
    console.error("Error al crear registro:", error)
    return NextResponse.json({ error: "Error al crear el registro" }, { status: 500 })
  }
}

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

    const whereClause: any = {}

    // Si es conductor, solo puede ver sus propios registros
    if (session.user.role === "driver") {
      whereClause.driverId = Number.parseInt(session.user.id)
    } else if (session.user.role === "admin" && driverId && driverId !== "all") {
      whereClause.driverId = Number.parseInt(driverId)
    }

    // Filtro de fechas - solo aplicar si se especifican explícitamente
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

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 })
  }
}
