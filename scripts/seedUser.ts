import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const username = "admin"
  const password = "password123"

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { username: username },
    update: {},
    create: {
      username: username,
      password: hashedPassword,
    },
  })

  console.log({ user })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
