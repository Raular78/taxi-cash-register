"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { format, startOfMonth, endOfMonth, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash, Download, FileUp, Loader2 } from "lucide-react"
import BackToAdminButton from "@/components/BackToAdminButton"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DateFilter } from "@/components/date-filter"
import { useFixedExpenses } from "@/hooks/use-api-queries"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface Expense {
  id: number
  date: string
  category: string
  amount: number
  description: string
  receipt?: string
  status: string
  userId?: number
  user?: {
    id: number
    username: string
  }
  notes?: string
  isRecurring?: boolean
  frequency?: string
  nextDueDate?: string
}

const EXPENSE_CATEGORIES = [
  "Nóminas",
  "Seguridad Social",
  "Cuota Autónomo",
  "Cuota Agrupación",
  "Seguros",
  "Impuestos",
  "Alquiler",
  "Suministros",
  "Mantenimiento",
  "Reparaciones",
  "Licencias",
  "Otros",
]

// Función auxiliar para formatear fechas de manera segura
const safeFormatDate = (dateString: string | undefined | null, formatStr = "dd/MM/yyyy"): string => {
  if (!dateString) return "-"

  try {
    // Intentar parsear la fecha
    const date = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString)

    // Verificar si la fecha es válida
    if (!isValid(date)) return "-"

    // Formatear la fecha
    return format(date, formatStr, { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error, dateString)
    return "-"
  }
}

