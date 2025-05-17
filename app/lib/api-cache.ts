// Sistema de caché para peticiones a la API
type CacheEntry<T> = {
    data: T
    timestamp: number
    expiresAt: number
  }
  
  class ApiCache {
    private static instance: ApiCache
    private cache: Map<string, CacheEntry<any>> = new Map()
    private pendingRequests: Map<string, Promise<any>> = new Map()
    private readonly DEFAULT_TTL = 60 * 1000 // 1 minuto por defecto
  
    private constructor() {}
  
    public static getInstance(): ApiCache {
      if (!ApiCache.instance) {
        ApiCache.instance = new ApiCache()
      }
      return ApiCache.instance
    }
  
    // Obtener datos de la caché o hacer la petición si no están en caché o han expirado
    public async fetch<T>(url: string, options?: RequestInit, ttl: number = this.DEFAULT_TTL): Promise<T> {
      const cacheKey = this.getCacheKey(url, options)
  
      // Comprobar si hay una entrada en caché válida
      const cachedEntry = this.cache.get(cacheKey)
      if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
        console.log(`[ApiCache] Cache hit for ${url}`)
        return cachedEntry.data
      }
  
      // Comprobar si ya hay una petición en curso para esta URL
      if (this.pendingRequests.has(cacheKey)) {
        console.log(`[ApiCache] Reusing pending request for ${url}`)
        return this.pendingRequests.get(cacheKey)
      }
  
      // Hacer la petición
      console.log(`[ApiCache] Cache miss for ${url}, fetching...`)
      const fetchPromise = this.fetchAndCache<T>(url, options, ttl, cacheKey)
      this.pendingRequests.set(cacheKey, fetchPromise)
  
      try {
        return await fetchPromise
      } finally {
        // Eliminar la petición pendiente una vez completada
        this.pendingRequests.delete(cacheKey)
      }
    }
  
    // Invalidar una entrada de la caché
    public invalidate(url: string, options?: RequestInit): void {
      const cacheKey = this.getCacheKey(url, options)
      this.cache.delete(cacheKey)
    }
  
    // Invalidar todas las entradas de la caché
    public invalidateAll(): void {
      this.cache.clear()
    }
  
    // Obtener una clave única para la caché basada en la URL y las opciones
    private getCacheKey(url: string, options?: RequestInit): string {
      if (!options) return url
  
      // Crear una clave que incluya el método y el cuerpo de la petición
      const method = options.method || "GET"
      const body = options.body ? JSON.stringify(options.body) : ""
      return `${method}:${url}:${body}`
    }
  
    // Hacer la petición y guardar el resultado en caché
    private async fetchAndCache<T>(url: string, options?: RequestInit, ttl: number, cacheKey: string): Promise<T> {
      try {
        const response = await fetch(url, options)
  
        if (!response.ok) {
          throw new Error(`Error en la petición: ${response.status} ${response.statusText}`)
        }
  
        const data = await response.json()
  
        // Guardar en caché
        const now = Date.now()
        this.cache.set(cacheKey, {
          data,
          timestamp: now,
          expiresAt: now + ttl,
        })
  
        return data
      } catch (error) {
        console.error(`[ApiCache] Error fetching ${url}:`, error)
        throw error
      }
    }
  }
  
  // Exportar una instancia singleton
  export const apiCache = ApiCache.getInstance()
  