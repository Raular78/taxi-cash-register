import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/app/lib/db"
import { authOptions } from "@/app/api/auth/options"

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

    // Verificar permisos
    if (session.user.role !== "admin" && dailyRecord.driverId !== Number.parseInt(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Generar HTML para PDF (simplificado)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Registro Diario - ${dailyRecord.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; }
          .value { margin-left: 10px; }
          .total { font-size: 18px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Registro de Jornada Diaria</h1>
          <h2>ID: ${dailyRecord.id}</h2>
          <p>Fecha: ${new Date(dailyRecord.date).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
        </div>

        <div class="section">
          <h3>Información General</h3>
          <div class="grid">
            <div>
              <div class="field">
                <span class="label">Conductor:</span>
                <span class="value">${dailyRecord.driver?.username || "N/A"}</span>
              </div>
              <div class="field">
                <span class="label">Horario:</span>
                <span class="value">${dailyRecord.shiftStart || "No registrado"} - ${
                  dailyRecord.shiftEnd || "No registrado"
                }</span>
              </div>
            </div>
            <div>
              <div class="field">
                <span class="label">Kilómetros:</span>
                <span class="value">${dailyRecord.startKm} - ${dailyRecord.endKm} (${dailyRecord.totalKm} km)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Ingresos</h3>
          <div class="grid">
            <div>
              <div class="field">
                <span class="label">Efectivo:</span>
                <span class="value">${dailyRecord.cashAmount.toFixed(2)} €</span>
              </div>
              <div class="field">
                <span class="label">Tarjeta:</span>
                <span class="value">${dailyRecord.cardAmount.toFixed(2)} €</span>
              </div>
            </div>
            <div>
              <div class="field">
                <span class="label">Facturación:</span>
                <span class="value">${dailyRecord.invoiceAmount.toFixed(2)} €</span>
              </div>
              <div class="field">
                <span class="label">Otros:</span>
                <span class="value">${dailyRecord.otherAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          <div class="field total">
            <span class="label">Total Ingresos:</span>
            <span class="value">${dailyRecord.totalAmount.toFixed(2)} €</span>
          </div>
        </div>

        <div class="section">
          <h3>Gastos</h3>
          <div class="grid">
            <div>
              <div class="field">
                <span class="label">Combustible:</span>
                <span class="value">${dailyRecord.fuelExpense.toFixed(2)} €</span>
              </div>
            </div>
            <div>
              <div class="field">
                <span class="label">Otros gastos:</span>
                <span class="value">${dailyRecord.otherExpenses.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          <div class="field total">
            <span class="label">Total Gastos:</span>
            <span class="value">${(dailyRecord.fuelExpense + dailyRecord.otherExpenses).toFixed(2)} €</span>
          </div>
        </div>

        <div class="section">
          <h3>Resumen Financiero</h3>
          <div class="field total">
            <span class="label">Comisión Conductor (35%):</span>
            <span class="value">${dailyRecord.driverCommission.toFixed(2)} €</span>
          </div>
          <div class="field total">
            <span class="label">Neto Empresa:</span>
            <span class="value">${dailyRecord.netAmount.toFixed(2)} €</span>
          </div>
        </div>

        ${
          dailyRecord.notes
            ? `
        <div class="section">
          <h3>Notas</h3>
          <p>${dailyRecord.notes}</p>
        </div>
        `
            : ""
        }

        <div class="section" style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          <p>Documento generado el ${new Date().toLocaleString("es-ES")}</p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="registro_${dailyRecord.id}.html"`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 })
  }
}
