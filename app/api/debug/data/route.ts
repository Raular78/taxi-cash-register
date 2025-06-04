import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado - Solo administradores" }, { status: 401 })
    }

    console.log("=== DEBUG DATABASE DATA ===")

    // Verificar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
      },
    })
    console.log("Users in database:", users)

    // Verificar registros diarios
    const dailyRecords = await prisma.dailyRecord.findMany({
      take: 10,
      orderBy: { date: "desc" },
      include: {
        driver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })
    console.log("Daily records (last 10):", dailyRecords)

    // Contar registros por conductor
    const recordsByDriver = await prisma.dailyRecord.groupBy({
      by: ["driverId"],
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    })
    console.log("Records by driver:", recordsByDriver)

    // Verificar si hay registros en la tabla Record antigua
    const oldRecords = await prisma.record.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        driver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })
    console.log("Old records (last 5):", oldRecords)

    return NextResponse.json({
      users,
      dailyRecords,
      recordsByDriver,
      oldRecords,
      summary: {
        totalUsers: users.length,
        totalDailyRecords: dailyRecords.length,
        totalOldRecords: oldRecords.length,
      },
    })
  } catch (error) {
    console.error("Error en debug:", error)
    return NextResponse.json({ error: "Error al obtener datos de debug", details: error.message }, { status: 500 })
  }
}
