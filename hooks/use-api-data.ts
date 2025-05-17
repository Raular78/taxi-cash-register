"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { format } from "date-fns"
import { apiCache } from "@/lib/api-cache"

// Hook genérico para cargar datos de la API con control de estado de carga y errores
export function useApiData<T>(
  url: string | null,
  dependencies: any[] = [],
  initialData: T | null = null,
  options?: RequestInit,
  ttl = 60000, // 1 minuto por defecto
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Referencia para controlar si es el primer renderizado
  const isFirstRender = useRef(true)

  // Referencia para controlar si el componente está montado
  const isMounted = useRef(true)

  // Efecto para actualizar la referencia de montado
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Función para cargar los datos
  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Usar el sistema de caché para evitar peticiones duplicadas
      const result = await apiCache.fetch<T>(url, options, ttl)

      // Solo actualizar el estado si el componente sigue montado
      if (isMounted.current) {
        setData(result)
      }
    } catch (err) {
      console.error("Error al cargar datos:", err)

      // Solo actualizar el estado si el componente sigue montado
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      // Solo actualizar el estado si el componente sigue montado
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [url, options, ttl])

  // Efecto para cargar los datos cuando cambian las dependencias
  useEffect(() => {
    // Evitar la primera llamada en desarrollo debido a React.StrictMode
    if (process.env.NODE_ENV === "development" && isFirstRender.current) {
      isFirstRender.current = false
      setLoading(false)
      return
    }

    fetchData()
  }, [fetchData, ...dependencies])

  // Función para recargar los datos manualmente
  const refetch = useCallback(async () => {
    // Invalidar la caché para esta URL
    if (url) {
      apiCache.invalidate(url, options)
    }
    await fetchData()
  }, [fetchData, url, options])

  return { data, loading, error, refetch }
}

// Hook específico para cargar datos con filtro de fechas
export function useDateFilteredData<T>(
  baseUrl: string,
  fromDate: Date,
  toDate: Date,
  additionalParams: Record<string, string> = {},
  initialData: T | null = null,
  ttl = 60000, // 1 minuto por defecto
) {
  // Construir la URL con los parámetros
  const url = useMemo(() => {
    const fromStr = format(fromDate, "yyyy-MM-dd")
    const toStr = format(toDate, "yyyy-MM-dd")

    let finalUrl = `${baseUrl}?from=${fromStr}&to=${toStr}`

    // Añadir parámetros adicionales
    Object.entries(additionalParams).forEach(([key, value]) => {
      finalUrl += `&${key}=${encodeURIComponent(value)}`
    })

    return finalUrl
  }, [baseUrl, fromDate, toDate, additionalParams])

  // Usar el hook genérico
  return useApiData<T>(url, [url], initialData, undefined, ttl)
}
