"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Play, Square } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"

export default function TimeTracker() {
  const { data: session } = useSession()
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [breakTime, setBreakTime] = useState(0) // en minutos
  const [notes, setNotes] = useState("")
  const [activeEntry, setActiveEntry] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  // Actualizar el tiempo actual cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Cargar entrada activa al iniciar
  useEffect(() => {
    const fetchActiveEntry = async () => {
      try {
        const response = await fetch("/api/time-entries/active")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setActiveEntry(data)
            setStartTime(new Date(data.startTime))
            setIsTracking(true)
            setNotes(data.notes || "")
          }
        }
      } catch (error) {
        console.error("Error fetching active time entry:", error)
      }
    }

    const fetchRecentEntries = async () => {
      try {
        const response = await fetch("/api/time-entries/recent")
        if (response.ok) {
          const data = await response.json()
          setRecentEntries(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Error fetching recent time entries:", error)
        setRecentEntries([])
      }
    }

    fetchActiveEntry()
    fetchRecentEntries()
  }, [])

  const startTracking = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: new Date(),
          notes,
          breakTime: 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar el registro de tiempo")
      }

      const data = await response.json()
      setActiveEntry(data)
      setStartTime(new Date(data.startTime))
      setIsTracking(true)

      toast({
        title: "Registro iniciado",
        description: "Se ha iniciado el registro de tiempo correctamente",
      })
    } catch (error) {
      console.error("Error starting time tracking:", error)
      toast({
        title: "Error",
        description: error.message || "Error al iniciar el registro de tiempo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stopTracking = async () => {
    if (!activeEntry) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/time-entries/${activeEntry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: new Date(),
          breakTime: Number.parseInt(breakTime.toString()),
          notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al detener el registro de tiempo")
      }

      setIsTracking(false)
      setStartTime(null)
      setBreakTime(0)
      setNotes("")
      setActiveEntry(null)

      // Actualizar entradas recientes
      const recentResponse = await fetch("/api/time-entries/recent")
      if (recentResponse.ok) {
        const data = await recentResponse.json()
        setRecentEntries(Array.isArray(data) ? data : [])
      }

      toast({
        title: "Registro finalizado",
        description: "Se ha finalizado el registro de tiempo correctamente",
      })
    } catch (error) {
      console.error("Error stopping time tracking:", error)
      toast({
        title: "Error",
        description: error.message || "Error al detener el registro de tiempo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular tiempo transcurrido
  const getElapsedTime = () => {
    if (!startTime) return "00:00:00"

    const elapsedMs = currentTime.getTime() - startTime.getTime()
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Control Horario
          </CardTitle>
          <CardDescription>
            Registro de jornada laboral según normativa española (Real Decreto-ley 8/2019)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isTracking ? (
              <>
                <div className="text-center">
                  <div className="text-4xl font-bold tabular-nums">{getElapsedTime()}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inicio: {format(startTime!, "HH:mm:ss - dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="breakTime">Tiempo de descanso (minutos)</Label>
                    <Input
                      id="breakTime"
                      type="number"
                      value={breakTime}
                      onChange={(e) => setBreakTime(Number.parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Añade notas sobre tu jornada..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-lg mb-2">Inicia tu jornada laboral</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Pulsa el botón para comenzar a registrar tu tiempo de trabajo
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isTracking ? (
            <Button variant="destructive" onClick={stopTracking} disabled={isLoading} className="w-full">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Finalizar Jornada
            </Button>
          ) : (
            <Button onClick={startTracking} disabled={isLoading} className="w-full">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Iniciar Jornada
            </Button>
          )}
        </CardFooter>
      </Card>

      {recentEntries && recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registros Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentEntries || []).map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{format(new Date(entry.startTime), "dd/MM/yyyy", { locale: es })}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(entry.startTime), "HH:mm", { locale: es })} -
                        {entry.endTime ? format(new Date(entry.endTime), " HH:mm", { locale: es }) : " En curso"}
                      </p>
                    </div>
                    {entry.endTime && (
                      <div className="text-right">
                        <p className="font-medium">
                          {(() => {
                            const start = new Date(entry.startTime)
                            const end = new Date(entry.endTime)
                            const diffMs = end.getTime() - start.getTime()
                            const diffHrs = diffMs / (1000 * 60 * 60)
                            const breakHrs = (entry.breakTime || 0) / 60
                            return (diffHrs - breakHrs).toFixed(2)
                          })()} horas
                        </p>
                        {entry.breakTime > 0 && (
                          <p className="text-xs text-muted-foreground">Descanso: {entry.breakTime} min</p>
                        )}
                      </div>
                    )}
                  </div>
                  {entry.notes && <p className="text-sm mt-2 border-t pt-2">{entry.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
