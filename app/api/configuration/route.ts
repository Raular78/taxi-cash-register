import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      // Obtener una configuración específica
      const config = await prisma.configuration.findUnique({
        where: { key },
      })

      if (!config) {
        return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 })
      }

      return NextResponse.json(config)
    } else {
      // Obtener todas las configuraciones
      const configs = await prisma.configuration.findMany({
        orderBy: { key: "asc" },
      })

      return NextResponse.json(configs)
    }
  } catch (error) {
    console.error("Error al obtener configuración:", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado - Solo administradores" }, { status: 403 })
    }

    const { key, value, description } = await request.json()

    if (!key || !value) {
      return NextResponse.json({ error: "Key y value son obligatorios" }, { status: 400 })
    }

    const config = await prisma.configuration.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error al guardar configuración:", error)
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 })
  }
}
