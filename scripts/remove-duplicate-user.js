const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Eliminando usuario duplicado...")
    
    // Eliminar el usuario Carlos con ID 3
    const deletedUser = await prisma.user.delete({
      where: { id: 3 }
    })
    
    console.log("Usuario eliminado:", deletedUser)
    
    // Verificar usuarios restantes
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true
      }
    })
    
    console.log("Usuarios restantes:")
    remainingUsers.forEach(user => console.log(user))
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()