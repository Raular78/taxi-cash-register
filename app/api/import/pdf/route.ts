import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import prisma from "@/app/lib/db"
import * as pdfParse from "pdf-parse"

// Función para extraer datos del PDF
async function extractDataFromPDF(buffer: Buffer) {
  try {
    const data = await pdfParse(buffer)
    const text = data.text

    // Dividir el texto en líneas
    const lines = text.split("\n").filter((line) => line.trim() !== "")

    // Buscar patrones en el texto para extraer datos
    // Esto dependerá de la estructura exacta de tus PDFs
    // Aquí hay un ejemplo simplificado:

    const records = []
    let currentRecord: any = {}
    let isDataSection = false

    for (const line of lines) {
      // Detectar el inicio de la sección de datos
      if (line.includes("FECHA") && line.includes("KM")) {
        isDataSection = true
        continue
      }

      // Si estamos en la sección de datos, intentar extraer información
      if (isDataSection) {
        // Ejemplo de patrón: fecha seguida de números
        const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/)
        const kmMatch = line.match(/(\d+)\s*km/i)
        const amountMatch = line.match(/(\d+[.,]\d+)\s*€/i)

        if (dateMatch && kmMatch) {
          // Si encontramos una nueva fecha y km, guardamos el registro anterior y empezamos uno nuevo
          if (Object.keys(currentRecord).length > 0) {
            records.push(currentRecord)
          }

          currentRecord = {
            date: dateMatch[1],
            totalKm: Number.parseInt(kmMatch[1]),
            // Otros campos con valores predeterminados
            startKm: 0,
            endKm: 0,
            cashAmount: 0,
            cardAmount: 0,
            invoiceAmount: 0,
            otherAmount: 0,
            totalAmount: 0,
            fuelExpense: 0,
            otherExpenses: 0,
            driverCommission: 0,
            netAmount: 0,
          }
        }

        // Buscar importes
        if (amountMatch && currentRecord.date) {
          const amount = Number.parseFloat(amountMatch[1].replace(",", "."))

          // Asignar el importe a algún campo según el contexto
          // Esto es un ejemplo y necesitará adaptarse a tu PDF específico
          if (line.toLowerCase().includes("efectivo")) {
            currentRecord.cashAmount = amount
          } else if (line.toLowerCase().includes("tarjeta")) {
            currentRecord.cardAmount = amount
          } else if (line.toLowerCase().includes("factura")) {
            currentRecord.invoiceAmount = amount
          } else if (line.toLowerCase().includes("gasto") || line.toLowerCase().includes("gasolina")) {
            currentRecord.fuelExpense = amount
          }

          // Actualizar el total
          currentRecord.totalAmount =
            currentRecord.cashAmount +
            currentRecord.cardAmount +
            currentRecord.invoiceAmount +
            currentRecord.otherAmount

          // Calcular comisión y neto (ejemplo)
          const totalExpenses = currentRecord.fuelExpense + currentRecord.otherExpenses
          currentRecord.driverCommission = (currentRecord.totalAmount - totalExpenses) * 0.35
          currentRecord.netAmount = currentRecord.totalAmount - totalExpenses - currentRecord.driverCommission
        }
      }
    }

    // Añadir el último registro si existe
    if (Object.keys(currentRecord).length > 0) {
      records.push(currentRecord)
    }

    return records
  } catch (error) {
    console.error("Error al analizar PDF:", error)
    throw new Error("No se pudo analizar el PDF")
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el FormData con el archivo
    const formData = await request.formData()
    const file = formData.get("file") as File
    const driverId = formData.get("driverId") as string

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    if (!driverId) {
      return NextResponse.json({ error: "No se proporcionó ID del conductor" }, { status: 400 })
    }

    // Convertir el archivo a Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Extraer datos del PDF
    const records = await extractDataFromPDF(buffer)

    // Guardar los registros en la base de datos
    const savedRecords = []
    for (const record of records) {
      const savedRecord = await prisma.dailyRecord.create({
        data: {
          date: new Date(record.date.split("/").reverse().join("-")), // Convertir DD/MM/YYYY a YYYY-MM-DD
          startKm: record.startKm,
          endKm: record.endKm,
          totalKm: record.totalKm,
          cashAmount: record.cashAmount,
          cardAmount: record.cardAmount,
          invoiceAmount: record.invoiceAmount,
          otherAmount: record.otherAmount,
          totalAmount: record.totalAmount,
          fuelExpense: record.fuelExpense,
          otherExpenses: record.otherExpenses,
          driverCommission: record.driverCommission,
          netAmount: record.netAmount,
          driverId: Number.parseInt(driverId),
        },
      })
      savedRecords.push(savedRecord)
    }

    return NextResponse.json({
      success: true,
      message: `Se importaron ${savedRecords.length} registros correctamente`,
      records: savedRecords,
    })
  } catch (error) {
    console.error("Error al importar PDF:", error)
    return NextResponse.json({ error: "Error al importar PDF" }, { status: 500 })
  }
}
