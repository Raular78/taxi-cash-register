import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"
import { addMonths, addDays, format } from "date-fns"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔄 Iniciando generación de gastos recurrentes...")

    // Obtener gastos recurrentes que necesitan ser generados
    const today = new Date()
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
        OR: [
          { nextDueDate: { lte: today } }, // Vencidos
          { nextDueDate: { lte: addDays(today, 7) } }, // Próximos 7 días
        ],
      },
    })

    console.log(`📋 Encontrados ${recurringExpenses.length} gastos recurrentes para procesar`)

    const generatedExpenses = []
    const notifications = []

    for (const expense of recurringExpenses) {
      if (!expense.nextDueDate) continue

      // Verificar si ya existe un gasto para este período
      const existingExpense = await prisma.expense.findFirst({
        where: {
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          date: {
            gte: new Date(expense.nextDueDate.getFullYear(), expense.nextDueDate.getMonth(), 1),
            lt: new Date(expense.nextDueDate.getFullYear(), expense.nextDueDate.getMonth() + 1, 1),
          },
          isRecurring: false, // Solo buscamos los gastos generados, no el original
        },
      })

      if (existingExpense) {
        console.log(`⏭️ Ya existe gasto para ${expense.description} en ${format(expense.nextDueDate, "MM/yyyy")}`)
        continue
      }

      // Generar nuevo gasto
      const newExpense = await prisma.expense.create({
        data: {
          date: expense.nextDueDate,
          category: expense.category,
          description: `${expense.description} - ${format(expense.nextDueDate, "MMMM yyyy")}`,
          amount: expense.amount,
          status: "approved",
          notes: `Generado automáticamente desde gasto recurrente ID: ${expense.id}`,
          isRecurring: false, // El gasto generado no es recurrente
          userId: expense.userId,
        },
      })

      generatedExpenses.push(newExpense)

      // Calcular próxima fecha de vencimiento
      let nextDueDate = expense.nextDueDate
      switch (expense.frequency) {
        case "monthly":
          nextDueDate = addMonths(expense.nextDueDate, 1)
          break
        case "quarterly":
          nextDueDate = addMonths(expense.nextDueDate, 3)
          break
        case "biannual":
          nextDueDate = addMonths(expense.nextDueDate, 6)
          break
        case "annual":
          nextDueDate = addMonths(expense.nextDueDate, 12)
          break
      }

      // Actualizar la fecha de próximo vencimiento del gasto original
      await prisma.expense.update({
        where: { id: expense.id },
        data: { nextDueDate },
      })

      // Crear notificación
      notifications.push({
        type: "expense_generated",
        title: "Gasto Recurrente Generado",
        message: `Se ha generado automáticamente: ${expense.description} por ${expense.amount}€`,
        date: new Date(),
        amount: expense.amount,
        category: expense.category,
      })

      console.log(`✅ Generado: ${expense.description} - ${expense.amount}€`)
    }

    console.log(`🎉 Proceso completado. Generados ${generatedExpenses.length} gastos`)

    return NextResponse.json({
      success: true,
      generated: generatedExpenses.length,
      expenses: generatedExpenses,
      notifications,
    })
  } catch (error) {
    console.error("❌ Error al generar gastos recurrentes:", error)
    return NextResponse.json({ error: "Error al generar gastos recurrentes" }, { status: 500 })
  }
}

// GET para verificar gastos pendientes sin generar
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const today = new Date()
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
        nextDueDate: { lte: addDays(today, 7) }, // Próximos 7 días
      },
      select: {
        id: true,
        category: true,
        description: true,
        amount: true,
        nextDueDate: true,
        frequency: true,
      },
    })

    return NextResponse.json({
      pending: recurringExpenses.length,
      expenses: recurringExpenses,
    })
  } catch (error) {
    console.error("Error al verificar gastos pendientes:", error)
    return NextResponse.json({ error: "Error al verificar gastos pendientes" }, { status: 500 })
  }
}
