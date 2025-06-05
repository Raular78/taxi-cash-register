import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session) {
      console.error("❌ No hay sesión de usuario")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("✅ Usuario autenticado:", session.user?.email)

    // Verificar que tenemos el token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN no está configurado")
      return NextResponse.json({ error: "Token de Blob no configurado" }, { status: 500 })
    }

    console.log("✅ Token de Blob disponible")

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("❌ No se encontró archivo en la petición")
      return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 })
    }

    console.log("✅ Archivo recibido:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      console.error("❌ Tipo de archivo no válido:", file.type)
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("❌ Archivo demasiado grande:", file.size)
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 10MB)" }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `taxi-images/${timestamp}-${file.name}`

    console.log("📤 Subiendo archivo a Vercel Blob:", fileName)

    // Subir a Vercel Blob usando put()
    const blob = await put(fileName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("✅ Archivo subido exitosamente:", blob)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    })
  } catch (error) {
    console.error("❌ Error en la subida de archivos:", error)

    // Log más detallado del error
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Error al procesar la subida de archivos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
