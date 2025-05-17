const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Creando usuarios de prueba...")

    // Crear usuario administrador (Raul)
    const adminPassword = await bcrypt.hash("Raultaxi30!", 10)
    const admin = await prisma.user.upsert({
      where: { email: "raul@taxicashregister.com" },
      update: {
        username: "admin",
        role: "admin",
        password: adminPassword,
      },
      create: {
        username: "admin",
        email: "raul@taxicashregister.com",
        password: adminPassword,
        role: "admin",
        status: "active",
        phone: "666111222",
      },
    })
    console.log(`Usuario administrador creado: ${admin.username}`)

    // Crear usuario conductor (Carlos)
    const driverPassword = await bcrypt.hash("Carlostaxi30!", 10)
    const driver = await prisma.user.upsert({
      where: { email: "carlos@taxicashregister.com" },
      update: {
        username: "conductor",
        role: "driver",
        password: driverPassword,
      },
      create: {
        username: "conductor",
        email: "carlos@taxicashregister.com",
        password: driverPassword,
        role: "driver",
        status: "active",
        phone: "666333444",
      },
    })
    console.log(`Usuario conductor creado: ${driver.username}`)

    console.log("Usuarios de prueba creados con éxito")
  } catch (error) {
    console.error("Error al crear usuarios de prueba:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
