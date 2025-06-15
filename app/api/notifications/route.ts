import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"

// Simulamos un sistema de notificaciones en memoria
// En producción, esto debería usar una base de datos o Redis
let notifications: Array<{
  id: string
  type: string
  title: string
  message: string
  date: Date
  read: boolean
  userId?: number
  data?: any
}> = []

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Filtrar notificaciones por usuario si no es admin
    const userNotifications =
      session.user.role === "admin"
        ? notifications
        : notifications.filter((n) => n.userId === Number.parseInt(session.user.id) || !n.userId)

    return NextResponse.json({
      notifications: userNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      unread: userNotifications.filter((n) => !n.read).length,
    })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()

    const notification = {
      id: Date.now().toString(),
      type: data.type,
      title: data.title,
      message: data.message,
      date: new Date(),
      read: false,
      userId: data.userId,
      data: data.data,
    }

    notifications.push(notification)

    // Mantener solo las últimas 100 notificaciones
    if (notifications.length > 100) {
      notifications = notifications.slice(-100)
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("Error al crear notificación:", error)
    return NextResponse.json({ error: "Error al crear notificación" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { notificationId, read } = await request.json()

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
