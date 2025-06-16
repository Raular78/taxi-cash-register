import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import prisma from "../../../lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!payroll) {
      return NextResponse.json({ error: "Nómina no encontrada" }, { status: 404 })
    }

    // Solo admin o el conductor propietario pueden ver la nómina
    if (session.user.role !== "admin" && payroll.userId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(payroll)
  } catch (error) {
    console.error("Error al obtener nómina:", error)
    return NextResponse.json({ error: "Error al obtener nómina" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()

    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: {
        status: data.status,
        paymentDate: data.status === "paid" ? new Date() : null,
        pdfUrl: data.pdfUrl !== undefined ? data.pdfUrl : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        baseSalary: data.baseSalary !== undefined ? Number.parseFloat(data.baseSalary) : undefined,
        commissions: data.commissions !== undefined ? Number.parseFloat(data.commissions) : undefined,
        bonuses: data.bonuses !== undefined ? Number.parseFloat(data.bonuses) : undefined,
        deductions: data.deductions !== undefined ? Number.parseFloat(data.deductions) : undefined,
        taxWithholding: data.taxWithholding !== undefined ? Number.parseFloat(data.taxWithholding) : undefined,
        netAmount: data.netAmount !== undefined ? Number.parseFloat(data.netAmount) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPayroll)
  } catch (error) {
    console.error("Error al actualizar nómina:", error)
    return NextResponse.json({ error: "Error al actualizar nómina" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    await prisma.payroll.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar nómina:", error)
    return NextResponse.json({ error: "Error al eliminar nómina" }, { status: 500 })
  }
}
