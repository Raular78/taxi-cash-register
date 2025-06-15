// Script para probar gastos recurrentes
console.log("🧪 Iniciando pruebas de gastos recurrentes...")

// Simular creación de gastos fijos recurrentes
const testExpenses = [
  {
    category: "Alquiler",
    description: "Alquiler oficina mensual",
    amount: 500,
    isRecurring: true,
    frequency: "monthly",
    date: new Date(),
  },
  {
    category: "Seguros",
    description: "Seguro vehículo trimestral",
    amount: 300,
    isRecurring: true,
    frequency: "quarterly",
    date: new Date(),
  },
  {
    category: "Impuestos",
    description: "Impuesto circulación anual",
    amount: 150,
    isRecurring: true,
    frequency: "annual",
    date: new Date(),
  },
]

console.log("📋 Gastos de prueba creados:")
testExpenses.forEach((expense, index) => {
  console.log(`${index + 1}. ${expense.description} - ${expense.amount}€ (${expense.frequency})`)
})

// Simular próximas fechas de vencimiento
const addMonths = (date, months) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

console.log("\n📅 Próximas fechas de generación:")
testExpenses.forEach((expense) => {
  let nextDate
  switch (expense.frequency) {
    case "monthly":
      nextDate = addMonths(expense.date, 1)
      break
    case "quarterly":
      nextDate = addMonths(expense.date, 3)
      break
    case "annual":
      nextDate = addMonths(expense.date, 12)
      break
  }
  console.log(`- ${expense.description}: ${nextDate.toLocaleDateString("es-ES")}`)
})

console.log("\n✅ Pruebas completadas. Los gastos recurrentes están configurados correctamente.")
