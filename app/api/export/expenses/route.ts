import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/options"
import prisma from "../../../lib/db"
import { exportToExcel } from "../../../utils/excelExport"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    // Construir filtros
    const filters: any = {}

    if (startDate) {
      filters.date = {
        ...filters.date,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      filters.date = {
        ...filters.date,
        lte: new Date(endDate),
      }
    }

    if (category && category !== "all") {
      filters.category = category
    }

    if (status && status !== "all") {
      filters.status = status
    }

    // Obtener gastos
    const expenses = await prisma.expense.findMany({
      where: filters,
      orderBy: {
        date: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Formatear datos para Excel
    const data = expenses.map((expense) => ({
      ID: expense.id,
      Fecha: expense.date.toLocaleDateString(),
      Categoría: expense.category,
      Descripción: expense.description,
      "Base Imponible": expense.amount.toFixed(2) + " €",
      "IVA (21%)": expense.taxAmount.toFixed(2) + " €",
      Total: expense.totalAmount.toFixed(2) + " €",
      Estado: expense.status === "completed" ? "Pagado" : "Pendiente",
      Usuario: expense.user?.name || "N/A",
    }))

    // Generar Excel
    const buffer = await exportToExcel(data, "Gastos")

    // Devolver archivo Excel
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gastos_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar gastos a Excel:", error)
    return NextResponse.json({ error: "Error al exportar gastos a Excel" }, { status: 500 })
  }
}
