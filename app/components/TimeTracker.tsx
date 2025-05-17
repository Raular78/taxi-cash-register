"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Clock, CalendarClock } from "lucide-react"
import type { TimeEntry } from "@prisma/client"

interface TimeTrackerProps {
  activeTimeEntry: TimeEntry | null
  recentTimeEntries: TimeEntry[]
  onUpdate: () => void
}

export default function TimeTracker({
  activeTimeEntry: initialActiveEntry,
  recentTimeEntries: initialRecentEntries,
  onUpdate,
}: TimeTrackerProps) {
  const { data: session } = useSession()
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(initialActiveEntry)
  const [recentTimeEntries, setRecentTimeEntries] = useState<TimeEntry[]>(initialRecentEntries)
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setActiveTimeEntry(initialActiveEntry)
    setRecentTimeEntries(initialRecentEntries)
  }, [initialActiveEntry, initialRecentEntries])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (activeTimeEntry) {
      interval = setInterval(() => {
        const startTime = new Date(activeTimeEntry.startTime)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

        const hours = Math.floor(diffInSeconds / 3600)
        const minutes = Math.floor((diffInSeconds % 3600) / 60)
        const seconds = diffInSeconds % 60

        setElapsedTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        )
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimeEntry])

  const startTimeTracking = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: new Date(),
        }),
      })

      if (response.ok) {
        const newTimeEntry = await response.json()
        setActiveTimeEntry(newTimeEntry)
        onUpdate()
      } else {
        console.error("Error al iniciar el seguimiento de tiempo")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const stopTimeTracking = async () => {
    if (!activeTimeEntry || !session) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/time-entries/${activeTimeEntry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: new Date(),
        }),
      })

      if (response.ok) {
        setActiveTimeEntry(null)
        onUpdate()
      } else {
        console.error("Error al detener el seguimiento de tiempo")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        {activeTimeEntry ? (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold">{elapsedTime}</div>
              <div className="text-sm text-gray-500">
                Inicio: {format(new Date(activeTimeEntry.startTime), "HH:mm")}
              </div>
            </div>
            <Button className="w-full" variant="destructive" onClick={stopTimeTracking} disabled={isLoading}>
              <Pause className="mr-2 h-4 w-4" />
              Finalizar Jornada
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold">00:00:00</div>
              <div className="text-sm text-gray-500">Sin jornada activa</div>
            </div>
            <Button className="w-full" onClick={startTimeTracking} disabled={isLoading}>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Jornada
            </Button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <CalendarClock className="mr-2 h-4 w-4" />
          Últimas Jornadas
        </h3>
        {recentTimeEntries.length > 0 ? (
          <div className="space-y-2">
            {recentTimeEntries.slice(0, 3).map((entry) => (
              <Card key={entry.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{format(new Date(entry.startTime), "dd/MM/yyyy")}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(entry.startTime), "HH:mm")} -
                      {entry.endTime ? format(new Date(entry.endTime), " HH:mm") : " En curso"}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-gray-400" />
                    <span>
                      {entry.endTime
                        ? `${Math.floor((entry.totalMinutes || 0) / 60)}h ${(entry.totalMinutes || 0) % 60}m`
                        : formatDistanceToNow(new Date(entry.startTime), { locale: es })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-gray-500">No hay jornadas recientes</div>
        )}
      </div>
    </div>
  )
}
