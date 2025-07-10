const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function addPaymentFieldsToExpenses() {
  try {
    console.log("🔄 Iniciando migración para añadir campos de pago a gastos...")

    // Ejecutar la migración SQL directamente
    await prisma.$executeRaw`
      ALTER TABLE "Expense" 
      ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP(3);
    `

    console.log("✅ Campos isPaid y paymentDate añadidos a la tabla Expense")

    // Actualizar gastos existentes - marcar como pagados los que están aprobados
    const updatedExpenses = await prisma.expense.updateMany({
      where: {
        status: "approved",
        isPaid: false,
      },
      data: {
        isPaid: true,
        paymentDate: new Date(),
      },
    })

    console.log(`✅ Actualizados ${updatedExpenses.count} gastos existentes como pagados`)

    console.log("🎉 Migración completada exitosamente")
  } catch (error) {
    console.error("❌ Error durante la migración:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
addPaymentFieldsToExpenses().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})
