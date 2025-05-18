"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { AlertCircle, Database, RefreshCw } from "lucide-react"
import { toast } from "./ui/use-toast"

export function DatabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected" | "mock_mode">("checking")
  const [isLoading, setIsLoading] = useState(false)

  // Verificar el estado al cargar el componente
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database-status")
      const data = await response.json()
      setStatus(data.status)
      toast({
        title: "Estado de la base de datos",
        description: data.message,
      })
    } catch (error) {
      console.error("Error al verificar el estado de la base de datos:", error)
      setStatus("disconnected")
      toast({
        title: "Error",
        description: "No se pudo verificar el estado de la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Estado de la Base de Datos
        </CardTitle>
        <CardDescription>Información sobre la conexión con la base de datos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              status === "connected" ? "bg-green-500" : status === "mock_mode" ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
          <span>
            {status === "checking"
              ? "Verificando..."
              : status === "connected"
                ? "Conectado a la base de datos"
                : status === "mock_mode"
                  ? "Usando datos simulados"
                  : "Desconectado"}
          </span>
        </div>

        {status === "mock_mode" && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              <p>
                Estás usando datos simulados. Los cambios se guardarán en memoria durante la sesión actual, pero no
                persistirán al reiniciar la aplicación.
              </p>
            </div>
          </div>
        )}

        {status === "disconnected" && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              <p>
                No se puede conectar a la base de datos. Verifica que la base de datos esté activa y que las
                credenciales sean correctas.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={checkStatus} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Verificar estado
        </Button>
      </CardFooter>
    </Card>
  )
}

