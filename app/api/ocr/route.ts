import { NextResponse } from "next/server"
import { createWorker } from "tesseract.js"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File | null

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convertir la imagen a un buffer
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Inicializar Tesseract worker
    const worker = await createWorker("spa")

    // Reconocer texto en la imagen
    const { data } = await worker.recognize(buffer)

    // Liberar recursos
    await worker.terminate()

    // Buscar marcas de "V" o "v" en el texto
    const lines = data.text.split("\n")
    const visaLines = lines.filter(
      (line) => line.includes("V") || line.includes("v") || line.toLowerCase().includes("visa"),
    )

    // Extraer posibles cantidades numéricas cerca de las marcas "V"
    const amounts = []
    const amountRegex = /\d+[.,]?\d*/g

    for (const line of visaLines) {
      const matches = line.match(amountRegex)
      if (matches) {
        amounts.push(...matches)
      }
    }

    return NextResponse.json({
      text: data.text,
      visaLines,
      amounts,
      confidence: data.confidence,
    })
  } catch (error) {
    console.error("OCR error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error during OCR processing" },
      { status: 500 },
    )
  }
}
