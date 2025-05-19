const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Actualizando contraseñas...")
    
    // Actualizar contraseña del usuario Carlos
    const carlos = await prisma.user.update({
      where: { id: 1 },
      data: { password: await bcrypt.hash("Carlostaxi30!", 10) }
    })
    console.log(`Contraseña actualizada para ${carlos.username} (ID: ${carlos.id})`)
    
    // Actualizar contraseña del usuario Raul
    const raul = await prisma.user.update({
      where: { id: 2 },
      data: { password: await bcrypt.hash("Raultaxi30!", 10) }
    })
    console.log(`Contraseña actualizada para ${raul.username} (ID: ${raul.id})`)
    
    console.log("Contraseñas actualizadas correctamente")
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()