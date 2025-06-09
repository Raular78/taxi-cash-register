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

      // Actualizar el registro diario
      const updatedRecord = await prisma.dailyRecord.update({
        where: { id },
        data: {
          date: data.date ? new Date(data.date) : undefined,
          startKm: data.startKm !== undefined ? data.startKm : undefined,
          endKm: data.endKm !== undefined ? data.endKm : undefined,
          totalKm: data.totalKm !== undefined ? data.totalKm : undefined,
          cashAmount: data.cashAmount !== undefined ? data.cashAmount : undefined,
          cardAmount: data.cardAmount !== undefined ? data.cardAmount : undefined,
          invoiceAmount: data.invoiceAmount !== undefined ? data.invoiceAmount : undefined,
          otherAmount: data.otherAmount !== undefined ? data.otherAmount : undefined,
          totalAmount: data.totalAmount !== undefined ? data.totalAmount : undefined,
          fuelExpense: data.fuelExpense !== undefined ? data.fuelExpense : undefined,
          otherExpenses: data.otherExpenses !== undefined ? data.otherExpenses : undefined,
          otherExpenseNotes: data.otherExpenseNotes !== undefined ? data.otherExpenseNotes : undefined,
          driverCommission: data.driverCommission !== undefined ? data.driverCommission : undefined,
          netAmount: data.netAmount !== undefined ? data.netAmount : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          shiftStart: data.shiftStart !== undefined ? data.shiftStart : undefined,
          shiftEnd: data.shiftEnd !== undefined ? data.shiftEnd : undefined,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        },
      })

      return NextResponse.json(updatedRecord)
    }

    // Si no es admin, verificar si es el conductor del registro
    if (currentRecord.driverId === Number.parseInt(session.user.id)) {
      console.log("PUT /api/daily-records/[id]: Acceso permitido para conductor propietario")
      const data = await request.json()

      // Actualizar el registro diario
      const updatedRecord = await prisma.dailyRecord.update({
        where: { id },
        data: {
          date: data.date ? new Date(data.date) : undefined,
          startKm: data.startKm !== undefined ? data.startKm : undefined,
          endKm: data.endKm !== undefined ? data.endKm : undefined,
          totalKm: data.totalKm !== undefined ? data.totalKm : undefined,
          cashAmount: data.cashAmount !== undefined ? data.cashAmount : undefined,
          cardAmount: data.cardAmount !== undefined ? data.cardAmount : undefined,
          invoiceAmount: data.invoiceAmount !== undefined ? data.invoiceAmount : undefined,
          otherAmount: data.otherAmount !== undefined ? data.otherAmount : undefined,
          totalAmount: data.totalAmount !== undefined ? data.totalAmount : undefined,
          fuelExpense: data.fuelExpense !== undefined ? data.fuelExpense : undefined,
          otherExpenses: data.otherExpenses !== undefined ? data.otherExpenses : undefined,
          otherExpenseNotes: data.otherExpenseNotes !== undefined ? data.otherExpenseNotes : undefined,
          driverCommission: data.driverCommission !== undefined ? data.driverCommission : undefined,
          netAmount: data.netAmount !== undefined ? data.netAmount : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          shiftStart: data.shiftStart !== undefined ? data.shiftStart : undefined,
          shiftEnd: data.shiftEnd !== undefined ? data.shiftEnd : undefined,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        },
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
