import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/api/auth"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Si la ruta es pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Si no hay token y no es una ruta pública, redirigir al login
  if (!token) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // Si hay token, verificar roles para rutas protegidas
  const role = token.role as string

  // Rutas de administrador
  if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
    // Si no es admin, redirigir a la página principal
    const url = new URL("/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  // Rutas de conductor
  if (request.nextUrl.pathname.startsWith("/conductor") && role !== "driver") {
    // Si no es conductor, redirigir a la página principal
    const url = new URL("/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
