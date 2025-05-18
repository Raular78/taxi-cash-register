import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()

    // Actualizar un gasto recurrente usando el modelo Expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        category: data.category,
        description: data.name,
        amount: Number(data.amount),
        isRecurring: true,
        frequency:
          data.frequency === "mensual"
            ? "monthly"
            : data.frequency === "trimestral"
              ? "quarterly"
              : data.frequency === "semestral"
                ? "biannual"
                : "annual",
        nextDueDate: new Date(data.nextPaymentDate),
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error al actualizar gasto fijo:", error)
    return NextResponse.json({ error: "Error al actualizar gasto fijo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Eliminar un gasto recurrente usando el modelo Expense
    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar gasto fijo:", error)
    return NextResponse.json({ error: "Error al eliminar gasto fijo" }, { status: 500 })
  }
}
