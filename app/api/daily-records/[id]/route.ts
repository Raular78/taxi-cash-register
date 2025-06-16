import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("GET /api/daily-records/[id]: No hay sesión")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("GET /api/daily-records/[id]: Sesión:", {
      id: session.user?.id,
      role: session.user?.role,
      username: session.user?.username,
    })

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el registro diario
    const dailyRecord = await prisma.dailyRecord.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!dailyRecord) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // CORREGIDO: Verificación de permisos para admin
    if (session.user.role === "admin") {
      console.log("GET /api/daily-records/[id]: Acceso permitido para admin")
      return NextResponse.json(dailyRecord)
    }

    // Si no es admin, verificar si es el conductor del registro
    if (dailyRecord.driverId === Number.parseInt(session.user.id)) {
      console.log("GET /api/daily-records/[id]: Acceso permitido para conductor propietario")
      return NextResponse.json(dailyRecord)
    }

    console.log(
      "GET /api/daily-records/[id]: Acceso denegado. Usuario:",
      session.user.id,
      "Registro:",
      dailyRecord.driverId,
    )
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  } catch (error) {
    console.error("Error al obtener registro diario:", error)
    return NextResponse.json({ error: "Error al obtener registro diario" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("PUT /api/daily-records/[id]: No hay sesión")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("PUT /api/daily-records/[id]: Sesión:", {
      id: session.user?.id,
      role: session.user?.role,
      username: session.user?.username,
    })

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el registro diario actual
    const currentRecord = await prisma.dailyRecord.findUnique({
      where: { id },
    })

    if (!currentRecord) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // CORREGIDO: Verificación de permisos para admin
    if (session.user.role === "admin") {
      console.log("PUT /api/daily-records/[id]: Acceso permitido para admin")
      const data = await request.json()

      console.log("Datos recibidos para actualización:", data)

      // 🔧 ARREGLO: Convertir correctamente los tipos antes de enviar a Prisma
      const updateData: any = {}

      // Convertir fecha si existe
      if (data.date !== undefined) {
        updateData.date = new Date(data.date)
      }

      // Convertir números enteros (kilómetros)
      if (data.startKm !== undefined) {
        updateData.startKm = typeof data.startKm === "string" ? Number.parseInt(data.startKm) : data.startKm
      }
      if (data.endKm !== undefined) {
        updateData.endKm = typeof data.endKm === "string" ? Number.parseInt(data.endKm) : data.endKm
      }
      if (data.totalKm !== undefined) {
        updateData.totalKm = typeof data.totalKm === "string" ? Number.parseInt(data.totalKm) : data.totalKm
      }

      // Convertir números decimales (importes)
      if (data.cashAmount !== undefined) {
        updateData.cashAmount =
          typeof data.cashAmount === "string" ? Number.parseFloat(data.cashAmount) : data.cashAmount
      }
      if (data.cardAmount !== undefined) {
        updateData.cardAmount =
          typeof data.cardAmount === "string" ? Number.parseFloat(data.cardAmount) : data.cardAmount
      }
      if (data.invoiceAmount !== undefined) {
        updateData.invoiceAmount =
          typeof data.invoiceAmount === "string" ? Number.parseFloat(data.invoiceAmount) : data.invoiceAmount
      }
      if (data.otherAmount !== undefined) {
        updateData.otherAmount =
          typeof data.otherAmount === "string" ? Number.parseFloat(data.otherAmount) : data.otherAmount
      }
      if (data.totalAmount !== undefined) {
        updateData.totalAmount =
          typeof data.totalAmount === "string" ? Number.parseFloat(data.totalAmount) : data.totalAmount
      }
      if (data.fuelExpense !== undefined) {
        updateData.fuelExpense =
          typeof data.fuelExpense === "string" ? Number.parseFloat(data.fuelExpense) : data.fuelExpense
      }
      if (data.otherExpenses !== undefined) {
        updateData.otherExpenses =
          typeof data.otherExpenses === "string" ? Number.parseFloat(data.otherExpenses) : data.otherExpenses
      }
      if (data.driverCommission !== undefined) {
        updateData.driverCommission =
          typeof data.driverCommission === "string" ? Number.parseFloat(data.driverCommission) : data.driverCommission
      }
      if (data.netAmount !== undefined) {
        updateData.netAmount = typeof data.netAmount === "string" ? Number.parseFloat(data.netAmount) : data.netAmount
      }

      // Campos de texto (no necesitan conversión)
      if (data.otherExpenseNotes !== undefined) {
        updateData.otherExpenseNotes = data.otherExpenseNotes
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes
      }
      if (data.shiftStart !== undefined) {
        updateData.shiftStart = data.shiftStart
      }
      if (data.shiftEnd !== undefined) {
        updateData.shiftEnd = data.shiftEnd
      }
      if (data.imageUrl !== undefined) {
        updateData.imageUrl = data.imageUrl
      }

      console.log("Datos convertidos para Prisma:", updateData)

      // Actualizar el registro diario
      const updatedRecord = await prisma.dailyRecord.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(updatedRecord)
    }

    // Si no es admin, verificar si es el conductor del registro
    if (currentRecord.driverId === Number.parseInt(session.user.id)) {
      console.log("PUT /api/daily-records/[id]: Acceso permitido para conductor propietario")
      const data = await request.json()

      console.log("Datos recibidos para actualización (conductor):", data)

      // 🔧 ARREGLO: Convertir correctamente los tipos antes de enviar a Prisma
      const updateData: any = {}

      // Convertir fecha si existe
      if (data.date !== undefined) {
        updateData.date = new Date(data.date)
      }

      // Convertir números enteros (kilómetros)
      if (data.startKm !== undefined) {
        updateData.startKm = typeof data.startKm === "string" ? Number.parseInt(data.startKm) : data.startKm
      }
      if (data.endKm !== undefined) {
        updateData.endKm = typeof data.endKm === "string" ? Number.parseInt(data.endKm) : data.endKm
      }
      if (data.totalKm !== undefined) {
        updateData.totalKm = typeof data.totalKm === "string" ? Number.parseInt(data.totalKm) : data.totalKm
      }

      // Convertir números decimales (importes)
      if (data.cashAmount !== undefined) {
        updateData.cashAmount =
          typeof data.cashAmount === "string" ? Number.parseFloat(data.cashAmount) : data.cashAmount
      }
      if (data.cardAmount !== undefined) {
        updateData.cardAmount =
          typeof data.cardAmount === "string" ? Number.parseFloat(data.cardAmount) : data.cardAmount
      }
      if (data.invoiceAmount !== undefined) {
        updateData.invoiceAmount =
          typeof data.invoiceAmount === "string" ? Number.parseFloat(data.invoiceAmount) : data.invoiceAmount
      }
      if (data.otherAmount !== undefined) {
        updateData.otherAmount =
          typeof data.otherAmount === "string" ? Number.parseFloat(data.otherAmount) : data.otherAmount
      }
      if (data.totalAmount !== undefined) {
        updateData.totalAmount =
          typeof data.totalAmount === "string" ? Number.parseFloat(data.totalAmount) : data.totalAmount
      }
      if (data.fuelExpense !== undefined) {
        updateData.fuelExpense =
          typeof data.fuelExpense === "string" ? Number.parseFloat(data.fuelExpense) : data.fuelExpense
      }
      if (data.otherExpenses !== undefined) {
        updateData.otherExpenses =
          typeof data.otherExpenses === "string" ? Number.parseFloat(data.otherExpenses) : data.otherExpenses
      }
      if (data.driverCommission !== undefined) {
        updateData.driverCommission =
          typeof data.driverCommission === "string" ? Number.parseFloat(data.driverCommission) : data.driverCommission
      }
      if (data.netAmount !== undefined) {
        updateData.netAmount = typeof data.netAmount === "string" ? Number.parseFloat(data.netAmount) : data.netAmount
      }

      // Campos de texto (no necesitan conversión)
      if (data.otherExpenseNotes !== undefined) {
        updateData.otherExpenseNotes = data.otherExpenseNotes
      }
      if (data.notes !== undefined) {
        updateData.notes = data.notes
      }
      if (data.shiftStart !== undefined) {
        updateData.shiftStart = data.shiftStart
      }
      if (data.shiftEnd !== undefined) {
        updateData.shiftEnd = data.shiftEnd
      }
      if (data.imageUrl !== undefined) {
        updateData.imageUrl = data.imageUrl
      }

      console.log("Datos convertidos para Prisma (conductor):", updateData)

      // Actualizar el registro diario
      const updatedRecord = await prisma.dailyRecord.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(updatedRecord)
    }

    console.log(
      "PUT /api/daily-records/[id]: Acceso denegado. Usuario:",
      session.user.id,
      "Registro:",
      currentRecord.driverId,
    )
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  } catch (error) {
    console.error("Error al actualizar registro diario:", error)
    return NextResponse.json({ error: "Error al actualizar registro diario" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("DELETE /api/daily-records/[id]: No hay sesión")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("DELETE /api/daily-records/[id]: Sesión:", {
      id: session.user?.id,
      role: session.user?.role,
      username: session.user?.username,
    })

    const id = Number.parseInt(params.id)

    // Verificar que el ID es válido
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el registro diario
    const dailyRecord = await prisma.dailyRecord.findUnique({
      where: { id },
    })

    if (!dailyRecord) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    // CORREGIDO: Verificación de permisos para admin
    if (session.user.role === "admin") {
      console.log("DELETE /api/daily-records/[id]: Eliminación permitida para admin")
      // Eliminar el registro diario
      await prisma.dailyRecord.delete({
        where: { id },
      })
      return NextResponse.json({ success: true })
    }

    // Si no es admin, verificar si es el conductor del registro
    if (dailyRecord.driverId === Number.parseInt(session.user.id)) {
      console.log("DELETE /api/daily-records/[id]: Eliminación permitida para conductor propietario")
      // Eliminar el registro diario
      await prisma.dailyRecord.delete({
        where: { id },
      })
      return NextResponse.json({ success: true })
    }

    console.log(
      "DELETE /api/daily-records/[id]: Acceso denegado. Usuario:",
      session.user.id,
      "Registro:",
      dailyRecord.driverId,
    )
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  } catch (error) {
    console.error("Error al eliminar registro diario:", error)
    return NextResponse.json({ error: "Error al eliminar registro diario" }, { status: 500 })
  }
}
