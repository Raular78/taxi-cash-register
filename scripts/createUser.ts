import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import path from "path"

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("Current directory:", __dirname)
console.log("DATABASE_URL:", process.env.DATABASE_URL)

const prisma = new PrismaClient()

async function createUser(username: string, password: string, role = "conductor") {
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role as "admin" | "conductor", // Aseguramos que el rol sea válido
      },
    })
    console.log(`Usuario creado con éxito: ${user.username} (Rol: ${user.role})`)
  } catch (error) {
    console.error("Error al crear el usuario:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Uso: npm run create-user -- <username> <password> [role]
const [username, password, role = "conductor"] = process.argv.slice(2)

if (username && password) {
  createUser(username, password, role)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
} else {
  console.log("Por favor, proporciona un nombre de usuario y una contraseña.")
  console.log("Uso: npm run create-user -- <username> <password> [role]")
  console.log("Roles disponibles: admin, conductor (por defecto: conductor)")
  process.exit(1)
}
