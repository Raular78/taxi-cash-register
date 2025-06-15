import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"

// Simulamos una base de datos de notificaciones en memoria
let notifications: Array<{
  id: string
  type: string
  title: string
  message: string
  date: Date
  read: boolean
  data?: any
}> = []

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Generar notificaciones de prueba si no hay ninguna
    if (notifications.length === 0) {
      notifications = [
        {
          id: "1",
          type: "expense_generated",
          title: "Gasto Recurrente Generado",
          message: "Se ha generado automáticamente: Alquiler oficina por 500€",
          date: new Date(),
          read: false,
          data: { amount: 500, category: "Alquiler" },
        },
        {
          id: "2",
          type: "record_created",
          title: "Nuevo Registro Diario",
          message: "Se ha creado un nuevo registro diario por 150€",
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          read: false,
          data: { amount: 150 },
        },
        {
          id: "3",
          type: "image_missing",
          title: "Imagen Faltante",
          message: "El registro del 15/06/2025 no tiene imagen adjunta",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
          read: true,
          data: { recordId: 123 },
        },
      ]
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({
      notifications: notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      unread: unreadCount,
    })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { notificationId, read } = await request.json()

    // Marcar notificación como leída
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = read
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al actualizar notificación:", error)
    return NextResponse.json({ error: "Error al actualizar notificación" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { type, title, message, data } = await request.json()

    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      date: new Date(),
      read: false,
      data,
    }

    notifications.unshift(newNotification)

    // Mantener solo las últimas 50 notificaciones
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50)
    }

    return NextResponse.json(newNotification)
  } catch (error) {
    console.error("Error al crear notificación:", error)
    return NextResponse.json({ error: "Error al crear notificación" }, { status: 500 })
  }
}
