import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Iniciando seed...")

    // Crear usuario administrador
    const adminPassword = await bcrypt.hash("Raultaxi30!", 10)
    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: {
        role: "admin",
        password: adminPassword,
        email: "admin@taxicashregister.com",
      },
      create: {
        username: "admin",
        password: adminPassword,
        role: "admin",
        email: "admin@taxicashregister.com",
      },
    })
    console.log(`Usuario administrador creado: ${admin.username}`)

    // Crear usuario conductor
    const driverPassword = await bcrypt.hash("Carlostaxi30!", 10)
    const driver = await prisma.user.upsert({
      where: { username: "conductor" },
      update: {
        role: "driver",
        password: driverPassword,
        email: "conductor@taxicashregister.com",
      },
      create: {
        username: "conductor",
        password: driverPassword,
        role: "driver",
        email: "conductor@taxicashregister.com",
      },
    })
    console.log(`Usuario conductor creado: ${driver.username}`)

    // Crear algunos registros de prueba asociados al conductor
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const records = await Promise.all([
      prisma.record.create({
        data: {
          date: today,
          origin: "Aeropuerto",
          destination: "Centro ciudad",
          distance: 15.5,
          fare: 25.0,
          tip: 5.0,
          totalAmount: 30.0,
          paymentMethod: "tarjeta",
          driverId: driver.id,
        },
      }),
      prisma.record.create({
        data: {
          date: yesterday,
          origin: "Hotel Plaza",
          destination: "Centro comercial",
          distance: 8.2,
          fare: 12.5,
          tip: 2.0,
          totalAmount: 14.5,
          paymentMethod: "efectivo",
          driverId: driver.id,
        },
      }),
    ])

    // Crear entradas de tiempo de ejemplo
    const timeEntries = await Promise.all([
      prisma.timeEntry.create({
        data: {
          userId: driver.id,
          startTime: new Date(today.setHours(8, 0, 0, 0)),
          endTime: new Date(today.setHours(16, 0, 0, 0)),
          breakTime: 60, // 60 minutos de descanso
          totalMinutes: 420, // 7 horas = 420 minutos
          notes: "Jornada normal",
        },
      }),
      prisma.timeEntry.create({
        data: {
          userId: driver.id,
          startTime: new Date(yesterday.setHours(9, 0, 0, 0)),
          endTime: new Date(yesterday.setHours(17, 30, 0, 0)),
          breakTime: 45, // 45 minutos de descanso
          totalMinutes: 465, // 7 horas y 45 minutos = 465 minutos
          notes: "Tráfico intenso",
        },
      }),
    ])

    console.log(`Creados ${records.length} registros de prueba`)
    console.log(`Creadas ${timeEntries.length} entradas de tiempo de prueba`)
    console.log("Seed completado con éxito")
  } catch (error) {
    console.error("Error durante el seed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
