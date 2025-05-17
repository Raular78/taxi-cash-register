import { PrismaClient } from "@prisma/client"

// Use environment variables from TaxiApp
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TaxiApp,
    },
  },
})

export default prisma
