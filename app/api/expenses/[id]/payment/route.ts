import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { prisma } from "../../../../../lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { isPaid, paymentDate } = await request.json()
    const expenseId = Number.parseInt(params.id)

    if (isNaN(expenseId)) {
      return NextResponse.json({ error: "ID de gasto inválido" }, { status: 400 })
    }

    // Actualizar el estado de pago del gasto
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        isPaid: isPaid,
        paymentDate: isPaid ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
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

    console.log(`Estado de pago actualizado para gasto ID: ${expenseId}, isPaid: ${isPaid}`)

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error al actualizar estado de pago:", error)
    return NextResponse.json({ error: "Error al actualizar estado de pago" }, { status: 500 })
  }
}
