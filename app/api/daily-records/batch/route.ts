import { type NextRequest, NextResponse } from "next/server"
import prisma from "../../../lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/options"

export async function POST(request: NextRequest) {
  try {
    console.log("Recibida solicitud para importar registros")

    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("No hay sesión de usuario")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario autenticado:", session.user?.email)

    // En desarrollo, permitimos cualquier usuario autenticado
    // En producción, descomentar la validación de usuario y rol

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    console.log("Datos recibidos:", {
      driverId: data.driverId,
      recordsCount: data.records?.length || 0,
    })

    if (!data.driverId || !data.records || !Array.isArray(data.records) || data.records.length === 0) {
      console.log("Datos inválidos")
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Verificar que el conductor exista
    const driver = await prisma.user.findUnique({
      where: { id: data.driverId },
    })

    if (!driver) {
      console.log("Conductor no encontrado:", data.driverId)
      return NextResponse.json({ error: "Conductor no encontrado" }, { status: 404 })
    }

    console.log("Conductor encontrado:", driver.username)

    // Crear los registros en la base de datos
    const createdRecords = []

    for (const record of data.records) {
      try {
        console.log("Creando registro para fecha:", record.date)

        // Verificar si ya existe un registro para esta fecha y conductor
        const existingRecord = await prisma.dailyRecord.findFirst({
          where: {
            date: new Date(record.date),
            driverId: data.driverId,
          },
        })

        if (existingRecord) {
          console.log(`Ya existe un registro para la fecha ${record.date}, actualizando...`)

          // Actualizar el registro existente
          const updatedRecord = await prisma.dailyRecord.update({
            where: { id: existingRecord.id },
            data: {
              cashAmount: record.cashAmount || 0,
              cardAmount: record.cardAmount || 0,
              invoiceAmount: record.invoiceAmount || 0,
              otherAmount: record.otherAmount || 0,
              totalAmount: record.totalAmount || 0,
              fuelExpense: record.fuelExpense || 0,
              otherExpenses: record.otherExpenses || 0,
              otherExpenseNotes: record.otherExpenseNotes || "",
              driverCommission: record.driverCommission || 0,
              netAmount: record.netAmount || 0,
              notes: (existingRecord.notes || "") + " | Actualizado: " + new Date().toISOString(),
            },
          })

          createdRecords.push(updatedRecord)
        } else {
          // Crear un nuevo registro
          const newRecord = await prisma.dailyRecord.create({
            data: {
              date: new Date(record.date),
              startKm: record.startKm || 0,
              endKm: record.endKm || 0,
              totalKm: record.totalKm || 0,
              cashAmount: record.cashAmount || 0,
              cardAmount: record.cardAmount || 0,
              invoiceAmount: record.invoiceAmount || 0,
              otherAmount: record.otherAmount || 0,
              totalAmount: record.totalAmount || 0,
              fuelExpense: record.fuelExpense || 0,
              otherExpenses: record.otherExpenses || 0,
              otherExpenseNotes: record.otherExpenseNotes || "",
              driverCommission: record.driverCommission || 0,
              netAmount: record.netAmount || 0,
              notes: record.notes || "Registro importado",
              driverId: data.driverId,
            },
          })

          createdRecords.push(newRecord)
        }
      } catch (error) {
        console.error("Error al crear/actualizar registro:", error)
      }
    }

    console.log(`Registros creados/actualizados: ${createdRecords.length} de ${data.records.length}`)

    return NextResponse.json({
      message: `Se han importado ${createdRecords.length} registros correctamente`,
      count: createdRecords.length,
    })
  } catch (error) {
    console.error("Error al importar registros:", error)
    return NextResponse.json(
      {
        error: `Error al importar registros: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

