import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css" // Corregir la ruta para apuntar a app/globals.css
import { Providers } from "../providers" // Asegurarnos de que la ruta a providers también es correcta

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Taxi Cash Register - Admin",
  description: "Panel de administración para gestionar los ingresos y gastos de un taxi",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
