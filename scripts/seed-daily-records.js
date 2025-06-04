// Este script crea algunos registros diarios de ejemplo
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  try {
    // Obtener el ID del conductor (asumiendo que existe un usuario con role='driver')
    const driver = await prisma.user.findFirst({
      where: { role: "driver" },
    })

    let driverId // Declare driverId here

    if (!driver) {
      console.log("No se encontró ningún conductor. Creando uno...")
      // Crear un conductor si no existe
      const newDriver = await prisma.user.create({
        data: {
          username: "Carlos",
          email: "carlos@example.com",
          password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // 123456
          role: "driver",
          status: "active",
        },
      })
      console.log("Conductor creado:", newDriver)
      driverId = newDriver.id
    } else {
      driverId = driver.id
      console.log("Usando conductor existente:", driver)
    }

    // Crear algunos registros diarios de ejemplo
    const today = new Date()
    const records = []

    // Crear registros para los últimos 30 días
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Valores aleatorios para simular datos reales
      const startKm = Math.floor(Math.random() * 1000) + 10000
      const endKm = startKm + Math.floor(Math.random() * 200) + 50
      const totalKm = endKm - startKm

      const cashAmount = Number.parseFloat((Math.random() * 100 + 50).toFixed(2))
      const cardAmount = Number.parseFloat((Math.random() * 80 + 20).toFixed(2))
      const invoiceAmount = Number.parseFloat((Math.random() * 50).toFixed(2))
      const otherAmount = Number.parseFloat((Math.random() * 30).toFixed(2))
      const totalAmount = cashAmount + cardAmount + invoiceAmount + otherAmount

      const fuelExpense = Number.parseFloat((Math.random() * 40 + 10).toFixed(2))
      const otherExpenses = Number.parseFloat((Math.random() * 20).toFixed(2))

      const driverCommission = Number.parseFloat((totalAmount * 0.35).toFixed(2))
      const netAmount = Number.parseFloat((totalAmount - fuelExpense - otherExpenses - driverCommission).toFixed(2))

      // Crear el registro
      records.push({
        date,
        startKm,
        endKm,
        totalKm,
        cashAmount,
        cardAmount,
        invoiceAmount,
        otherAmount,
        totalAmount,
        fuelExpense,
        otherExpenses,
        driverCommission,
        netAmount,
        shiftStart: "08:00",
        shiftEnd: "16:00",
        driverId,
      })
    }

    // Insertar los registros en la base de datos
    for (const record of records) {
      await prisma.dailyRecord.create({
        data: record,
      })
    }

    console.log(`Se crearon ${records.length} registros diarios de ejemplo`)
  } catch (error) {
    console.error("Error al crear registros de ejemplo:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