export default function GastosFijosPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Fechas iniciales (primer y último día del mes actual)
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()))
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()))

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    category: "",
    description: "",
    amount: "",
    isRecurring: false,
    frequency: "monthly",
    nextDueDate: "",
    notes: "",
  })
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Fetch data using React Query
  const { data: expenses = [], isLoading, error } = useFixedExpenses(fromDate, toDate)

  // Mutations
  const addExpenseMutation = useMutation({
    mutationFn: async (newExpense: any) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      })

      if (!response.ok) {
        throw new Error("Error al crear gasto fijo")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses"] })

      // Close dialog and reset form
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Éxito",
        description: "Gasto fijo creado correctamente",
      })
    },
    onError: (error) => {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el gasto fijo",
        variant: "destructive",
      })
    },
  })

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: number; updateData: any }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar gasto fijo")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses"] })

      // Close dialog and reset form
      setIsEditDialogOpen(false)
      setCurrentExpense(null)
      resetForm()

      toast({
        title: "Éxito",
        description: "Gasto fijo actualizado correctamente",
      })
    },
    onError: (error) => {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el gasto fijo",
        variant: "destructive",
      })
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar gasto fijo")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch expenses query
      queryClient.invalidateQueries({ queryKey: ["expenses"] })

      // Close dialog and reset state
      setIsDeleteDialogOpen(false)
      setExpenseToDelete(null)

      toast({
        title: "Éxito",
        description: "Gasto fijo eliminado correctamente",
      })
    },
    onError: (error) => {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto fijo",
        variant: "destructive",
      })
    },
  })

  // Función para manejar cambios en el filtro de fechas
  const handleDateFilterChange = useCallback((from: Date, to: Date) => {
    setFromDate(from)
    setToDate(to)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0])
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      category: "",
      description: "",
      amount: "",
      isRecurring: false,
      frequency: "monthly",
      nextDueDate: "",
      notes: "",
    })
    setReceiptFile(null)
  }

  const uploadReceipt = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir el recibo")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error al subir el recibo:", error)
      throw error
    }
  }

  const handleAddExpense = async () => {
    try {
      if (!formData.category || !formData.description || !formData.amount) {
        toast({
          title: "Error",
          description: "Por favor, completa todos los campos obligatorios",
          variant: "destructive",
        })
        return
      }

      const amount = Number.parseFloat(formData.amount.replace(",", "."))
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Por favor, introduce un importe válido",
          variant: "destructive",
        })
        return
      }

      let receiptUrl = undefined
      if (receiptFile) {
        try {
          receiptUrl = await uploadReceipt(receiptFile)
        } catch (uploadError) {
          console.error("Error al subir recibo:", uploadError)
          // Continuamos sin el recibo si hay error
        }
      }

      // Use mutation to add expense
      addExpenseMutation.mutate({
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount,
        receipt: receiptUrl,
        notes: formData.notes || null,
        status: "approved", // Los gastos fijos se aprueban automáticamente
        isRecurring: formData.isRecurring,
        frequency: formData.isRecurring ? formData.frequency : null,
        nextDueDate: formData.isRecurring && formData.nextDueDate ? formData.nextDueDate : null,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el gasto fijo",
        variant: "destructive",
      })
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpense(expense)
    setFormData({
      date: format(new Date(expense.date), "yyyy-MM-dd"),
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      notes: expense.notes || "",
      isRecurring: expense.isRecurring || false,
      frequency: expense.frequency || "monthly",
      nextDueDate: expense.nextDueDate ? format(new Date(expense.nextDueDate), "yyyy-MM-dd") : "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateExpense = async () => {
    if (!currentExpense) return

    try {
      if (!formData.category || !formData.description || !formData.amount) {
        toast({
          title: "Error",
          description: "Por favor, completa todos los campos obligatorios",
          variant: "destructive",
        })
        return
      }

      const amount = Number.parseFloat(formData.amount.replace(",", "."))
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Por favor, introduce un importe válido",
          variant: "destructive",
        })
        return
      }

      let receiptUrl = undefined
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile)
      }

      const updateData: any = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount,
        notes: formData.notes || null,
        status: "approved", // Los gastos fijos se aprueban automáticamente
        isRecurring: formData.isRecurring,
        frequency: formData.isRecurring ? formData.frequency : null,
        nextDueDate: formData.isRecurring && formData.nextDueDate ? formData.nextDueDate : null,
      }

      // Solo actualizar el recibo si se proporciona uno nuevo
      if (receiptUrl) {
        updateData.receipt = receiptUrl
      }

      // Use mutation to update expense
      updateExpenseMutation.mutate({ id: currentExpense.id, updateData })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el gasto fijo",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = (id: number) => {
    setExpenseToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return

    // Use mutation to delete expense
    deleteExpenseMutation.mutate(expenseToDelete)
  }

  const exportToExcel = async () => {
    try {
      let url = "/api/export/expenses?type=fixed"

      if (filterCategory !== "all") {
        url += `&category=${encodeURIComponent(filterCategory)}`
      }

      if (filterStatus !== "all") {
        url += `&status=${encodeURIComponent(filterStatus)}`
      }

      window.open(url, "_blank")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar a Excel",
        variant: "destructive",
      })
    }
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  // Calcular total por categoría
  const calculateTotalByCategory = () => {
    const totals: Record<string, number> = {}

    expenses.forEach((expense) => {
      if (!totals[expense.category]) {
        totals[expense.category] = 0
      }
      totals[expense.category] += expense.amount
    })

    return totals
  }

  // Calcular total anual por categoría
  const calculateAnnualTotalByCategory = () => {
    const totals: Record<string, number> = {}

    expenses.forEach((expense) => {
      if (!totals[expense.category]) {
        totals[expense.category] = 0
      }

      // Calcular el importe anual según la frecuencia
      let annualAmount = expense.amount
      if (expense.isRecurring) {
        switch (expense.frequency) {
          case "monthly":
            annualAmount *= 12
            break
          case "quarterly":
            annualAmount *= 4
            break
          case "biannual":
            annualAmount *= 2
            break
          // Para anual, ya es el importe anual
          case "annual":
            break
        }
      }

      totals[expense.category] += annualAmount
    })

    return totals
  }

  const totalsByCategory = calculateTotalByCategory()
  const totalAmount = Object.values(totalsByCategory).reduce((sum, amount) => sum + amount, 0)
  const annualTotalsByCategory = calculateAnnualTotalByCategory()
  const annualTotalAmount = Object.values(annualTotalsByCategory).reduce((sum, amount) => sum + amount, 0)

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Cargando datos...</h2>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-medium text-red-800 mb-2">Error al cargar los datos</h2>
          <p className="text-red-600 mb-4">
            Ha ocurrido un error al cargar los datos. Por favor, intenta recargar la página.
          </p>
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gastos Fijos</h1>
        <BackToAdminButton />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-2">Filtrar por fecha</h2>
        <DateFilter
          initialFrom={fromDate}
          initialTo={toDate}
          onFilterChange={handleDateFilterChange}
          className="w-full"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap w-full sm:w-auto gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:inline">Exportar</span>
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsUploadDialogOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />
            <span className="sm:inline">Importar</span>
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Nuevo Gasto</span>
          </Button>
        </div>
      </div>

      {/* Resumen por categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Categoría</CardTitle>
          <CardDescription>Total de gastos fijos por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(totalsByCategory).map(([category, total]) => (
              <Card key={category} className="bg-muted/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xl font-bold">{formatCurrency(total)}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="bg-primary/10">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Resumen anual */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Anual</CardTitle>
          <CardDescription>Proyección anual de gastos fijos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(annualTotalsByCategory).map(([category, total]) => (
              <Card key={`annual-${category}`} className="bg-muted/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xl font-bold">{formatCurrency(total)}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="bg-primary/10">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Total Anual</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xl font-bold">{formatCurrency(annualTotalAmount)}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="category-filter">Categoría</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de gastos fijos */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Gastos Fijos</CardTitle>
          <CardDescription>{expenses.length} gastos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Recurrente</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Próximo Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Recibo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{safeFormatDate(expense.date)}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{expense.isRecurring ? "Sí" : "No"}</TableCell>
                      <TableCell>
                        {expense.frequency
                          ? expense.frequency === "monthly"
                            ? "Mensual"
                            : expense.frequency === "quarterly"
                              ? "Trimestral"
                              : expense.frequency === "biannual"
                                ? "Semestral"
                                : "Anual"
                          : "-"}
                      </TableCell>
                      <TableCell>{safeFormatDate(expense.nextDueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expense.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : expense.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {expense.status === "approved"
                            ? "Aprobado"
                            : expense.status === "rejected"
                              ? "Rechazado"
                              : "Pendiente"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expense.receipt ? (
                          <a
                            href={expense.receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(expense.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay gastos fijos registrados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para añadir gasto */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Gasto Fijo</DialogTitle>
            <DialogDescription>
              Introduce los datos del gasto fijo. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                name="category"
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Importe (€) *</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  handleInputChange({
                    target: { name: "isRecurring", type: "checkbox", value: checked, checked } as any,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="isRecurring">Gasto recurrente</Label>
            </div>
            {formData.isRecurring && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select
                    name="frequency"
                    value={formData.frequency}
                    onValueChange={(value) => handleSelectChange("frequency", value)}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Selecciona una frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="biannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Próximo Vencimiento</Label>
                  <Input
                    id="nextDueDate"
                    name="nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="receipt">Recibo</Label>
              <Input id="receipt" name="receipt" type="file" onChange={handleFileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending}>
              {addExpenseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar gasto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Gasto Fijo</DialogTitle>
            <DialogDescription>
              Modifica los datos del gasto fijo. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Fecha *</Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría *</Label>
              <Select
                name="category"
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción *</Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Importe (€) *</Label>
              <Input
                id="edit-amount"
                name="amount"
                type="text"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  handleInputChange({
                    target: { name: "isRecurring", type: "checkbox", value: checked, checked } as any,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="edit-isRecurring">Gasto recurrente</Label>
            </div>
            {formData.isRecurring && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-frequency">Frecuencia</Label>
                  <Select
                    name="frequency"
                    value={formData.frequency}
                    onValueChange={(value) => handleSelectChange("frequency", value)}
                  >
                    <SelectTrigger id="edit-frequency">
                      <SelectValue placeholder="Selecciona una frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="biannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nextDueDate">Próximo Vencimiento</Label>
                  <Input
                    id="edit-nextDueDate"
                    name="nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-receipt">Recibo (Subir nuevo)</Label>
              <Input id="edit-receipt" name="receipt" type="file" onChange={handleFileChange} />
              {currentExpense && currentExpense.receipt && (
                <div className="mt-1">
                  <a
                    href={currentExpense.receipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver recibo actual
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea id="edit-notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateExpense} disabled={updateExpenseMutation.isPending}>
              {updateExpenseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este gasto fijo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpense} disabled={deleteExpenseMutation.isPending}>
              {deleteExpenseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para importar gastos */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Gastos Fijos</DialogTitle>
            <DialogDescription>Sube un archivo CSV o Excel con los gastos fijos a importar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Archivo (CSV o Excel)</Label>
              <Input id="import-file" type="file" accept=".csv,.xlsx,.xls" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                El archivo debe contener las siguientes columnas: Fecha, Categoría, Descripción, Importe, Notas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
