"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "..\..\..\..\components\ui/card"
import { Button } from "..\..\..\..\components\ui/button"
import { Input } from "..\..\..\..\components\ui/input"
import { Label } from "..\..\..\..\components\ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "..\..\..\..\components\ui/select"
import { Calendar } from "..\..\..\..\components\ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "..\..\..\..\components\ui/popover"
import { Textarea } from "..\..\..\..\components\ui/textarea"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, CalendarIcon, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "..\..\..\..\components\ui/alert"

interface User {
  id: number
  username: string
  email: string
}

export default function CargarPDFNomina() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [periodStart, setPeriodStart] = useState<Date | undefined>(undefined)
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(undefined)
  const [amount, setAmount] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Cargar conductores al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await fetch("/api/users?role=driver")
        if (!response.ok) {
          throw new Error("Error al cargar conductores")
        }
        const data = await response.json()
        setUsers(data || [])
        
        // Si solo hay un conductor, seleccionarlo automáticamente
        if (data && data.length === 1) {
          setSelectedUserId(data[0].id.toString())
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("No se pudieron cargar los conductores. Por favor, inténtalo de nuevo.")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!selectedUserId) {
      setError("Por favor, selecciona un conductor.")
      return
    }

    if (!periodStart || !periodEnd) {
      setError("Por favor, selecciona las fechas de inicio y fin del período.")
      return
    }

    if (!selectedFile) {
      setError("Por favor, selecciona un archivo PDF de nómina.")
      return
    }

    if (selectedFile.type !== "application/pdf") {
      setError("El archivo debe ser un PDF.")
      return
    }

    setIsLoading(true)

    try {
      // Primero subimos el archivo PDF
      const formData = new FormData()
      formData.append("file", selectedFile)

      const uploadResponse = await fetch("/api/upload/payroll-pdf", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Error al subir el archivo PDF")
      }

      const { fileUrl } = await uploadResponse.json()

      // Luego creamos la nómina con la URL del PDF
      const payrollResponse = await fetch("/api/payrolls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number.parseInt(selectedUserId),
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          baseSalary: Number.parseFloat(amount) || 0,
          commissions: 0,
          bonuses: 0,
          deductions: 0,
          taxWithholding: 0,
          netAmount: Number.parseFloat(amount) || 0,
          status: "paid",
          paymentDate: new Date().toISOString(),
          notes,
          pdfUrl: fileUrl,
        }),
      })

      if (!payrollResponse.ok) {
        throw new Error("Error al crear la nómina")
      }

      setSuccess("Nómina cargada correctamente.")

      // Resetear el formulario
      setSelectedUserId("")
      setPeriodStart(undefined)
      setPeriodEnd(undefined)
      setAmount("")
      setNotes("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar la nómina. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <Button variant="ghost" onClick={() => router.push("/admin/nominas")} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <CardTitle>Cargar PDF de Nómina</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="driver">Conductor</Label>
                {isLoadingUsers ? (
                  <div className="text-sm text-muted-foreground">Cargando conductores...</div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-red-500">No se encontraron conductores</div>
                ) : users.length === 1 ? (
                  <div className="flex items-center justify-between border rounded-md p-2">
                    <span>{users[0].username}</span>
                    <span className="text-sm text-muted-foreground">Seleccionado automáticamente</span>
                  </div>
                ) : (
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="driver">
                      <SelectValue placeholder="Seleccionar conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodStart ? format(periodStart, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white text-black" align="start">
                      <Calendar
                        mode="single"
                        selected={periodStart}
                        onSelect={setPeriodStart}
                        initialFocus
                        locale={es}
                        className="bg-white text-black"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Fecha de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodEnd ? format(periodEnd, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white text-black" align="start">
                      <Calendar
                        mode="single"
                        selected={periodEnd}
                        onSelect={setPeriodEnd}
                        initialFocus
                        locale={es}
                        className="bg-white text-black"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Importe Neto (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="file">Archivo PDF de nómina</Label>
                <div className="flex items-center gap-2">
                  <Input id="file" type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar
                  </Button>
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">Archivo seleccionado: {selectedFile.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre esta nómina"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/nominas")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !selectedUserId}>
                {isLoading ? "Cargando..." : "Guardar Nómina"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
