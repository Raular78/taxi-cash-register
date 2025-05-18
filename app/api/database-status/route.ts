import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "..\..\..\lib\auth"
import { prisma } from "..\..\..\lib\prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si estamos usando datos simulados
    const isMockData = (prisma as any)._isMockData === true

    return NextResponse.json({
      status: isMockData ? "mock_mode" : "connected",
      message: isMockData
        ? "Usando datos simulados para desarrollo"
        : "Conexión a la base de datos establecida correctamente",
    })
  } catch (error) {
    console.error("Error al verificar el estado de la base de datos:", error)
    return NextResponse.json({ error: "Error al verificar el estado de la base de datos" }, { status: 500 })
  }
}
