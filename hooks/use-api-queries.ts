import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

// Interfaces
interface DateRange {
  from: Date
  to: Date
}

interface QueryOptions {
  enabled?: boolean
}

// Función para formatear fechas para las consultas
const formatDateForQuery = (date: Date) => {
  return format(date, "yyyy-MM-dd")
}

// Hook para obtener registros diarios
export function useDailyRecords(dateRange: DateRange, options?: QueryOptions) {
  const from = formatDateForQuery(dateRange.from)
  const to = formatDateForQuery(dateRange.to)

  return useQuery({
    queryKey: ["dailyRecords", from, to],
    queryFn: async () => {
      console.log(`Consultando registros diarios desde ${from} hasta ${to}`)
      const response = await fetch(`/api/daily-records?from=${from}&to=${to}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta de daily-records:", errorText)
        throw new Error("Error al cargar registros diarios")
      }

      const data = await response.json()
      console.log(`Registros diarios obtenidos: ${data.length}`)
      return data
    },
    enabled: options?.enabled !== false,
  })
}

// Hook para obtener gastos
export function useExpenses(dateRange: DateRange, options?: QueryOptions) {
  const from = formatDateForQuery(dateRange.from)
  const to = formatDateForQuery(dateRange.to)

  return useQuery({
    queryKey: ["expenses", from, to],
    queryFn: async () => {
      console.log(`Consultando gastos desde ${from} hasta ${to}`)
      const response = await fetch(`/api/expenses?from=${from}&to=${to}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta de expenses:", errorText)
        throw new Error("Error al cargar gastos")
      }

      const data = await response.json()
      console.log(`Gastos obtenidos: ${data.length}`)
      return data
    },
    enabled: options?.enabled !== false,
  })
}

// Hook para obtener nóminas
export function usePayrolls(dateRange: DateRange, options?: QueryOptions) {
  const from = formatDateForQuery(dateRange.from)
  const to = formatDateForQuery(dateRange.to)

  return useQuery({
    queryKey: ["payrolls", from, to],
    queryFn: async () => {
      console.log(`Consultando nóminas desde ${from} hasta ${to}`)
      const response = await fetch(`/api/payrolls?from=${from}&to=${to}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta de payrolls:", errorText)
        throw new Error("Error al cargar nóminas")
      }

      const data = await response.json()
      console.log(`Nóminas obtenidas: ${data.length}`)
      return data
    },
    enabled: options?.enabled !== false,
  })
}

// Hook para obtener conductores
export function useDrivers(options?: QueryOptions) {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const response = await fetch("/api/drivers")

      if (!response.ok) {
        throw new Error("Error al cargar conductores")
      }

      return response.json()
    },
    enabled: options?.enabled !== false,
  })
}

// Hook para obtener registros individuales
export function useRecords(dateRange: DateRange, options?: QueryOptions) {
  return useQuery({
    queryKey: ["records", dateRange.from, dateRange.to],
    queryFn: async () => {
      const from = formatDateForQuery(dateRange.from)
      const to = formatDateForQuery(dateRange.to)
      const response = await fetch(`/api/records?from=${from}&to=${to}`)

      if (!response.ok) {
        throw new Error("Error al cargar registros")
      }

      return response.json()
    },
    enabled: options?.enabled !== false,
  })
}

// Hook para obtener gastos fijos
export function useFixedExpenses(options?: QueryOptions) {
  return useQuery({
    queryKey: ["fixedExpenses"],
    queryFn: async () => {
      console.log("Consultando gastos fijos")
      const response = await fetch("/api/fixed-expenses")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta de fixed-expenses:", errorText)
        throw new Error("Error al cargar gastos fijos")
      }

      const data = await response.json()
      console.log(`Gastos fijos obtenidos: ${data.length}`)
      return data
    },
    enabled: options?.enabled !== false,
  })
}
