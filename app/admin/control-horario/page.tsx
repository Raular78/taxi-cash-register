"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, startOfWeek, endOfWeek, differenceInMinutes, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Download, FileText } from 'lucide-react'

interface TimeEntry {
  id: number
  userId: number
  startTime: string
  endTime: string | null
  breakTime: number
  totalMinutes: number | null
  notes: string | null
  user: {
    id: number
    username: string
    email: string
  }
}

interface Driver {
  id: number
  username: string
  email: string
}

export default function AdminControlHorario() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch("/api/users?role=driver")
        if (!response.ok) {
          throw new Error("Error al cargar conductores")
        }
        const data = await response.json()
        setDrivers(data || [])
      } catch (error) {
        console.error("Error fetching drivers:", error)
      }
    }

    fetchDrivers()
  }, [])

  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (!dateRange.from || !dateRange.to) return

      setIsLoading(true)
      try {
        const startDate = format(dateRange.from, "yyyy-MM-dd")
        const endDate = format(dateRange.to, "yyyy-MM-dd")
        
        let url = `/api/time-entries/admin?startDate=${startDate}&endDate=${endDate}`
        if (selectedDriver !== "all") {
          url += `&userId=${selectedDriver}`
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error("Error al cargar registros horarios")
        }
        
        const data = await response.json()
        setTimeEntries(data || [])
      } catch (error) {
        console.error("Error fetching time entries:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeEntries()
  }, [dateRange, selectedDriver])

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "-"
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const calculateDuration = (startTime: string, endTime: string | null, breakTime: number) => {
    if (!endTime) return "-"
    
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    const totalMinutes = differenceInMinutes(end, start) - breakTime
    
    return formatDuration(totalMinutes)
  }

  const handleThisWeek = () => {
    setDateRange({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    })
  }

  const handleLastWeek = () => {
    const today = new Date()
    const lastWeekStart = startOfWeek(addDays(today, -7), { weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(addDays(today, -7), { weekStartsOn: 1 })
    
    setDateRange({
      from: lastWeekStart,
      to: lastWeekEnd,
    })
  }

  const handleExportPDF = () => {
    // Implementar exportación a PDF
    console.log("Exportar a PDF")
  }

  const handleExportExcel = () => {
    // Implementar exportación a Excel
    console.log("Exportar a Excel")
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Control Horario</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-auto justify-start text-left font-normal bg-white text-black"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: es })
                        )
                      ) : (
                        <span>Seleccionar fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white text-black" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to })
                        }
                      }}
                      initialFocus
                      className="bg-white text-black"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleThisWeek}>
                  Esta semana
                </Button>
                <Button variant="outline" onClick={handleLastWeek}>
                  Semana anterior
                </Button>
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={selectedDriver}
                onValueChange={setSelectedDriver}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los conductores" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="all">Todos los conductores</SelectItem>
                  {drivers && drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Cargando registros horarios...</p>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <p>No hay registros horarios para el período seleccionado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora Inicio</TableHead>
                  <TableHead>Hora Fin</TableHead>
                  <TableHead>Descanso</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.user?.username || "Desconocido"}</TableCell>
                    <TableCell>{format(new Date(entry.startTime), "dd/MM/yyyy", { locale: es })}</TableCell>
                    <TableCell>{format(new Date(entry.startTime), "HH:mm", { locale: es })}</TableCell>
                    <TableCell>
                      {entry.endTime ? format(new Date(entry.endTime), "HH:mm", { locale: es }) : "En curso"}
                    </TableCell>
                    <TableCell>{formatDuration(entry.breakTime)}</TableCell>
                    <TableCell>
                      {entry.totalMinutes 
                        ? formatDuration(entry.totalMinutes)
                        : calculateDuration(entry.startTime, entry.endTime, entry.breakTime)}
                    </TableCell>
                    <TableCell>{entry.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
