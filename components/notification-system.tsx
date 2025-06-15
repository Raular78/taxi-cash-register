"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bell, X, Check } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  date: Date
  read: boolean
  data?: any
}

export function NotificationSystem() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchNotifications()
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread || 0)
      }
    } catch (error) {
      console.error("Error al obtener notificaciones:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, read: true }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expense_generated":
        return "💰"
      case "record_created":
        return "📝"
      case "image_missing":
        return "⚠️"
      case "balance_alert":
        return "📊"
      default:
        return "🔔"
    }
  }

  if (!session) return null

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notificaciones</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {unreadCount > 0 && (
                <CardDescription>
                  Tienes {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} sin leer
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Cargando notificaciones...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No hay notificaciones</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                        !notification.read ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{notification.title}</p>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.date), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Marcar todas como leídas
                      notifications.filter((n) => !n.read).forEach((n) => markAsRead(n.id))
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marcar todas como leídas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
