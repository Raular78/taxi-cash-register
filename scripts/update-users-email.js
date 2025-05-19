const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Actualizando usuarios...")

    // Actualizar usuario Raul
    const raul = await prisma.user.updateMany({
      where: { username: "Raul" },
      data: { 
        email: "r.arjona@mail.ru",
        password: await bcrypt.hash("Raultaxi30!", 10)
      }
    })
    console.log(`Usuario Raul actualizado: ${raul.count} registros`)

    // Actualizar usuario Carlos
    const carlos = await prisma.user.updateMany({
      where: { username: "Carlos" },
      data: { 
        email: "ch.ar.ly64@hotmail.com",
        password: await bcrypt.hash("Carlostaxi30!", 10)
      }
    })
    console.log(`Usuario Carlos actualizado: ${carlos.count} registros`)

    // Verificar los usuarios actualizados
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: "Raul" },
          { username: "Carlos" }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true
      }
    })

    console.log("Usuarios actualizados:")
    users.forEach(user => console.log(user))

  } catch (error) {
    console.error("Error al actualizar usuarios:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()