import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// Usa directamente la variable de entorno DATABASE_URL que ya está configurada
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando creación de usuarios...');
    
    // Crear usuario administrador (Raul)
    const adminPassword = await bcrypt.hash("Raultaxi30!", 10);
    const admin = await prisma.user.create({
      data: {
        username: "Raul",
        email: "raul@example.com", // Añadimos el email requerido
        password: adminPassword,
        role: "admin",
        status: "active"
      }
    });
    console.log('Usuario administrador creado:', admin.username);
    
    // Crear usuario conductor (Carlos)
    const driverPassword = await bcrypt.hash("Carlostaxi30!", 10);
    const driver = await prisma.user.create({
      data: {
        username: "Carlos",
        email: "carlos@example.com", // Añadimos el email requerido
        password: driverPassword,
        role: "driver",
        status: "active"
      }
    });
    console.log('Usuario conductor creado:', driver.username);
    
    console.log('Usuarios creados exitosamente');
  } catch (error) {
    console.error('Error al crear usuarios:', error);
    
    // Si el error es por usuarios duplicados, intentamos actualizar las contraseñas
    if (error.code === 'P2002') {
      console.log('Los usuarios ya existen. Intentando actualizar contraseñas...');
      
      try {
        // Actualizar contraseña de Raul
        const adminPassword = await bcrypt.hash("Raultaxi30!", 10);
        await prisma.user.updateMany({
          where: { username: "Raul" },
          data: { password: adminPassword }
        });
        console.log('Contraseña de Raul actualizada');
        
        // Actualizar contraseña de Carlos
        const driverPassword = await bcrypt.hash("Carlostaxi30!", 10);
        await prisma.user.updateMany({
          where: { username: "Carlos" },
          data: { password: driverPassword }
        });
        console.log('Contraseña de Carlos actualizada');
        
        console.log('Contraseñas actualizadas correctamente');
      } catch (updateError) {
        console.error('Error al actualizar contraseñas:', updateError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();