import { type NextRequest, NextResponse } from "next/server"
import prisma from "..\..\..\lib\db"
import { getServerSession } from "next-auth"
import { authOptions } from "..\..\auth\options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = Number.parseInt(session.user.id)

    // Buscar entrada de tiempo activa (sin endTime)
    const activeTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    })

    return NextResponse.json(activeTimeEntry)
  } catch (error) {
    console.error("Error al obtener entrada de tiempo activa:", error)
    return NextResponse.json({ error: "Error al obtener entrada de tiempo activa" }, { status: 500 })
  }
}
