"use client"

import { Button } from "./ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function BackToConductorButton() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/conductor">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver al panel de conductor
      </Link>
    </Button>
  )
}
