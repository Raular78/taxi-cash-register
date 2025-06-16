import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 10MB)" }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `payroll-${timestamp}-${file.name}`

    // Subir a Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("PDF de nómina subido:", blob.url)

    return NextResponse.json({
      fileUrl: blob.url,
      filename: filename,
    })
  } catch (error) {
    console.error("Error al subir PDF de nómina:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}

