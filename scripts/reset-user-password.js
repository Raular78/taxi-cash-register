const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Reseteando contraseña del usuario conductor...")

    // Buscar el usuario por username
    const user = await prisma.user.findUnique({
      where: { username: "conductor" },
    })

    if (!user) {
      console.log("Usuario 'conductor' no encontrado. Creando nuevo usuario...")

      // Crear el usuario si no existe
      const hashedPassword = await bcrypt.hash("Carlostaxi30!", 10)
      const newUser = await prisma.user.create({
        data: {
          username: "conductor",
          email: "conductor@taxicashregister.com",
          password: hashedPassword,
          role: "driver",
          status: "active",
          phone: "666333444",
        },
      })

      console.log(`Usuario conductor creado con ID: ${newUser.id}`)
      return
    }

    // Actualizar la contraseña
    const hashedPassword = await bcrypt.hash("Carlostaxi30!", 10)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    console.log(`Contraseña reseteada para el usuario: ${updatedUser.username}`)
    console.log("Datos del usuario:", {
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      email: updatedUser.email,
    })
  } catch (error) {
    console.error("Error al resetear la contraseña:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
