import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/api/auth/options"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener estadísticas generales
    const totalRecords = await prisma.dailyRecord.count()
    const totalDrivers = await prisma.user.count({
      where: { role: "driver" },
    })

    const recentRecords = await prisma.dailyRecord.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          select: { username: true },
        },
      },
    })

    const totalAmounts = await prisma.dailyRecord.aggregate({
      _sum: {
        totalAmount: true,
        driverCommission: true,
        netAmount: true,
      },
    })

    return NextResponse.json({
      summary: {
        totalRecords,
        totalDrivers,
        totalIncome: totalAmounts._sum.totalAmount || 0,
        totalCommissions: totalAmounts._sum.driverCommission || 0,
        totalNet: totalAmounts._sum.netAmount || 0,
      },
      recentRecords: recentRecords.map((record) => ({
        id: record.id,
        date: record.date,
        driver: record.driver?.username,
        totalAmount: record.totalAmount,
        createdAt: record.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error al obtener resumen:", error)
    return NextResponse.json({ error: "Error al obtener resumen" }, { status: 500 })
  }
}
