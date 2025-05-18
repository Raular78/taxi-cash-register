"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Loader2, Play, Square, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import { SimpleDatePicker } from "../../../components/ui/simple-date-picker"

interface TimeEntry {
  id: number
  userId: number
  startTime: string
  endTime: string | null
  breakTime: number | null
  notes: string | null
}

export default function ConductorControlHorario() {
  const { data: session } = useSession()
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [monthEntries, setMonthEntries] = useState<TimeEntry[]>([])
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)

  // Cargar entrada activa y entradas recientes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Verificar si hay una entrada activa
        const activeRes = await fetch("/api/time-entries/active")
        const activeData = await activeRes.json()

        if (activeData.entry) {
          setActiveEntry(activeData.entry)
        }

        // Obtener entradas recientes
        const recentRes = await fetch("/api/time-entries/recent")
        const recentData = await recentRes.json()

        if (recentData.entries) {
          setRecentEntries(recentData.entries)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Actualizar cada minuto para mantener el tiempo actualizado
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  // Cargar entradas del mes seleccionado
  useEffect(() => {
    const fetchMonthEntries = async () => {
      setIsLoadingMonth(true)
      try {
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const res = await fetch(
          `/api/time-entries?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        const data = await res.json()

        if (data.entries) {
          setMonthEntries(data.entries)
        }
      } catch (error) {
        console.error("Error al cargar entradas del mes:", error)
      } finally {
        setIsLoadingMonth(false)
      }
    }

    fetchMonthEntries()
  }, [date])

  // Iniciar registro de tiempo
  const startTimeEntry = async () => {
    setIsStarting(true)
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (data.entry) {
        setActiveEntry(data.entry)
        // Actualizar la lista de entradas recientes
        setRecentEntries((prev) => [data.entry, ...prev])
      }
    } catch (error) {
      console.error("Error al iniciar registro:", error)
    } finally {
      setIsStarting(false)
    }
  }

  // Detener registro de tiempo
  const stopTimeEntry = async () => {
    if (!activeEntry) return

    setIsStopping(true)
    try {
      const res = await fetch(`/api/time-entries/${activeEntry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (data.entry) {
        setActiveEntry(null)
        // Actualizar la entrada en la lista de recientes
        setRecentEntries((prev) => prev.map((entry) => (entry.id === data.entry.id ? data.entry : entry)))
      }
    } catch (error) {
      console.error("Error al detener registro:", error)
    } finally {
      setIsStopping(false)
    }
  }

  // Calcular duración en formato legible
  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) {
      const duration = differenceInMinutes(new Date(), parseISO(startTime))
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      return `${hours}h ${minutes}m`
    } else {
      const duration = differenceInMinutes(parseISO(endTime), parseISO(startTime))
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      return `${hours}h ${minutes}m`
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Control Horario</h1>

      <Tabs defaultValue="actual">
        <TabsList className="mb-4">
          <TabsTrigger value="actual">Registro Actual</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="actual" className="space-y-6">
          {/* Tarjeta de registro actual */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeEntry ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inicio:</p>
                      <p className="text-lg font-medium">
                        {format(parseISO(activeEntry.startTime), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duración:</p>
                      <p className="text-lg font-medium">{formatDuration(activeEntry.startTime, null)}</p>
                    </div>
                    <Button variant="destructive" onClick={stopTimeEntry} disabled={isStopping}>
                      {isStopping ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4 mr-2" />
                      )}
                      Finalizar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">No hay ningún registro de tiempo activo</p>
                  <div className="flex justify-center">
                    <Button onClick={startTimeEntry} disabled={isStarting}>
                      {isStarting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Iniciar Registro
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registros recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Registros Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recentEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(parseISO(entry.startTime), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(parseISO(entry.startTime), "HH:mm")}</TableCell>
                        <TableCell>{entry.endTime ? format(parseISO(entry.endTime), "HH:mm") : "—"}</TableCell>
                        <TableCell>{formatDuration(entry.startTime, entry.endTime)}</TableCell>
                        <TableCell>
                          {entry.endTime ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              En curso
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay registros recientes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMonth ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : monthEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(parseISO(entry.startTime), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(parseISO(entry.startTime), "HH:mm")}</TableCell>
                        <TableCell>{entry.endTime ? format(parseISO(entry.endTime), "HH:mm") : "—"}</TableCell>
                        <TableCell>{formatDuration(entry.startTime, entry.endTime)}</TableCell>
                        <TableCell>
                          {entry.endTime ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              En curso
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay registros para el mes seleccionado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <SimpleDatePicker
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="rounded-md border"
                    locale={es}
                  />
                </div>
                <div className="md:w-1/2">
                  <h3 className="text-lg font-medium mb-4">
                    Registros del {format(date, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </h3>
                  {isLoadingMonth ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {monthEntries.filter(
                        (entry) => format(parseISO(entry.startTime), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
                      ).length > 0 ? (
                        <div className="space-y-4">
                          {monthEntries
                            .filter(
                              (entry) => format(parseISO(entry.startTime), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
                            )
                            .map((entry) => (
                              <Card key={entry.id} className="p-4">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-primary" />
                                    <div>
                                      <p className="font-medium">
                                        {format(parseISO(entry.startTime), "HH:mm")} -{" "}
                                        {entry.endTime ? format(parseISO(entry.endTime), "HH:mm") : "En curso"}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Duración: {formatDuration(entry.startTime, entry.endTime)}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      entry.endTime
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                  >
                                    {entry.endTime ? "Completado" : "En curso"}
                                  </Badge>
                                </div>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No hay registros para este día</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
