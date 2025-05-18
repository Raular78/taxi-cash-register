import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/options"
import prisma from "../../../lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el registro diario
    const dailyRecord = await prisma.dailyRecord.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!dailyRecord) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // Verificar que el usuario tiene permiso para ver este registro
    if (session.user.role !== "admin" && dailyRecord.driverId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(dailyRecord)
  } catch (error) {
    console.error("Error al obtener registro diario:", error)
    return NextResponse.json({ error: "Error al obtener registro diario" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el registro diario actual
    const currentRecord = await prisma.dailyRecord.findUnique({
      where: { id },
    })

    if (!currentRecord) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // Verificar que el usuario tiene permiso para actualizar este registro
    if (session.user.role !== "admin" && currentRecord.driverId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const data = await request.json()

    // Actualizar el registro diario
    const updatedRecord = await prisma.dailyRecord.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        startKm: data.startKm !== undefined ? data.startKm : undefined,
        endKm: data.endKm !== undefined ? data.endKm : undefined,
        totalKm: data.totalKm !== undefined ? data.totalKm : undefined,
        cashAmount: data.cashAmount !== undefined ? data.cashAmount : undefined,
        cardAmount: data.cardAmount !== undefined ? data.cardAmount : undefined,
        invoiceAmount: data.invoiceAmount !== undefined ? data.invoiceAmount : undefined,
        otherAmount: data.otherAmount !== undefined ? data.otherAmount : undefined,
        totalAmount: data.totalAmount !== undefined ? data.totalAmount : undefined,
        fuelExpense: data.fuelExpense !== undefined ? data.fuelExpense : undefined,
        otherExpenses: data.otherExpenses !== undefined ? data.otherExpenses : undefined,
        otherExpenseNotes: data.otherExpenseNotes !== undefined ? data.otherExpenseNotes : undefined,
        driverCommission: data.driverCommission !== undefined ? data.driverCommission : undefined,
        netAmount: data.netAmount !== undefined ? data.netAmount : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        shiftStart: data.shiftStart !== undefined ? data.shiftStart : undefined,
        shiftEnd: data.shiftEnd !== undefined ? data.shiftEnd : undefined,
        shiftBreakStart: data.shiftBreakStart !== undefined ? data.shiftBreakStart : undefined,
        shiftBreakEnd: data.shiftBreakEnd !== undefined ? data.shiftBreakEnd : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      },
    })

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error("Error al actualizar registro diario:", error)
    return NextResponse.json({ error: "Error al actualizar registro diario" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el registro diario
    const dailyRecord = await prisma.dailyRecord.findUnique({
      where: { id },
    })

    if (!dailyRecord) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // Solo los administradores o el propio conductor pueden eliminar registros
    if (session.user.role !== "admin" && dailyRecord.driverId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Eliminar el registro diario
    await prisma.dailyRecord.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar registro diario:", error)
    return NextResponse.json({ error: "Error al eliminar registro diario" }, { status: 500 })
  }
}

