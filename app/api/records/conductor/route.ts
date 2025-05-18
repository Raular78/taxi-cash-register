import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "../../../lib/db"
import { authOptions } from "../../../lib/auth"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("ID del conductor:", session.user.id)
    console.log("Rol del usuario:", session.user.role)

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir la cláusula where
    const whereClause = {}

    // Usar driverId para la tabla Record
    whereClause.driverId = Number.parseInt(session.user.id)

    console.log("Cláusula where:", JSON.stringify(whereClause))

    // Añadir filtro de fechas si se proporcionan
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    }

    const records = await prisma.record.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error al obtener registros del conductor:", error)
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 })
  }
}

