import { type NextRequest, NextResponse } from "next/server"
import prisma from "..\..\..\lib\db"
import { getServerSession } from "next-auth"
import { authOptions } from "..\..\auth\options"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: "Entrada de tiempo no encontrada" }, { status: 404 })
    }

    // Verificar que el usuario tenga acceso a esta entrada
    if (session.user.role !== "admin" && timeEntry.userId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado para ver esta entrada" }, { status: 403 })
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Error al obtener entrada de tiempo:", error)
    return NextResponse.json({ error: "Error al obtener entrada de tiempo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    const data = await request.json()

    // Verificar que la entrada existe
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Entrada de tiempo no encontrada" }, { status: 404 })
    }

    // Verificar que el usuario tenga acceso a esta entrada
    if (session.user.role !== "admin" && existingEntry.userId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado para modificar esta entrada" }, { status: 403 })
    }

    // Calcular totalMinutes si se proporciona endTime
    let totalMinutes: number | undefined = undefined
    if (data.endTime && existingEntry.startTime) {
      const startTime = new Date(existingEntry.startTime)
      const endTime = new Date(data.endTime)
      const diffMs = endTime.getTime() - startTime.getTime()
      totalMinutes = Math.floor(diffMs / (1000 * 60))

      // Restar breakTime si existe
      if (data.breakTime || existingEntry.breakTime) {
        totalMinutes -= data.breakTime || existingEntry.breakTime || 0
      }
    }

    // Actualizar la entrada
    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        breakTime: data.breakTime !== undefined ? data.breakTime : undefined,
        totalMinutes: totalMinutes !== undefined ? totalMinutes : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error("Error al actualizar entrada de tiempo:", error)
    return NextResponse.json({ error: "Error al actualizar entrada de tiempo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    // Verificar que la entrada existe
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Entrada de tiempo no encontrada" }, { status: 404 })
    }

    // Solo los administradores pueden eliminar entradas
    if (session.user.role !== "admin" && existingEntry.userId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado para eliminar esta entrada" }, { status: 403 })
    }

    // Eliminar la entrada
    await prisma.timeEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar entrada de tiempo:", error)
    return NextResponse.json({ error: "Error al eliminar entrada de tiempo" }, { status: 500 })
  }
}
