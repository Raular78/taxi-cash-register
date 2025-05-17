"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function ConnectionTest() {
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

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl md:text-2xl font-semibold mb-4">Prueba de Conexión a la Base de Datos</h2>

      <div className="flex flex-col space-y-4">
        <Button onClick={testConnection} disabled={status === "loading"} className="w-full sm:w-auto">
          {status === "loading" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Probando conexión...
            </>
          ) : (
            "Probar Conexión"
          )}
        </Button>

        {status !== "idle" && (
          <div
            className={`p-4 rounded-md ${
              status === "success"
                ? "bg-green-900/30 border border-green-700"
                : status === "error"
                  ? "bg-red-900/30 border border-red-700"
                  : "bg-gray-700/30"
            }`}
          >
            <div className="flex items-center">
              {status === "success" && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
              {status === "error" && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
              <p className="font-medium">{message}</p>
            </div>

            {details && (
              <div className="mt-2 text-sm">
                {status === "success" && <p>Número de usuarios: {details.usersCount}</p>}
                {status === "error" && details.error && <p className="text-red-400">{details.error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
