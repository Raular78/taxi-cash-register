import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

// Crear una instancia de PrismaClient con la URL de la base de datos directamente
// Reemplaza esta URL con la URL real de tu base de datos
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://usuario:contraseña@localhost:5432/taxicashregister?schema=public",
    },
  },
})

async function createUsers() {
  try {
    // Crear usuario administrador
    const adminPassword = await bcrypt.hash("Raultaxi30!", 10)
    const admin = await prisma.user.create({
      data: {
        username: "Raul",
        password: adminPassword,
        role: "admin",
      },
    })
    console.log(`Usuario administrador creado: ${admin.username}`)

    // Crear usuario conductor
    const driverPassword = await bcrypt.hash("Carlos taxi30!", 10)
    const driver = await prisma.user.create({
      data: {
        username: "Carlos",
        password: driverPassword,
        role: "conductor",
      },
    })
    console.log(`Usuario conductor creado: ${driver.username}`)

    console.log("Usuarios creados exitosamente")
  } catch (error) {
    console.error("Error al crear usuarios:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la función
createUsers()
  .then(() => console.log("Proceso completado"))
  .catch((e) => console.error(e))
