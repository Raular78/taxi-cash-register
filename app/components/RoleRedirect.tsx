"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RoleRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      // Redirigir según el rol del usuario
      if (session?.user?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/conductor")
      }
    } else if (status === "unauthenticated") {
      // Si no está autenticado, redirigir a la página principal (login)
      router.push("/")
    }
  }, [status, session, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-2 text-lg text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
