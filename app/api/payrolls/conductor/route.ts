import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "../../../lib/db"
import { authOptions } from "../../../api/auth/[...nextauth]/options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    // Validar fechas
    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: "Se requieren fechas de inicio y fin" }, { status: 400 })
    }

    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)
    const userId = session.user.id

    console.log("=== DEBUG PAYROLL API ===")
    console.log("Session user:", session.user)
    console.log("User ID:", userId)
    console.log("Date range:", { startDate, endDate })

    // Buscar nómina para el período y conductor específico
    const payroll = await prisma.payroll.findFirst({
      where: {
        userId: Number(userId),
        periodStart: {
          lte: endDate,
        },
        periodEnd: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        netAmount: true,
        baseSalary: true,
        commissions: true,
        bonuses: true,
        deductions: true,
        taxWithholding: true,
        status: true,
        paymentDate: true,
        pdfUrl: true,
      },
    })

    console.log("Found payroll:", payroll)

    // Si no hay nómina, devolver valor por defecto
    if (!payroll) {
      // Intentar obtener el valor por defecto de la configuración
      const defaultSalaryConfig = await prisma.configuration.findUnique({
        where: { key: "driver_base_salary" },
      })

      const defaultSalary = defaultSalaryConfig ? Number.parseFloat(defaultSalaryConfig.value) : 1400 // Valor por defecto si no hay configuración

      return NextResponse.json({
        found: false,
        defaultSalary,
        message: "No se encontró nómina para el período seleccionado",
      })
    }

    // Devolver la nómina encontrada
    return NextResponse.json({
      found: true,
      payroll,
    })
  } catch (error) {
    console.error("Error al obtener nómina del conductor:", error)
    return NextResponse.json({ error: "Error al obtener nómina" }, { status: 500 })
  }
}
