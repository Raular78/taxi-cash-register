"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"

export default function DatabaseStatus() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)

  const testConnection = async () => {
    setStatus("loading")
    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message)
        setDetails(data)
      } else {
        setStatus("error")
        setMessage(data.message)
        setDetails(data)
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error al probar la conexión")
      setDetails({ error: error instanceof Error ? error.message : "Error desconocido" })
    }
  }

  // Probar la conexión automáticamente al cargar el componente
  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Estado de la Base de Datos
        </h2>
        <Button onClick={testConnection} disabled={status === "loading"} size="sm" variant="outline">
          {status === "loading" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Conexión"
          )}
        </Button>
      </div>

      <div
        className={`p-4 rounded-md ${
          status === "success"
            ? "bg-green-900/30 border border-green-700"
            : status === "error"
              ? "bg-red-900/30 border border-red-700"
              : "bg-gray-700/30 border border-gray-600"
        }`}
      >
        <div className="flex items-center">
          {status === "success" && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
          {status === "error" && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
          {status === "loading" && <RefreshCw className="h-5 w-5 animate-spin mr-2" />}
          {status === "idle" && <Database className="h-5 w-5 mr-2" />}
          <p className="font-medium">
            {status === "idle"
              ? "Verificando conexión a la base de datos..."
              : status === "loading"
                ? "Verificando conexión a la base de datos..."
                : message}
          </p>
        </div>

        {details && (
          <div className="mt-2 text-sm">
            {status === "success" && <p>Número de usuarios: {details.usersCount}</p>}
            {status === "error" && details.error && <p className="text-red-400">{details.error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
