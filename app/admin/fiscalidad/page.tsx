"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import { Loader2, Download, FileText, Plus, Calculator } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import BackToAdminButton from "../../../components/BackToAdminButton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

interface TaxPeriod {
  id: number
  year: number
  quarter: number
  startDate: Date
  endDate: Date
  status: string
  totalKilometers: number
  totalIncome: number
  totalExpenses: number
  taxAmount: number
  ivaEmitido: number
  ivaSoportado: number
  ivaResult: number
}

export default function AdminFiscalidad() {
  const [taxPeriods, setTaxPeriods] = useState<TaxPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddKmDialogOpen, setIsAddKmDialogOpen] = useState(false)
  const [newKilometers, setNewKilometers] = useState({
    year: new Date().getFullYear().toString(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3).toString(),
    kilometers: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Simular carga de datos
  useEffect(() => {
    const fetchTaxPeriods = async () => {
      setIsLoading(true)
      try {
        // Simulación de datos
        setTimeout(() => {
          const currentYear = new Date().getFullYear()
          const mockTaxPeriods: TaxPeriod[] = [
            {
              id: 1,
              year: currentYear,
              quarter: 1,
              startDate: new Date(currentYear, 0, 1),
              endDate: new Date(currentYear, 2, 31),
              status: "completed",
              totalKilometers: 12500,
              totalIncome: 8500,
              totalExpenses: 2200,
              taxAmount: 1250,
              ivaEmitido: 850, // 10% de IVA emitido
              ivaSoportado: 462, // 21% de IVA soportado
              ivaResult: 388,
            },
            {
              id: 2,
              year: currentYear,
              quarter: 2,
              startDate: new Date(currentYear, 3, 1),
              endDate: new Date(currentYear, 5, 30),
              status: "pending",
              totalKilometers: 13200,
              totalIncome: 9100,
              totalExpenses: 2350,
              taxAmount: 1320,
              ivaEmitido: 910, // 10% de IVA emitido
              ivaSoportado: 493.5, // 21% de IVA soportado
              ivaResult: 416.5,
            },
            {
              id: 3,
              year: currentYear - 1,
              quarter: 4,
              startDate: new Date(currentYear - 1, 9, 1),
              endDate: new Date(currentYear - 1, 11, 31),
              status: "completed",
              totalKilometers: 11800,
              totalIncome: 8200,
              totalExpenses: 2100,
              taxAmount: 1180,
              ivaEmitido: 820, // 10% de IVA emitido
              ivaSoportado: 441, // 21% de IVA soportado
              ivaResult: 379,
            },
          ]
          setTaxPeriods(mockTaxPeriods)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error al cargar periodos fiscales:", error)
        setIsLoading(false)
      }
    }

    fetchTaxPeriods()
  }, [])

  const filteredTaxPeriods = taxPeriods.filter(
    (period) =>
      (yearFilter === "all" || period.year.toString() === yearFilter) &&
      (statusFilter === "all" || period.status === statusFilter),
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
    setNewKilometers((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddKilometers = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulación de envío
      setTimeout(() => {
        const year = Number.parseInt(newKilometers.year)
        const quarter = Number.parseInt(newKilometers.quarter)
        const kilometers = Number.parseInt(newKilometers.kilometers)

        // Buscar si ya existe el periodo
        const existingPeriodIndex = taxPeriods.findIndex((period) => period.year === year && period.quarter === quarter)

        if (existingPeriodIndex >= 0) {
          // Actualizar periodo existente
          const updatedPeriods = [...taxPeriods]
          updatedPeriods[existingPeriodIndex] = {
            ...updatedPeriods[existingPeriodIndex],
            totalKilometers: kilometers,
            // Recalcular impuestos basados en kilómetros
            taxAmount: Math.round(kilometers * 0.1), // Ejemplo simplificado
          }
          setTaxPeriods(updatedPeriods)
        } else {
          // Crear nuevo periodo
          const startMonth = (quarter - 1) * 3
          const endMonth = startMonth + 2
          const newPeriod: TaxPeriod = {
            id: taxPeriods.length + 1,
            year,
            quarter,
            startDate: new Date(year, startMonth, 1),
            endDate: new Date(year, endMonth + 1, 0),
            status: "pending",
            totalKilometers: kilometers,
            totalIncome: Math.round(kilometers * 0.7), // Estimación de ingresos
            totalExpenses: Math.round(kilometers * 0.2), // Estimación de gastos
            taxAmount: Math.round(kilometers * 0.1), // Estimación de impuestos
            ivaEmitido: Math.round(kilometers * 0.7 * 0.1), // 10% de IVA sobre ingresos
            ivaSoportado: Math.round(kilometers * 0.2 * 0.21), // 21% de IVA sobre gastos
            ivaResult: Math.round(kilometers * 0.7 * 0.1 - kilometers * 0.2 * 0.21),
          }
          setTaxPeriods((prev) => [...prev, newPeriod])
        }

        setIsAddKmDialogOpen(false)
        setNewKilometers({
          year: new Date().getFullYear().toString(),
          quarter: Math.ceil((new Date().getMonth() + 1) / 3).toString(),
          kilometers: "",
        })
        setIsSubmitting(false)
      }, 1000)
    } catch (error) {
      console.error("Error al añadir kilómetros:", error)
      setIsSubmitting(false)
    }
  }

  const getQuarterName = (quarter: number) => {
    const quarters = ["Primer trimestre", "Segundo trimestre", "Tercer trimestre", "Cuarto trimestre"]
    return quarters[quarter - 1]
  }

  const getTotalTaxAmount = () => {
    return filteredTaxPeriods.reduce((sum, period) => sum + period.taxAmount, 0)
  }

  const getTotalIvaEmitido = () => {
    return filteredTaxPeriods.reduce((sum, period) => sum + period.ivaEmitido, 0)
  }

  const getTotalIvaSoportado = () => {
    return filteredTaxPeriods.reduce((sum, period) => sum + period.ivaSoportado, 0)
  }

  const getTotalIvaResult = () => {
    return filteredTaxPeriods.reduce((sum, period) => sum + period.ivaResult, 0)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BackToAdminButton />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fiscalidad</h1>
        <Dialog open={isAddKmDialogOpen} onOpenChange={setIsAddKmDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Kilómetros
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Kilómetros</DialogTitle>
              <DialogDescription>
                Introduce los kilómetros recorridos para el cálculo de impuestos por módulos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddKilometers}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Año</Label>
                  <Select
                    name="year"
                    value={newKilometers.year}
                    onValueChange={(value) =>
                      handleInputChange({
                        target: { name: "year", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 3 }, (_, i) => {
                        const year = new Date().getFullYear() - 1 + i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quarter">Trimestre</Label>
                  <Select
                    name="quarter"
                    value={newKilometers.quarter}
                    onValueChange={(value) =>
                      handleInputChange({
                        target: { name: "quarter", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trimestre" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 4 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {getQuarterName(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kilometers">Kilómetros Recorridos</Label>
                  <div className="relative">
                    <Input
                      id="kilometers"
                      name="kilometers"
                      type="number"
                      min="0"
                      value={newKilometers.kilometers}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">km</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddKmDialogOpen(false)}>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Régimen Fiscal por Módulos</CardTitle>
          <CardDescription>
            El régimen de módulos para taxis se basa principalmente en los kilómetros recorridos. El IVA emitido es del
            10% (transporte público) y el IVA soportado es del 21% para la mayoría de los gastos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Impuestos Estimados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    `${getTotalTaxAmount().toFixed(2)} €`
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">IVA Emitido (10%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    `${getTotalIvaEmitido().toFixed(2)} €`
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
                    `${getTotalIvaSoportado().toFixed(2)} €`
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resultado IVA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    `${getTotalIvaResult().toFixed(2)} €`
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {Array.from(new Set(taxPeriods.map((period) => period.year))).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Presentado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end">
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="periodos">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="periodos">Periodos Fiscales</TabsTrigger>
          <TabsTrigger value="calculadora">Calculadora de Módulos</TabsTrigger>
        </TabsList>

        <TabsContent value="periodos">
          <Card>
            <CardHeader>
              <CardTitle>Periodos Fiscales</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTaxPeriods.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Kilómetros</TableHead>
                      <TableHead>Ingresos</TableHead>
                      <TableHead>Gastos</TableHead>
                      <TableHead>IVA Emitido (10%)</TableHead>
                      <TableHead>IVA Soportado (21%)</TableHead>
                      <TableHead>Resultado IVA</TableHead>
                      <TableHead>Impuestos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaxPeriods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell>
                          {period.year} - {getQuarterName(period.quarter)}
                          <div className="text-xs text-muted-foreground">
                            {format(period.startDate, "dd/MM/yyyy", { locale: es })} -{" "}
                            {format(period.endDate, "dd/MM/yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>{period.totalKilometers.toLocaleString()} km</TableCell>
                        <TableCell>{period.totalIncome.toFixed(2)} €</TableCell>
                        <TableCell>{period.totalExpenses.toFixed(2)} €</TableCell>
                        <TableCell>{period.ivaEmitido.toFixed(2)} €</TableCell>
                        <TableCell>{period.ivaSoportado.toFixed(2)} €</TableCell>
                        <TableCell className="font-medium">{period.ivaResult.toFixed(2)} €</TableCell>
                        <TableCell className="font-medium">{period.taxAmount.toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              period.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {period.status === "completed" ? "Presentado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
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
                <p className="text-center text-muted-foreground py-4">No se encontraron periodos fiscales</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculadora">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Impuestos por Módulos</CardTitle>
              <CardDescription>
                Calcula los impuestos estimados basados en los kilómetros recorridos según el régimen de módulos para
                taxis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calc-kilometers">Kilómetros Recorridos</Label>
                      <div className="relative mt-1">
                        <Input id="calc-kilometers" type="number" min="0" placeholder="0" />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">km</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="calc-income">Ingresos Estimados</Label>
                      <div className="relative mt-1">
                        <Input id="calc-income" type="number" min="0" placeholder="0" />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">€</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="calc-expenses">Gastos Estimados</Label>
                      <div className="relative mt-1">
                        <Input id="calc-expenses" type="number" min="0" placeholder="0" />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">€</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Resultados Estimados</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA Emitido (10%):</span>
                      <span className="font-medium">0.00 €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA Soportado (21%):</span>
                      <span className="font-medium">0.00 €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resultado IVA:</span>
                      <span className="font-medium">0.00 €</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between">
                      <span className="font-medium">Impuestos por Módulos:</span>
                      <span className="font-bold">0.00 €</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
