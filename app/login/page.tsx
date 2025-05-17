"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Usar callbackUrl para redirigir después de la autenticación
      const result = await signIn("credentials", {
        username,
        password,
        callbackUrl: "/dashboard",
        redirect: true,
      })

      // No necesitamos manejar la redirección aquí, ya que redirect: true se encarga de ello
      if (result?.error) {
        console.error("Error de inicio de sesión:", result.error)
        toast({
          title: "Error de inicio de sesión",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error inesperado:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        <Card className="border border-gray-200 shadow-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">TCR</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Iniciar Sesión</CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-900 font-medium">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm text-gray-500">
            <p className="w-full">© {new Date().getFullYear()} Taxi Cash Register. Todos los derechos reservados.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
