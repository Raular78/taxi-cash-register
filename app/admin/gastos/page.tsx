"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, Search, Plus, Receipt } from "lucide-react"
import { format, parseISO } from "date-fns"
import { SimpleDateRangePicker } from "@/components/ui/simple-date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import BackToAdminButton from "@/components/BackToAdminButton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Expense {
  id: number
  date: string
  category: string
  description: string
  amount: number
  taxAmount: number
  totalAmount: number
  receipt?: string
  status: string
}

const FIXED_EXPENSES = [
  {
    id: "ss-autonomo",
    name: "Seguridad Social Autónomo",
    amount: 314,
    frequency: "Mensual",
  },
  {
    id: "ss-conductor",
    name: "Seguridad Social Conductor",
    amount: 660.81,
    frequency: "Mensual",
  },
  {
    id: "embargo",
    name: "Embargo",
    amount: 353.11,
    frequency: "Mensual",
    total: 15440.91,
    installments: 44,
    startDate: "Enero 2025",
  },
  {
    id: "agrupacion",
    name: "Agrupación de Taxis",
    amount: 185,
    frequency: "Mensual",
  },
]

export default function AdminGastos() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    amount: "",
    receipt: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Simular carga de datos
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true)
      try {
        // Simulación de datos
        setTimeout(() => {
          const mockExpenses: Expense[] = [
            {
              id: 1,
              date: "2025-05-01",
              category: "Combustible",
              description: "Repostaje semanal",
              amount: 82.64,
              taxAmount: 17.36,
              totalAmount: 100,
              status: "completed",
            },
            {
              id: 2,
              date: "2025-05-03",
              category: "Mantenimiento",
              description: "Cambio de aceite",
              amount: 49.59,
              taxAmount: 10.41,
              totalAmount: 60,
              receipt: "https://example.com/receipt1.pdf",
              status: "completed",
            },
            {
              id: 3,
              date: "2025-05-05",
              category: "Seguro",
              description: "Pago mensual seguro vehículo",
              amount: 123.97,
              taxAmount: 26.03,
              totalAmount: 150,
              status: "completed",
            },
            {
              id: 4,
              date: "2025-05-10",
              category: "Reparación",
              description: "Arreglo frenos",
              amount: 165.29,
              taxAmount: 34.71,
              totalAmount: 200,
              receipt: "https://example.com/receipt2.pdf",
              status: "completed",
            },
            {
              id: 5,
              date: "2025-05-15",
              category: "Combustible",
              description: "Repostaje semanal",
              amount: 82.64,
              taxAmount: 17.36,
              totalAmount: 100,
              status: "completed",
            },
          ]
          setExpenses(mockExpenses)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error al cargar gastos:", error)
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [dateRange, categoryFilter, statusFilter])

  const filteredExpenses = expenses.filter(
    (expense) =>
      (expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === "all" || expense.category === categoryFilter) &&
      (statusFilter === "all" || expense.status === statusFilter),
  )

  const exportToExcel = async () => {
    try {
      // Implementación real pendiente
      alert("Exportación a Excel pendiente de implementar")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewExpense((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewExpense((prev) => ({
        ...prev,
        receipt: e.target.files![0],
      }))
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulación de envío
      setTimeout(() => {
        const amount = Number.parseFloat(newExpense.amount)
        // Calculamos el importe base y el IVA (21%)
        const baseAmount = amount / 1.21
        const taxAmount = amount - baseAmount

        const newExpenseItem: Expense = {
          id: expenses.length + 1,
          date: newExpense.date,
          category: newExpense.category,
          description: newExpense.description,
          amount: baseAmount,
          taxAmount: taxAmount,
          totalAmount: amount,
          receipt: newExpense.receipt ? URL.createObjectURL(newExpense.receipt) : undefined,
          status: "completed",
        }

        setExpenses((prev) => [newExpenseItem, ...prev])
        setIsAddDialogOpen(false)
        setNewExpense({
          date: new Date().toISOString().split("T")[0],
          category: "",
          description: "",
          amount: "",
          receipt: null,
        })
        setIsSubmitting(false)
      }, 1000)
    } catch (error) {
      console.error("Error al añadir gasto:", error)
      setIsSubmitting(false)
    }
  }

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.totalAmount, 0)
  }

  const getTotalTax = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.taxAmount, 0)
  }

  const getFixedExpensesTotal = () => {
    return FIXED_EXPENSES.reduce((sum, expense) => sum + expense.amount, 0)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BackToAdminButton />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Gastos</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Gasto</DialogTitle>
              <DialogDescription>Introduce los detalles del gasto.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={newExpense.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    name="category"
                    value={newExpense.category}
                    onValueChange={(value) =>
                      handleInputChange({
                        target: { name: "category", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Combustible">Combustible</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="Reparación">Reparación</SelectItem>
                      <SelectItem value="Seguro">Seguro</SelectItem>
                      <SelectItem value="Impuestos">Impuestos</SelectItem>
                      <SelectItem value="Otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    name="description"
                    value={newExpense.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Importe Total (con IVA)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpense.amount}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">€</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">El IVA (21%) se calculará automáticamente</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receipt">Factura o Recibo (opcional)</Label>
                  <Input id="receipt" name="receipt" type="file" onChange={handleFileChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="variables">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="variables">Gastos Variables</TabsTrigger>
          <TabsTrigger value="fijos">Gastos Fijos</TabsTrigger>
        </TabsList>

        <TabsContent value="variables">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    `${getTotalAmount().toFixed(2)} €`
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">IVA Soportado (21%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    `${getTotalTax().toFixed(2)} €`
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Número de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : filteredExpenses.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descripción o categoría..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <SimpleDateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Seleccionar rango de fechas"
                />

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="Combustible">Combustible</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Reparación">Reparación</SelectItem>
                    <SelectItem value="Seguro">Seguro</SelectItem>
                    <SelectItem value="Impuestos">Impuestos</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="completed">Pagado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listado de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredExpenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Base Imponible</TableHead>
                      <TableHead>IVA (21%)</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(parseISO(expense.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.amount.toFixed(2)} €</TableCell>
                        <TableCell>{expense.taxAmount.toFixed(2)} €</TableCell>
                        <TableCell className="font-medium">{expense.totalAmount.toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              expense.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {expense.status === "completed" ? "Pagado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {expense.receipt && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={expense.receipt} target="_blank" rel="noopener noreferrer">
                                  <Receipt className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No se encontraron gastos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fijos">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gastos Fijos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Gastos Fijos Mensuales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getFixedExpensesTotal().toFixed(2)} €</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Proyección Anual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(getFixedExpensesTotal() * 12).toFixed(2)} €</div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FIXED_EXPENSES.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.name}</TableCell>
                      <TableCell>{expense.amount.toFixed(2)} €</TableCell>
                      <TableCell>{expense.frequency}</TableCell>
                      <TableCell>
                        {expense.id === "embargo" && (
                          <span>
                            Total: {expense.total} € en {expense.installments} cuotas (desde {expense.startDate})
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
