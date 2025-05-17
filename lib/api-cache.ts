/**
 * Sistema de caché simple para peticiones a la API
 */
class ApiCache {
    private cache: Map<string, { data: any; timestamp: number }> = new Map()
    private pendingRequests: Map<string, Promise<any>> = new Map()
  
    /**
     * Obtiene datos de la API, utilizando la caché si está disponible
     */
    async fetch<T>(url: string, options?: RequestInit, ttl = 60000): Promise<T> {
      const cacheKey = this.getCacheKey(url, options)
  
      // Comprobar si hay una petición en curso para esta URL
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey) as Promise<T>
      }
  
      // Comprobar si hay datos en caché y si son válidos
      const cachedData = this.cache.get(cacheKey)
      if (cachedData && Date.now() - cachedData.timestamp < ttl) {
        return cachedData.data as T
      }
  
      // Si no hay datos en caché o han expirado, hacer la petición
      const fetchPromise = this.fetchData<T>(url, options, cacheKey)
      this.pendingRequests.set(cacheKey, fetchPromise)
  
      try {
        return await fetchPromise
      } finally {
        // Eliminar la petición pendiente una vez completada
        this.pendingRequests.delete(cacheKey)
      }
    }
  
    /**
     * Invalida la caché para una URL específica
     */
    invalidate(url: string, options?: RequestInit): void {
      const cacheKey = this.getCacheKey(url, options)
      this.cache.delete(cacheKey)
    }
  
    /**
     * Invalida toda la caché
     */
    invalidateAll(): void {
      this.cache.clear()
    }
  
    /**
     * Obtiene la clave de caché para una URL y opciones
     */
    private getCacheKey(url: string, options?: RequestInit): string {
      if (!options) return url
      return `${url}:${JSON.stringify(options)}`
    }
  
    /**
     * Hace la petición a la API y almacena el resultado en caché
     */
    private async fetchData<T>(url: string, options?: RequestInit, cacheKey?: string): Promise<T> {
      const response = await fetch(url, options)
  
      if (!response.ok) {
        throw new Error(`Error al cargar datos: ${response.status}`)
      }
  
      const data = await response.json()
  
      // Almacenar en caché
      if (cacheKey) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() })
      }
  
      return data as T
    }
  }
  
  // Exportar una instancia singleton
  export const apiCache = new ApiCache()
  