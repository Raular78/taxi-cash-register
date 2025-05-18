import { NextResponse } from "next/server"
import prisma from "../../lib/db"

export async function GET() {
  try {
    // Verificar que la variable de entorno DATABASE_URL existe
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "La variable de entorno DATABASE_URL no está configurada",
        },
        { status: 500 },
      )
    }

    // Intentar una consulta simple para verificar la conexión
    const usersCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      usersCount,
      databaseUrl: process.env.DATABASE_URL.replace(/:[^:]*@/, ":****@"), // Ocultar la contraseña
    })
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error de conexión a la base de datos",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
