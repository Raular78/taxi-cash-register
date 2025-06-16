"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Download, Eye, Calendar, Euro } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "../../../components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"

interface Payroll {
  id: number
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
}

export default function ConductorNominas() {
  const { data: session } = useSession()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (session) {
      fetchPayrolls()
    }
  }, [session])

  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payrolls?userId=${session?.user?.id}`)

      if (!response.ok) {
        throw new Error("Error al obtener nóminas")
      }

      const data = await response.json()
      setPayrolls(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las nóminas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es })
  }

  const viewPayrollDetails = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setIsDialogOpen(true)
  }

  const downloadPDF = (pdfUrl: string, periodStart: string) => {
    if (pdfUrl) {
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `nomina-${formatDate(periodStart)}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mis Nóminas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Nóminas</h1>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Euro className="h-5 w-5" />
          <span>Historial de pagos</span>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nóminas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nóminas Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payrolls.filter((p) => p.status === "paid").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Último Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrolls.length > 0 ? formatCurrency(payrolls.find((p) => p.status === "paid")?.netAmount || 0) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Nóminas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Nóminas</CardTitle>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">No tienes nóminas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Salario Base</TableHead>
                    <TableHead>Comisiones</TableHead>
                    <TableHead>Importe Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)}
                      </TableCell>
                      <TableCell>{formatCurrency(payroll.baseSalary)}</TableCell>
                      <TableCell>{formatCurrency(payroll.commissions)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payroll.netAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={payroll.status === "paid" ? "default" : "secondary"}>
                          {payroll.status === "paid" ? "Pagada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payroll.pdfUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadPDF(payroll.pdfUrl!, payroll.periodStart)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin PDF</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => viewPayrollDetails(payroll)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payroll.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadPDF(payroll.pdfUrl!, payroll.periodStart)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de detalles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Nómina</DialogTitle>
            <DialogDescription>
              {selectedPayroll &&
                `Período: ${formatDate(selectedPayroll.periodStart)} - ${formatDate(selectedPayroll.periodEnd)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPayroll && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Ingresos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Salario Base:</span>
                      <span>{formatCurrency(selectedPayroll.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Comisiones:</span>
                      <span>{formatCurrency(selectedPayroll.commissions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bonificaciones:</span>
                      <span>{formatCurrency(selectedPayroll.bonuses)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Total Bruto:</span>
                      <span>
                        {formatCurrency(
                          selectedPayroll.baseSalary + selectedPayroll.commissions + selectedPayroll.bonuses,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Deducciones</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Deducciones:</span>
                      <span>{formatCurrency(selectedPayroll.deductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Retención Fiscal:</span>
                      <span>{formatCurrency(selectedPayroll.taxWithholding)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Importe Neto:</span>
                      <span>{formatCurrency(selectedPayroll.netAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Información Adicional</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant={selectedPayroll.status === "paid" ? "default" : "secondary"}>
                      {selectedPayroll.status === "paid" ? "Pagada" : "Pendiente"}
                    </Badge>
                  </div>
                  {selectedPayroll.paymentDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fecha de Pago:</span>
                      <span>{formatDate(selectedPayroll.paymentDate)}</span>
                    </div>
                  )}
                  {selectedPayroll.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Notas:</span>
                      <p className="text-sm mt-1">{selectedPayroll.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPayroll.pdfUrl && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => downloadPDF(selectedPayroll.pdfUrl!, selectedPayroll.periodStart)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF de Nómina
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
