import { type NextRequest, NextResponse } from "next/server"
import prisma from "../../../lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = Number.parseInt(session.user.id)

    // Obtener las últimas 5 entradas de tiempo
    const recentTimeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        startTime: "desc",
      },
      take: 5,
    })

    return NextResponse.json(recentTimeEntries)
  } catch (error) {
    console.error("Error al obtener entradas de tiempo recientes:", error)
    return NextResponse.json({ error: "Error al obtener entradas de tiempo recientes" }, { status: 500 })
  }
}
