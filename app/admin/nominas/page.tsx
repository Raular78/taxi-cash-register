"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "..\..\..\components\ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "..\..\..\components\ui/table"
import { Button } from "..\..\..\components\ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "..\..\..\components\ui/select"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Download, Plus, Search, FileCheck, FileClock, Upload } from "lucide-react"
import { Input } from "..\..\..\components\ui/input"
import { Badge } from "..\..\..\components\ui/badge"

interface Payroll {
  id: number
  userId: number
  periodStart: string
  periodEnd: string
  baseSalary: number
  commissions: number
  bonuses: number
  deductions: number
  taxWithholding: number
  netAmount: number
  status: string
  paymentDate: string | null
  notes: string | null
  pdfUrl: string | null
  user: {
    id: number
    username: string
    email: string
  }
}

interface User {
  id: number
  username: string
  email: string
}

export default function AdminNominas() {
  const router = useRouter()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para formatear fecha
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return "Fecha inválida"
      return format(date, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Error de formato"
    }
  }

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Obtener usuarios (conductores)
        const usersResponse = await fetch("/api/users?role=driver")
        if (!usersResponse.ok) {
          throw new Error("Error al cargar conductores")
        }
        const usersData = await usersResponse.json()
        setUsers(usersData || [])

        // Obtener nóminas
        const payrollsResponse = await fetch("/api/payrolls")
        if (!payrollsResponse.ok) {
          // Si la API no existe aún, usamos datos de ejemplo
          console.warn("API de nóminas no implementada, usando datos de ejemplo")
          setPayrolls([])
          return
        }
        const payrollsData = await payrollsResponse.json()
        setPayrolls(payrollsData || [])
      } catch (err) {
        console.warn("Error fetching payrolls, using empty array:", err)
        setPayrolls([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar nóminas por usuario, estado y término de búsqueda
  const filteredPayrolls = payrolls.filter((payroll) => {
    // Filtrar por usuario
    const userMatch = selectedUserId === "all" || payroll.userId.toString() === selectedUserId

    // Filtrar por estado
    const statusMatch = selectedStatus === "all" || payroll.status === selectedStatus

    // Filtrar por término de búsqueda
    let searchMatch = true
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const username = payroll.user?.username?.toLowerCase() || ""
      const notes = payroll.notes?.toLowerCase() || ""

      searchMatch = username.includes(term) || notes.includes(term)
    }

    return userMatch && statusMatch && searchMatch
  })

  const handleCreatePayroll = () => {
    router.push("/admin/nueva-nomina")
  }

  const handleViewPayroll = (payrollId: number) => {
    router.push(`/admin/nominas/${payrollId}`)
  }

  const handleUploadPDF = () => {
    router.push("/admin/nominas/cargar-pdf")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-64">
              <p className="text-lg">Cargando nóminas...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nóminas</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleUploadPDF} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Cargar PDF
            </Button>
            <Button onClick={handleCreatePayroll}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Nómina
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Conductor</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los conductores</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Buscar</label>
              <div className="flex items-center">
                <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredPayrolls.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">No hay nóminas disponibles</p>
              <div className="flex justify-center gap-2 mt-4">
                <Button onClick={handleUploadPDF} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Cargar PDF de nómina
                </Button>
                <Button onClick={handleCreatePayroll} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear nómina manualmente
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Importe Bruto</TableHead>
                  <TableHead>Importe Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>{payroll.user?.username || `Conductor ID: ${payroll.userId}`}</TableCell>
                    <TableCell>
                      {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)}
                    </TableCell>
                    <TableCell>{formatCurrency(payroll.baseSalary + payroll.commissions + payroll.bonuses)}</TableCell>
                    <TableCell>{formatCurrency(payroll.netAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={payroll.status === "paid" ? "default" : "secondary"}>
                        {payroll.status === "paid" ? "Pagada" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payroll.pdfUrl ? (
                        <a href={payroll.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" title="Ver PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </a>
                      ) : (
                        <Badge variant="outline">Sin PDF</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewPayroll(payroll.id)}
                        title="Ver detalles"
                      >
                        {payroll.status === "paid" ? (
                          <FileCheck className="h-4 w-4" />
                        ) : (
                          <FileClock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" title="Descargar PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
