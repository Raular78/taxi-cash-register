import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    // Verificar si la tabla DailyRecord ya existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'DailyRecord'
      );
    `

    console.log("Checking if DailyRecord table exists:", tableExists)

    // Si la tabla no existe, crearla manualmente
    if (!tableExists[0].exists) {
      console.log("Creating DailyRecord table...")

      await prisma.$executeRaw`
        CREATE TABLE "DailyRecord" (
          "id" SERIAL PRIMARY KEY,
          "date" TIMESTAMP(3) NOT NULL,
          "startKm" INTEGER NOT NULL,
          "endKm" INTEGER NOT NULL,
          "totalKm" INTEGER NOT NULL,
          "cashAmount" DECIMAL(65,30) NOT NULL,
          "cardAmount" DECIMAL(65,30) NOT NULL,
          "invoiceAmount" DECIMAL(65,30) NOT NULL,
          "otherAmount" DECIMAL(65,30) NOT NULL,
          "totalAmount" DECIMAL(65,30) NOT NULL,
          "fuelExpense" DECIMAL(65,30) NOT NULL,
          "otherExpenses" DECIMAL(65,30) NOT NULL,
          "otherExpenseNotes" TEXT,
          "driverCommission" DECIMAL(65,30) NOT NULL,
          "netAmount" DECIMAL(65,30) NOT NULL,
          "notes" TEXT,
          "shiftStart" TEXT,
          "shiftEnd" TEXT,
          "shiftBreakStart" TEXT,
          "shiftBreakEnd" TEXT,
          "imageUrl" TEXT,
          "driverId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `

      await prisma.$executeRaw`
        CREATE INDEX "DailyRecord_driverId_idx" ON "DailyRecord"("driverId");
      `

      await prisma.$executeRaw`
        CREATE INDEX "DailyRecord_date_idx" ON "DailyRecord"("date");
      `

      console.log("DailyRecord table created successfully")
    } else {
      console.log("DailyRecord table already exists")
    }
  } catch (error) {
    console.error("Error creating DailyRecord table:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
