import { PrismaClient } from "@prisma/client"

// Evitar múltiples instancias de Prisma Client en desarrollo
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | any
}

// Verificar si estamos en modo de desarrollo
const isDev = process.env.NODE_ENV === "development"

// Datos de ejemplo para modo simulado
const mockData = {
  users: [
    {
      id: 1,
      username: "Conductor 1",
      email: "conductor1@example.com",
      password: "password",
      role: "driver",
      status: "active",
    },
    {
      id: 2,
      username: "Conductor 2",
      email: "conductor2@example.com",
      password: "password",
      role: "driver",
      status: "active",
    },
    { id: 3, username: "Admin", email: "admin@example.com", password: "password", role: "admin", status: "active" },
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
      driver: { id: 1, username: "Conductor 1" },
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
      driver: { id: 2, username: "Conductor 2" },
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
      driver: { id: 1, username: "Conductor 1" },
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
      user: { id: 1, username: "Conductor 1" },
    },
    {
      id: 2,
      date: new Date("2025-05-02"),
      category: "Mantenimiento",
      description: "Cambio de aceite",
      amount: 60,
      status: "approved",
      userId: 2,
      user: { id: 2, username: "Conductor 2" },
    },
    {
      id: 3,
      date: new Date("2025-05-10"),
      category: "alquiler",
      description: "Alquiler oficina",
      amount: 500,
      status: "approved",
      userId: 3,
      user: { id: 3, username: "Admin" },
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
      user: { id: 1, username: "Conductor 1" },
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
      user: { id: 2, username: "Conductor 2" },
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
      driver: { id: 1, username: "Conductor 1" },
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
      driver: { id: 2, username: "Conductor 2" },
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
      driver: { id: 1, username: "Conductor 1" },
    },
  ],
}

// Crear un cliente Prisma simulado
function createMockPrismaClient() {
  console.log("⚠️ Usando datos simulados para desarrollo - No hay conexión a la base de datos")

  const mockClient = {
    _isMockData: true,
    user: {
      findMany: async () => mockData.users,
      findUnique: async ({ where }: any) =>
        mockData.users.find((user) => user.id === where.id || user.email === where.email),
      findFirst: async ({ where }: any) => mockData.users.find((user) => user.email === where.email),
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
        // Filtrar por fecha si es necesario
        let filteredExpenses = [...mockData.expenses]

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
        const newExpense = {
          id: mockData.expenses.length + 1,
          ...data,
          userId: data.userId ? Number(data.userId) : null,
          user: data.userId ? mockData.users.find((user) => user.id === Number(data.userId)) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockData.expenses.push(newExpense)
        console.log("Nuevo gasto creado:", newExpense)
        console.log("Total gastos:", mockData.expenses.length)
        return newExpense
      },
      update: async ({ where, data }: any) => {
        const index = mockData.expenses.findIndex((expense) => expense.id === where.id)
        if (index !== -1) {
          mockData.expenses[index] = {
            ...mockData.expenses[index],
            ...data,
            updatedAt: new Date(),
          }
          return mockData.expenses[index]
        }
        throw new Error("Expense not found")
      },
      delete: async ({ where }: any) => {
        const index = mockData.expenses.findIndex((expense) => expense.id === where.id)
        if (index !== -1) {
          const deleted = mockData.expenses[index]
          mockData.expenses.splice(index, 1)
          return deleted
        }
        throw new Error("Expense not found")
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
