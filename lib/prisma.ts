import { PrismaClient } from "@prisma/client"

// Evitar múltiples instancias de Prisma Client en desarrollo
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | any
  mockExpenses?: any[]
  mockFixedExpenses?: any[]
}

// Verificar si estamos en modo de desarrollo
const isDev = process.env.NODE_ENV === "development"

// Datos de ejemplo para modo simulado
const mockData = {
  users: [
    {
      id: 1,
      username: "Raul",
      email: "raul@example.com",
      password: "Raultaxi30!",
      role: "admin",
      status: "active",
    },
    {
      id: 2,
      username: "Carlos",
      email: "carlos@example.com",
      password: "Carlostaxi30!",
      role: "driver",
      status: "active",
    },
  ],
  dailyRecords: [
    {
      id: 1,
      date: new Date("2025-05-01"),
      driverId: 1,
      startKm: 1000,
      endKm: 1200,
      totalKm: 200,
      cashAmount: 150,
      cardAmount: 80,
      invoiceAmount: 0,
      otherAmount: 0,
      totalAmount: 230,
      fuelExpense: 40,
      otherExpenses: 10,
      driverCommission: 63,
      netAmount: 117,
      driver: { id: 1, username: "Raul" },
    },
    {
      id: 2,
      date: new Date("2025-05-02"),
      driverId: 2,
      startKm: 1200,
      endKm: 1450,
      totalKm: 250,
      cashAmount: 180,
      cardAmount: 120,
      invoiceAmount: 50,
      otherAmount: 0,
      totalAmount: 350,
      fuelExpense: 50,
      otherExpenses: 15,
      driverCommission: 99.75,
      netAmount: 185.25,
      driver: { id: 2, username: "Carlos" },
    },
    {
      id: 3,
      date: new Date("2025-05-15"),
      driverId: 1,
      startKm: 1450,
      endKm: 1650,
      totalKm: 200,
      cashAmount: 200,
      cardAmount: 100,
      invoiceAmount: 0,
      otherAmount: 0,
      totalAmount: 300,
      fuelExpense: 45,
      otherExpenses: 5,
      driverCommission: 75,
      netAmount: 175,
      driver: { id: 1, username: "Raul" },
    },
  ],
  expenses: [
    {
      id: 1,
      date: new Date("2025-05-01"),
      category: "Combustible",
      description: "Gasolina",
      amount: 40,
      status: "approved",
      userId: 1,
      user: { id: 1, username: "Raul" },
    },
    {
      id: 2,
      date: new Date("2025-05-02"),
      category: "Mantenimiento",
      description: "Cambio de aceite",
      amount: 60,
      status: "approved",
      userId: 2,
      user: { id: 2, username: "Carlos" },
    },
    {
      id: 3,
      date: new Date("2025-05-10"),
      category: "alquiler",
      description: "Alquiler oficina",
      amount: 500,
      status: "approved",
      userId: 1,
      user: { id: 1, username: "Raul" },
    },
  ],
  fixedExpenses: [
    {
      id: 1,
      name: "Alquiler oficina",
      amount: 500,
      frequency: "mensual",
      category: "alquiler",
      nextPaymentDate: new Date("2025-05-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "Seguro vehículo",
      amount: 300,
      frequency: "trimestral",
      category: "seguros",
      nextPaymentDate: new Date("2025-07-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      name: "Impuesto circulación",
      amount: 150,
      frequency: "anual",
      category: "impuestos",
      nextPaymentDate: new Date("2025-12-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  payrolls: [
    {
      id: 1,
      userId: 1,
      periodStart: new Date("2025-05-01"),
      periodEnd: new Date("2025-05-15"),
      baseSalary: 800,
      commissions: 200,
      bonuses: 50,
      deductions: 100,
      taxWithholding: 150,
      netAmount: 800,
      status: "paid",
      user: { id: 1, username: "Raul" },
    },
    {
      id: 2,
      userId: 2,
      periodStart: new Date("2025-05-01"),
      periodEnd: new Date("2025-05-15"),
      baseSalary: 750,
      commissions: 180,
      bonuses: 30,
      deductions: 90,
      taxWithholding: 140,
      netAmount: 730,
      status: "paid",
      user: { id: 2, username: "Carlos" },
    },
  ],
  records: [
    {
      id: 1,
      date: new Date("2025-05-01"),
      origin: "Aeropuerto",
      destination: "Centro",
      distance: 15.5,
      fare: 25,
      tip: 2,
      totalAmount: 27,
      paymentMethod: "efectivo",
      driverId: 1,
      driver: { id: 1, username: "Raul" },
    },
    {
      id: 2,
      date: new Date("2025-05-02"),
      origin: "Hotel Plaza",
      destination: "Estación de tren",
      distance: 8.2,
      fare: 12,
      tip: 1,
      totalAmount: 13,
      paymentMethod: "tarjeta",
      driverId: 2,
      driver: { id: 2, username: "Carlos" },
    },
    {
      id: 3,
      date: new Date("2025-05-15"),
      origin: "Centro comercial",
      destination: "Playa",
      distance: 12.3,
      fare: 18,
      tip: 3,
      totalAmount: 21,
      paymentMethod: "efectivo",
      driverId: 1,
      driver: { id: 1, username: "Raul" },
    },
  ],
}

// Inicializar los gastos simulados globales
if (!globalForPrisma.mockExpenses) {
  globalForPrisma.mockExpenses = [...mockData.expenses]
}

// Inicializar los gastos fijos simulados globales
if (!globalForPrisma.mockFixedExpenses) {
  globalForPrisma.mockFixedExpenses = [...mockData.fixedExpenses]
}

// Crear un cliente Prisma simulado
function createMockPrismaClient() {
  console.log("⚠️ Usando datos simulados para desarrollo - No hay conexión a la base de datos")

  // Asegurar que las fechas de los datos simulados sean actuales
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Actualizar fechas en los datos simulados para que sean del mes actual
  mockData.dailyRecords.forEach((record) => {
    const originalDate = new Date(record.date)
    record.date = new Date(currentYear, currentMonth, originalDate.getDate())
  })

  mockData.expenses.forEach((expense) => {
    const originalDate = new Date(expense.date)
    expense.date = new Date(currentYear, currentMonth, originalDate.getDate())
  })

  mockData.fixedExpenses.forEach((expense) => {
    const originalDate = new Date(expense.nextPaymentDate)
    expense.nextPaymentDate = new Date(currentYear, currentMonth, originalDate.getDate())
  })

  mockData.payrolls.forEach((payroll) => {
    const originalStartDate = new Date(payroll.periodStart)
    const originalEndDate = new Date(payroll.periodEnd)
    payroll.periodStart = new Date(currentYear, currentMonth, originalStartDate.getDate())
    payroll.periodEnd = new Date(currentYear, currentMonth, originalEndDate.getDate())
  })

  mockData.records.forEach((record) => {
    const originalDate = new Date(record.date)
    record.date = new Date(currentYear, currentMonth, originalDate.getDate())
  })

  const mockClient = {
    _isMockData: true,
    user: {
      findMany: async () => mockData.users,
      findUnique: async ({ where }: any) =>
        mockData.users.find((user) => user.id === where.id || user.email === where.email),
      findFirst: async ({ where }: any) =>
        mockData.users.find((user) => user.email === where.email || user.username === where.username),
    },
    dailyRecord: {
      findMany: async ({ where, orderBy, include }: any) => {
        console.log("Mock findMany dailyRecord con where:", where)
        // Filtrar por fecha si es necesario
        let filteredRecords = [...mockData.dailyRecords]

        if (where?.date) {
          filteredRecords = filteredRecords.filter((record) => {
            const recordDate = new Date(record.date)
            if (where.date.gte && where.date.lte) {
              return recordDate >= where.date.gte && recordDate <= where.date.lte
            }
            return true
          })
        }

        // Filtrar por conductor si es necesario
        if (where?.driverId) {
          filteredRecords = filteredRecords.filter((record) => record.driverId === Number(where.driverId))
        }

        // Ordenar si es necesario
        if (orderBy?.date) {
          filteredRecords.sort((a, b) => {
            if (orderBy.date === "desc") {
              return new Date(b.date).getTime() - new Date(a.date).getTime()
            } else {
              return new Date(a.date).getTime() - new Date(b.date).getTime()
            }
          })
        }

        return filteredRecords
      },
      findUnique: async ({ where }: any) => mockData.dailyRecords.find((record) => record.id === where.id),
      create: async ({ data }: any) => {
        const newRecord = {
          id: mockData.dailyRecords.length + 1,
          ...data,
          driver: mockData.users.find((user) => user.id === data.driverId),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockData.dailyRecords.push(newRecord)
        return newRecord
      },
      update: async ({ where, data }: any) => {
        const index = mockData.dailyRecords.findIndex((record) => record.id === where.id)
        if (index !== -1) {
          mockData.dailyRecords[index] = {
            ...mockData.dailyRecords[index],
            ...data,
            updatedAt: new Date(),
          }
          return mockData.dailyRecords[index]
        }
        throw new Error("Record not found")
      },
      delete: async ({ where }: any) => {
        const index = mockData.dailyRecords.findIndex((record) => record.id === where.id)
        if (index !== -1) {
          const deleted = mockData.dailyRecords[index]
          mockData.dailyRecords.splice(index, 1)
          return deleted
        }
        throw new Error("Record not found")
      },
    },
    expense: {
      findMany: async ({ where, orderBy, include }: any) => {
        console.log("Mock findMany expense con where:", where)
        // Usar los gastos simulados globales
        let filteredExpenses = [...(globalForPrisma.mockExpenses || mockData.expenses)]

        if (where?.date) {
          filteredExpenses = filteredExpenses.filter((expense) => {
            const expenseDate = new Date(expense.date)
            if (where.date.gte && where.date.lte) {
              return expenseDate >= where.date.gte && expenseDate <= where.date.lte
            }
            return true
          })
        }

        // Filtrar por categoría si es necesario
        if (where?.category) {
          if (where.category.in) {
            filteredExpenses = filteredExpenses.filter((expense) => where.category.in.includes(expense.category))
          } else if (where.category.notIn) {
            filteredExpenses = filteredExpenses.filter((expense) => !where.category.notIn.includes(expense.category))
          } else {
            filteredExpenses = filteredExpenses.filter((expense) => expense.category === where.category)
          }
        }

        // Filtrar por estado si es necesario
        if (where?.status) {
          filteredExpenses = filteredExpenses.filter((expense) => expense.status === where.status)
        }

        // Ordenar si es necesario
        if (orderBy?.date) {
          filteredExpenses.sort((a, b) => {
            if (orderBy.date === "desc") {
              return new Date(b.date).getTime() - new Date(a.date).getTime()
            } else {
              return new Date(a.date).getTime() - new Date(b.date).getTime()
            }
          })
        }

        return filteredExpenses
      },
      create: async ({ data }: any) => {
        console.log("Mock create expense con data:", data)

        // Extraer el ID del usuario
        let userId = null
        if (data.user && data.user.connect && data.user.connect.id) {
          userId = Number(data.user.connect.id)
        } else if (data.userId) {
          userId = Number(data.userId)
        }

        const newExpense = {
          id: (globalForPrisma.mockExpenses?.length || 0) + 1,
          date: data.date,
          category: data.category,
          description: data.description,
          amount: Number(data.amount),
          receipt: data.receipt || null,
          notes: data.notes || null,
          status: data.status || "pending",
          userId: userId,
          user: userId ? mockData.users.find((user) => user.id === userId) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Añadir a los gastos simulados globales
        if (globalForPrisma.mockExpenses) {
          globalForPrisma.mockExpenses.push(newExpense)
        } else {
          globalForPrisma.mockExpenses = [newExpense]
        }

        console.log("Nuevo gasto creado:", newExpense)
        console.log("Total gastos:", globalForPrisma.mockExpenses?.length)
        return newExpense
      },
      update: async ({ where, data }: any) => {
        const expenses = globalForPrisma.mockExpenses || mockData.expenses
        const index = expenses.findIndex((expense) => expense.id === where.id)
        if (index !== -1) {
          expenses[index] = {
            ...expenses[index],
            ...data,
            updatedAt: new Date(),
          }
          return expenses[index]
        }
        throw new Error("Expense not found")
      },
      delete: async ({ where }: any) => {
        const expenses = globalForPrisma.mockExpenses || mockData.expenses
        const index = expenses.findIndex((expense) => expense.id === where.id)
        if (index !== -1) {
          const deleted = expenses[index]
          expenses.splice(index, 1)
          return deleted
        }
        throw new Error("Expense not found")
      },
    },
    fixedExpense: {
      findMany: async ({ where, orderBy }: any) => {
        console.log("Mock findMany fixedExpense con where:", where)
        // Usar los gastos fijos simulados globales
        const filteredExpenses = [...(globalForPrisma.mockFixedExpenses || mockData.fixedExpenses)]

        // Ordenar si es necesario
        if (orderBy?.nextPaymentDate) {
          filteredExpenses.sort((a, b) => {
            if (orderBy.nextPaymentDate === "desc") {
              return new Date(b.nextPaymentDate).getTime() - new Date(a.nextPaymentDate).getTime()
            } else {
              return new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
            }
          })
        }

        return filteredExpenses
      },
      create: async ({ data }: any) => {
        const newFixedExpense = {
          id: (globalForPrisma.mockFixedExpenses?.length || 0) + 1,
          name: data.name,
          amount: Number(data.amount),
          frequency: data.frequency,
          category: data.category,
          nextPaymentDate: data.nextPaymentDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Añadir a los gastos fijos simulados globales
        if (globalForPrisma.mockFixedExpenses) {
          globalForPrisma.mockFixedExpenses.push(newFixedExpense)
        } else {
          globalForPrisma.mockFixedExpenses = [newFixedExpense]
        }

        console.log("Nuevo gasto fijo creado:", newFixedExpense)
        return newFixedExpense
      },
      update: async ({ where, data }: any) => {
        const fixedExpenses = globalForPrisma.mockFixedExpenses || mockData.fixedExpenses
        const index = fixedExpenses.findIndex((expense) => expense.id === where.id)
        if (index !== -1) {
          fixedExpenses[index] = {
            ...fixedExpenses[index],
            ...data,
            updatedAt: new Date(),
          }
          return fixedExpenses[index]
        }
        throw new Error("Fixed expense not found")
      },
      delete: async ({ where }: any) => {
        const fixedExpenses = globalForPrisma.mockFixedExpenses || mockData.fixedExpenses
        const index = fixedExpenses.findIndex((expense) => expense.id === where.id)
        if (index !== -1) {
          const deleted = fixedExpenses[index]
          fixedExpenses.splice(index, 1)
          return deleted
        }
        throw new Error("Fixed expense not found")
      },
    },
    payroll: {
      findMany: async ({ where, orderBy }: any) => {
        console.log("Mock findMany payroll con where:", where)
        // Filtrar por fecha si es necesario
        let filteredPayrolls = [...mockData.payrolls]

        if (where?.periodEnd) {
          filteredPayrolls = filteredPayrolls.filter((payroll) => {
            const payrollDate = new Date(payroll.periodEnd)
            if (where.periodEnd.gte && where.periodEnd.lte) {
              return payrollDate >= where.periodEnd.gte && payrollDate <= where.periodEnd.lte
            }
            return true
          })
        }

        // Filtrar por estado si es necesario
        if (where?.status) {
          filteredPayrolls = filteredPayrolls.filter((payroll) => payroll.status === where.status)
        }

        // Ordenar si es necesario
        if (orderBy?.periodEnd) {
          filteredPayrolls.sort((a, b) => {
            if (orderBy.periodEnd === "desc") {
              return new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()
            } else {
              return new Date(a.periodEnd).getTime() - new Date(b.periodEnd).getTime()
            }
          })
        }

        return filteredPayrolls
      },
      create: async ({ data }: any) => {
        const newPayroll = {
          id: mockData.payrolls.length + 1,
          ...data,
          userId: Number(data.userId),
          user: mockData.users.find((user) => user.id === Number(data.userId)),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockData.payrolls.push(newPayroll)
        return newPayroll
      },
    },
    record: {
      findMany: async ({ where, orderBy }: any) => {
        console.log("Mock findMany record con where:", where)
        // Filtrar por fecha si es necesario
        let filteredRecords = [...mockData.records]

        if (where?.date) {
          filteredRecords = filteredRecords.filter((record) => {
            const recordDate = new Date(record.date)
            if (where.date.gte && where.date.lte) {
              return recordDate >= where.date.gte && recordDate <= where.date.lte
            }
            return true
          })
        }

        // Filtrar por conductor si es necesario
        if (where?.driverId) {
          filteredRecords = filteredRecords.filter((record) => record.driverId === Number(where.driverId))
        }

        // Ordenar si es necesario
        if (orderBy?.date) {
          filteredRecords.sort((a, b) => {
            if (orderBy.date === "desc") {
              return new Date(b.date).getTime() - new Date(a.date).getTime()
            } else {
              return new Date(a.date).getTime() - new Date(b.date).getTime()
            }
          })
        }

        return filteredRecords
      },
    },
    $connect: async () => {},
    $disconnect: async () => {},
  } as unknown as PrismaClient

  return mockClient
}

// Intentar crear un cliente Prisma real, si falla, usar el simulado
let prismaClient: PrismaClient

try {
  // Intentar crear un cliente Prisma real
  prismaClient = new PrismaClient({
    log: isDev ? ["query", "error", "warn"] : ["error"],
  })

  // Probar la conexión
  prismaClient.$connect().catch((e) => {
    console.error("Error al conectar con la base de datos:", e)
    console.log("Cambiando a modo simulado...")
    prismaClient = createMockPrismaClient()
  })
} catch (e) {
  console.error("Error al inicializar Prisma Client:", e)
  console.log("Cambiando a modo simulado...")
  prismaClient = createMockPrismaClient()
}

// Exportar el cliente Prisma
export const prisma = globalForPrisma.prisma || prismaClient

// Asignar a global en desarrollo
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

