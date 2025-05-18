import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    // Construir la cláusula where para la consulta
    const whereClause: any = {}

    // Filtrar por fecha si se proporcionan los parámetros
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)

      console.log("Cláusula where para nóminas:", {
        periodEnd: { gte: fromDate, lte: toDate },
      })

      whereClause.periodEnd = {
        gte: fromDate,
        lte: toDate,
      }
    }

    // Filtrar por usuario si se proporciona el ID
    if (userId) {
      whereClause.userId = Number(userId)
    }

    // Filtrar por estado si se proporciona
    if (status) {
      whereClause.status = status
    }

    // Realizar la consulta a la base de datos
    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      orderBy: {
        periodEnd: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    console.log(`Nóminas encontradas: ${payrolls.length}`)

    // Si no hay nóminas, devolver un array vacío en lugar de un error
    return NextResponse.json(payrolls)
  } catch (error) {
    console.error("Error al obtener nóminas:", error)
    return NextResponse.json({ error: "Error al obtener nóminas" }, { status: 500 })
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
    if (!data.periodStart || !data.periodEnd || !data.userId || data.netAmount === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Crear la nómina
    const payroll = await prisma.payroll.create({
      data: {
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        baseSalary: data.baseSalary || 0,
        commissions: data.commissions || 0,
        bonuses: data.bonuses || 0,
        deductions: data.deductions || 0,
        taxWithholding: data.taxWithholding || 0,
        netAmount: data.netAmount,
        status: data.status || "pending",
        notes: data.notes || null,
        userId: Number(data.userId),
      },
    })

    return NextResponse.json(payroll)
  } catch (error) {
    console.error("Error al crear nómina:", error)
    return NextResponse.json({ error: "Error al crear nómina" }, { status: 500 })
  }
}

