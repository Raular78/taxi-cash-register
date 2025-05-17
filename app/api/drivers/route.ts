import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/options"
import prisma from "@/app/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // En desarrollo, permitir acceso sin sesión para pruebas
    if (!session) {
      if (process.env.NODE_ENV === "development") {
        console.log("Modo desarrollo: permitiendo acceso sin sesión para pruebas")
      } else {
        return NextResponse.json([], { status: 401 })
      }
    }

    const drivers = await prisma.user.findMany({
      where: {
        role: "driver",
        status: "active",
      },
      select: {
        id: true,
        username: true,
      },
      orderBy: {
        username: "asc",
      },
    })

    // Verificar explícitamente que estamos devolviendo un array
    console.log(`Devolviendo ${drivers.length} conductores:`, drivers)

    // Siempre devolver un array, incluso si está vacío
    return NextResponse.json(drivers || [])
  } catch (error) {
    console.error("Error al obtener conductores:", error)
    // En caso de error, devolver un array vacío
    return NextResponse.json([])
  }
}
