const { PrismaClient } = require("@prisma/client")

async function main() {
  try {
    const prisma = new PrismaClient()

    // Verificar si la tabla Configuration existe
    console.log("Verificando si la tabla Configuration existe...")

    try {
      // Intentar ejecutar una consulta SQL para verificar si la tabla existe
      const tableExists = await prisma.$executeRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'Configuration'
        );
      `)

      if (!tableExists) {
        console.log("La tabla Configuration no existe, creándola...")

        // Crear la tabla Configuration
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Configuration" (
            "key" TEXT NOT NULL,
            "value" TEXT NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL,
            PRIMARY KEY ("key")
          );
        `)

        console.log("Tabla Configuration creada correctamente")

        // Insertar valores por defecto
        console.log("Insertando valores por defecto...")

        await prisma.$executeRawUnsafe(`
          INSERT INTO "Configuration" ("key", "value", "description", "createdAt", "updatedAt")
          VALUES 
            ('driver_base_salary', '1400', 'Salario base mensual del conductor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('driver_commission_rate', '35', 'Porcentaje de comisión del conductor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `)

        console.log("Valores por defecto insertados correctamente")
      } else {
        console.log("La tabla Configuration ya existe")
      }
    } catch (error) {
      console.error("Error al verificar la tabla:", error)
      throw error
    }

    await prisma.$disconnect()
    console.log("Migración completada con éxito")
  } catch (error) {
    console.error("Error en la migración:", error)
    process.exit(1)
  }
}

main()
