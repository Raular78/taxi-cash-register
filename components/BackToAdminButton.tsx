"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { ChevronLeft } from "lucide-react"

// Cambiamos la exportación a default para que coincida con la importación en gastos-fijos/page.tsx
export default function BackToAdminButton() {
  return (
    <Link href="/admin" className="mb-6 inline-block">
      <Button variant="outline" className="flex items-center gap-2">
        <ChevronLeft className="h-4 w-4" />
        Volver al Panel
      </Button>
    </Link>
  )
}
