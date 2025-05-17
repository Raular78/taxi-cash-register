export interface FinancialSummary {
  totalRecaudacion: number
  comisionConductor: number
  gastos: number
  totalNeto: number
  desglosePagos: {
    visa: number
    facturacion: number
    efectivo: number
  }
}

export function calculateFinancialSummary(data: {
  total: number
  visa?: number
  facturacion?: number
  gastos?: number
}): FinancialSummary {
  const totalRecaudacion = data.total
  const comisionConductor = totalRecaudacion * 0.35
  const gastos = data.gastos || 0

  // Calculate total after commission and expenses
  const totalNeto = totalRecaudacion - comisionConductor - gastos

  // Payment method breakdown
  const visa = data.visa || 0
  const facturacion = data.facturacion || 0
  const efectivo = totalNeto - visa - facturacion

  return {
    totalRecaudacion,
    comisionConductor,
    gastos,
    totalNeto,
    desglosePagos: {
      visa,
      facturacion,
      efectivo,
    },
  }
}
