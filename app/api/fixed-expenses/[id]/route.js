import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/lib/auth"

export async function GET(request, { params }) {
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

    // Obtener el gasto fijo
    const fixedExpense = await prisma.fixedExpense.findUnique({
      where: { id },
    })

    if (!fixedExpense) {
      return NextResponse.json({ error: "Gasto fijo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(fixedExpense)
  } catch (error) {
    console.error("Error al obtener gasto fijo:", error)
    return NextResponse.json({ error: "Error al obtener gasto fijo" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario es administrador
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Verificar que el gasto fijo existe
    const existingExpense = await prisma.fixedExpense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Gasto fijo no encontrado" }, { status: 404 })
    }

    const data = await request.json()

    // Actualizar el gasto fijo
    const updatedExpense = await prisma.fixedExpense.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
        notes: data.notes,
        status: data.status,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error al actualizar gasto fijo:", error)
    return NextResponse.json({ error: "Error al actualizar gasto fijo" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario es administrador
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Verificar que el gasto fijo existe
    const existingExpense = await prisma.fixedExpense.findUnique({
      where: { id },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Gasto fijo no encontrado" }, { status: 404 })
    }

    // Eliminar el gasto fijo
    await prisma.fixedExpense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar gasto fijo:", error)
    return NextResponse.json({ error: "Error al eliminar gasto fijo" }, { status: 500 })
  }
}