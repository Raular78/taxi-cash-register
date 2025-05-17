import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Connecting to the database...")
    await prisma.$connect()
    console.log("Connected successfully")

    console.log("Creating test records...")
    const testRecords = await Promise.all([
      prisma.record.create({
        data: {
          fecha: new Date("2024-12-18"),
          kilometros: 100,
          total: 50.5,
          visa: 20,
          facturacion: 30.5,
          cliente: "Test Client 1",
          gastos: 10,
          tipoGasto: "Gasolina",
        },
      }),
      prisma.record.create({
        data: {
          fecha: new Date("2024-12-18"),
          kilometros: 150,
          total: 75.0,
          visa: 40,
          facturacion: 35,
          cliente: "Test Client 2",
          gastos: 15,
          tipoGasto: "Mantenimiento",
        },
      }),
    ])
    console.log("Created test records:", testRecords)

    console.log("Fetching records...")
    const records = await prisma.record.findMany({
      where: {
        fecha: {
          gte: new Date("2024-12-18"),
          lte: new Date("2024-12-18"),
        },
      },
      orderBy: {
        fecha: "desc",
      },
    })
    console.log("Fetched records:", records)
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
