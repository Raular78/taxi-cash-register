import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Expense {
  id: number
  date: string
  category: string
  description: string
  amount: number
  status: string
  userId?: number
  user?: {
    id: number
    username: string
  }
}

interface GastosTabProps {
  expenses: Expense[]
  startDate: Date
  endDate: Date
}

// Función para formatear moneda
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

export default function GastosTab({ expenses, startDate, endDate }: GastosTabProps) {
  // Agrupar gastos por categoría
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      const category = expense.category
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  // Calcular totales
  const combustibleTotal = expenses
    .filter((expense) => expense.category === "Combustible")
    .reduce((sum, expense) => sum + expense.amount, 0)

  const otrosGastosTotal = expenses
    .filter((expense) => expense.category !== "Combustible")
    .reduce((sum, expense) => sum + expense.amount, 0)

  const totalGastos = combustibleTotal + otrosGastosTotal

  // Agrupar gastos por fecha y conductor
  const expensesByDateAndDriver = expenses.reduce(
    (acc, expense) => {
      const date = new Date(expense.date).toLocaleDateString("es-ES")
      const driverId = expense.userId || 0
      const driverName = expense.user?.username || "Desconocido"

      const key = `${date}-${driverId}`

      if (!acc[key]) {
        acc[key] = {
          date,
          driverId,
          driverName,
          combustible: 0,
          otrosGastos: 0,
        }
      }

      if (expense.category === "Combustible") {
        acc[key].combustible += expense.amount
      } else {
        acc[key].otrosGastos += expense.amount
      }

      return acc
    },
    {} as Record<
      string,
      { date: string; driverId: number; driverName: string; combustible: number; otrosGastos: number }
    >,
  )

  // Convertir a array y ordenar por fecha (más reciente primero)
  const expenseRows = Object.values(expensesByDateAndDriver).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  console.log("Gastos procesados para mostrar:", expenses.length, "gastos")
  console.log("Filas de gastos a mostrar:", expenseRows.length)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Combustible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(combustibleTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Otros Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(otrosGastosTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalGastos)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Combustible</TableHead>
                <TableHead>Otros Gastos</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseRows.length > 0 ? (
                expenseRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.driverName}</TableCell>
                    <TableCell>{formatCurrency(row.combustible)}</TableCell>
                    <TableCell>{formatCurrency(row.otrosGastos)}</TableCell>
                    <TableCell>{formatCurrency(row.combustible + row.otrosGastos)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No hay gastos registrados en este período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(expensesByCategory).map(([category, amount], index) => (
                  <TableRow key={index}>
                    <TableCell>{category}</TableCell>
                    <TableCell>{formatCurrency(amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
