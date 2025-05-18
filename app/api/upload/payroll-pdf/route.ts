import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/options"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Procesar el archivo
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 })
    }

    // Verificar que el archivo sea un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 })
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), "public", "uploads", "payrolls")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.error("Error al crear directorio:", error)
    }

    // Generar nombre de archivo único
    const timestamp = Date.now()
    const fileName = `nomina_${timestamp}_${file.name.replace(/\s+/g, "_")}`
    const filePath = path.join(uploadDir, fileName)

    // Guardar archivo
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Generar URL relativa
    const fileUrl = `/uploads/payrolls/${fileName}`

    return NextResponse.json({ fileUrl })
  } catch (error) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}

