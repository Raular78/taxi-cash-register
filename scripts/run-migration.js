// Este script ejecuta la migración para crear la tabla DailyRecord si no existe
const { exec } = require("child_process")

console.log("Running migration to create DailyRecord table...")

exec("npx ts-node prisma/migrations/create_daily_record_table.ts", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
})
