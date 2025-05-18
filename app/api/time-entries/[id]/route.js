import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/lib/auth"

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params
    const { endTime, notes, breakTime } = await request.json()

    // Verificar que la entrada pertenece al usuario
    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: Number.parseInt(id),
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 })
    }

    // Usar userId para TimeEntry
    if (timeEntry.userId !== Number.parseInt(session.user.id)) {
      // En desarrollo, permitir usuarios de emergencia sin verificar en la base de datos
      let skipUserCheck = false
      if (process.env.NODE_ENV === "development") {
        if (
          (session.user.username === "Carlos" && Number.parseInt(session.user.id) === 1) ||
          (session.user.username === "admin" && Number.parseInt(session.user.id) === 0) ||
          (session.user.username === "Raul" && Number.parseInt(session.user.id) === 2)
        ) {
          console.log("Modo desarrollo: permitiendo usuario de emergencia sin verificación en DB")
          skipUserCheck = true
        }
      }

      if (!skipUserCheck) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: {
        id: Number.parseInt(id),
      },
      data: {
        endTime: endTime ? new Date(endTime) : null,
        notes,
        breakTime: breakTime || 0,
      },
    })

    return NextResponse.json(updatedTimeEntry)
  } catch (error) {
    console.error("Error updating time entry:", error)
    return NextResponse.json({ error: "Error al actualizar entrada de tiempo" }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  // Redirigir a PUT para mantener compatibilidad
  return PUT(request, { params })
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params

    // Verificar que la entrada pertenece al usuario
    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: Number.parseInt(id),
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 })
    }

    // Usar userId para TimeEntry
    if (timeEntry.userId !== Number.parseInt(session.user.id)) {
      // En desarrollo, permitir usuarios de emergencia sin verificar en la base de datos
      let skipUserCheck = false
      if (process.env.NODE_ENV === "development") {
        if (
          (session.user.username === "Carlos" && Number.parseInt(session.user.id) === 1) ||
          (session.user.username === "admin" && Number.parseInt(session.user.id) === 0) ||
          (session.user.username === "Raul" && Number.parseInt(session.user.id) === 2)
        ) {
          console.log("Modo desarrollo: permitiendo usuario de emergencia sin verificación en DB")
          skipUserCheck = true
        }
      }

      if (!skipUserCheck) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    await prisma.timeEntry.delete({
      where: {
        id: Number.parseInt(id),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting time entry:", error)
    return NextResponse.json({ error: "Error al eliminar entrada de tiempo" }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = params

    // Verificar que la entrada pertenece al usuario
    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        id: Number.parseInt(id),
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 })
    }

    // Usar userId para TimeEntry
    if (timeEntry.userId !== Number.parseInt(session.user.id)) {
      // En desarrollo, permitir usuarios de emergencia sin verificar en la base de datos
      let skipUserCheck = false
      if (process.env.NODE_ENV === "development") {
        if (
          (session.user.username === "Carlos" && Number.parseInt(session.user.id) === 1) ||
          (session.user.username === "admin" && Number.parseInt(session.user.id) === 0) ||
          (session.user.username === "Raul" && Number.parseInt(session.user.id) === 2)
        ) {
          console.log("Modo desarrollo: permitiendo usuario de emergencia sin verificación en DB")
          skipUserCheck = true
        }
      }

      if (!skipUserCheck) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Error fetching time entry:", error)
    return NextResponse.json({ error: "Error al obtener entrada de tiempo" }, { status: 500 })
  }
}
