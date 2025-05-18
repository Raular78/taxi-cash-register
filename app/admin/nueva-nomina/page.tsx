"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Calendar } from "../../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, Save } from 'lucide-react'
import { toast } from "../../../components/ui/use-toast"

interface Driver {
  id: number
  username: string
  email: string
}

export default function NuevaNomina() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    userId: "",
    periodStart: new Date(),
    periodEnd: new Date(),
    baseSalary: "0",
    commissions: "0",
    bonuses: "0",
    deductions: "0",
    taxWithholding: "0",
    notes: "",
  })

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch("/api/users?role=driver")
        if (!response.ok) {
          throw new Error("Error al cargar conductores")
        }
        const data = await response.json()
        setDrivers(data)
      } catch (error) {
        console.error("Error fetching drivers:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los conductores",
          variant: "destructive",
        })
      }
    }

    fetchDrivers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [name]: date }))
    }
  }

  const calculateNetAmount = () => {
    const baseSalary = parseFloat(formData.baseSalary) || 0
    const commissions = parseFloat(formData.commissions) || 0
    const bonuses = parseFloat(formData.bonuses) || 0
    const deductions = parseFloat(formData.deductions) || 0
    const taxWithholding = parseFloat(formData.taxWithholding) || 0

    return baseSalary + commissions + bonuses - deductions - taxWithholding
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un conductor",
        variant: "destructive",
      })
      return
    }

    if (formData.periodEnd < formData.periodStart) {
      toast({
        title: "Error",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const netAmount = calculateNetAmount()

      const response = await fetch("/api/payrolls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId: parseInt(formData.userId),
          baseSalary: parseFloat(formData.baseSalary),
          commissions: parseFloat(formData.commissions),
          bonuses: parseFloat(formData.bonuses),
          deductions: parseFloat(formData.deductions),
          taxWithholding: parseFloat(formData.taxWithholding),
          netAmount,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear la nómina")
      }

      toast({
        title: "Nómina creada",
        description: "La nómina se ha creado correctamente",
      })

      router.push("/admin/nominas")
    } catch (error) {
      console.error("Error creating payroll:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la nómina",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/nominas")} className="mr-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Nueva Nómina</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Nómina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="userId">Conductor</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => handleSelectChange("userId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Período</Label>
                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white text-black"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.periodStart ? (
                            format(formData.periodStart, "dd/MM/yyyy", { locale: es })
                          ) : (
                            <span>Fecha inicio</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white text-black" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.periodStart}
                          onSelect={(date) => handleDateChange("periodStart", date)}
                          initialFocus
                          className="bg-white text-black"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-1/2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white text-black"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.periodEnd ? (
                            format(formData.periodEnd, "dd/MM/yyyy", { locale: es })
                          ) : (
                            <span>Fecha fin</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white text-black" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.periodEnd}
                          onSelect={(date) => handleDateChange("periodEnd", date)}
                          initialFocus
                          className="bg-white text-black"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Salario Base (€)</Label>
                <Input
                  id="baseSalary"
                  name="baseSalary"
                  type="number"
                  step="0.01"
                  value={formData.baseSalary}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissions">Comisiones (€)</Label>
                <Input
                  id="commissions"
                  name="commissions"
                  type="number"
                  step="0.01"
                  value={formData.commissions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonuses">Bonificaciones (€)</Label>
                <Input
                  id="bonuses"
                  name="bonuses"
                  type="number"
                  step="0.01"
                  value={formData.bonuses}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductions">Deducciones (€)</Label>
                <Input
                  id="deductions"
                  name="deductions"
                  type="number"
                  step="0.01"
                  value={formData.deductions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxWithholding">Retención IRPF (€)</Label>
                <Input
                  id="taxWithholding"
                  name="taxWithholding"
                  type="number"
                  step="0.01"
                  value={formData.taxWithholding}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Importe Neto (€)</Label>
                <Input
                  value={calculateNetAmount().toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full min-h-[100px] p-2 border rounded-md"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Nómina
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
