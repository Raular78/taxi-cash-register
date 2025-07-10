import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const type = searchParams.get("type")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const isPaid = searchParams.get("isPaid")

    const whereClause: any = {}

    // Filtrar por fecha
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)

      console.log("Cláusula where para gastos:", {
        date: { gte: fromDate, lte: toDate },
      })

      whereClause.date = {
        gte: fromDate,
        lte: toDate,
      }
    }

    // Filtrar por tipo (fijo o variable)
    if (type === "fixed") {
      // Consideramos gastos fijos aquellos que tienen isRecurring=true o están en categorías específicas
      whereClause.OR = [
        { isRecurring: true },
        {
          category: {
            in: [
              "alquiler",
              "seguros",
              "impuestos",
              "servicios",
              "Nóminas",
              "Seguridad Social",
              "Cuota Autónomo",
              "Cuota Agrupación",
              "Alquiler",
              "Seguros",
              "Impuestos",
              "Suministros",
              "Taller",
            ],
          },
        },
      ]
    } else if (type === "variable") {
      // Gastos variables son los que no son recurrentes y no están en categorías de gastos fijos
      whereClause.isRecurring = false
      whereClause.category = {
        notIn: [
          "alquiler",
          "seguros",
          "impuestos",
          "servicios",
          "Nóminas",
          "Seguridad Social",
          "Cuota Autónomo",
          "Cuota Agrupación",
          "Alquiler",
          "Seguros",
          "Impuestos",
          "Suministros",
          "Taller",
        ],
      }
    }

    // Filtrar por categoría
    if (category) {
      whereClause.category = category
    }

    // Filtrar por estado
    if (status) {
      whereClause.status = status
    }

    // Filtrar por estado de pago
    if (isPaid !== null && isPaid !== undefined) {
      whereClause.isPaid = isPaid === "true"
    }

    // Obtener gastos de la base de datos
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    console.log(`Gastos encontrados en la base de datos: ${expenses.length}`)

    // Intentar obtener también gastos de combustible si existen
    let fuelExpenses = []
    try {
      fuelExpenses = await prisma.fuelExpense.findMany({
        where: whereClause.date ? { date: whereClause.date } : {},
        include: {
          driver: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      })

      console.log(`Gastos de combustible encontrados: ${fuelExpenses.length}`)
    } catch (fuelError) {
      console.log("No se pudieron obtener gastos de combustible:", fuelError)
    }

    // Combinar todos los gastos
    const allExpenses = [
      ...expenses,
      ...fuelExpenses.map((expense) => ({
        id: `fuel-${expense.id}`,
        date: expense.date,
        category: "Combustible",
        description: `Combustible - ${expense.liters}L`,
        amount: expense.amount,
        status: "approved",
        isPaid: true, // Los gastos de combustible se consideran pagados
        paymentDate: expense.date,
        isRecurring: false,
        driver: expense.driver,
        type: "fuel",
      })),
    ]

    return NextResponse.json(allExpenses)
  } catch (error) {
    console.error("Error al obtener gastos:", error)
    return NextResponse.json({ error: "Error al obtener gastos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()
    const {
      date,
      category,
      description,
      amount,
      receipt,
      status,
      notes,
      isRecurring,
      frequency,
      nextDueDate,
      isPaid,
      paymentDate,
    } = data

    // Validar datos
    if (!date || !category || !description || !amount) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Calcular nextDueDate si es recurrente
    let calculatedNextDueDate = null
    if (isRecurring && frequency) {
      const baseDate = new Date(date)
      switch (frequency) {
        case "monthly":
          calculatedNextDueDate = new Date(baseDate.setMonth(baseDate.getMonth() + 1))
          break
        case "quarterly":
          calculatedNextDueDate = new Date(baseDate.setMonth(baseDate.getMonth() + 3))
          break
        case "biannual":
          calculatedNextDueDate = new Date(baseDate.setMonth(baseDate.getMonth() + 6))
          break
        case "annual":
          calculatedNextDueDate = new Date(baseDate.setFullYear(baseDate.getFullYear() + 1))
          break
      }
    }

    // Crear el gasto
    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        category,
        description,
        amount: Number(amount),
        receipt: receipt || null,
        status: status || "approved",
        notes: notes || null,
        isRecurring: isRecurring || false,
        frequency: frequency || null,
        nextDueDate: calculatedNextDueDate || (nextDueDate ? new Date(nextDueDate) : null),
        isPaid: isPaid || false,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
      },
    })

    console.log(`Gasto creado con éxito, ID: ${expense.id}`)
    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error al crear gasto:", error)
    return NextResponse.json(
      {
        error: "Error al crear gasto. Detalles: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()
    const {
      id,
      date,
      category,
      description,
      amount,
      receipt,
      status,
      notes,
      isRecurring,
      frequency,
      nextDueDate,
      isPaid,
      paymentDate,
    } = data

    // Validar datos
    if (!id || !date || !category || !description || !amount) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Actualizar el gasto
    const expense = await prisma.expense.update({
      where: { id: Number(id) },
      data: {
        date: new Date(date),
        category,
        description,
        amount: Number(amount),
        receipt: receipt || null,
        status: status || "approved",
        notes: notes || null,
        isRecurring: isRecurring || false,
        frequency: frequency || null,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        isPaid: isPaid || false,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
      },
    })

    console.log(`Gasto actualizado con éxito, ID: ${expense.id}`)
    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error al actualizar gasto:", error)
    return NextResponse.json({ error: "Error al actualizar gasto" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    // Eliminar el gasto
    await prisma.expense.delete({
      where: { id: Number(id) },
    })

    console.log(`Gasto eliminado con éxito, ID: ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar gasto:", error)
    return NextResponse.json({ error: "Error al eliminar gasto" }, { status: 500 })
  }
}
