"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login")
    },
  })

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin") {
        window.location.href = "/admin"
      } else if (session?.user?.role === "driver") {
        window.location.href = "/conductor"
      }
    }
  }, [session, status])

  // Página de carga mientras se verifica la sesión
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-4">Redirigiendo...</p>
      </div>
    </div>
  )
}
