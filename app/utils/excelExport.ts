import ExcelJS from "exceljs"

export async function exportToExcel(data: any[], fileName: string) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Registros")

  // Add headers
  worksheet.addRow(["Fecha", "Total", "Visa", "Facturación", "Cliente", "Gastos", "Tipo de Gasto", "Kilómetros"])

  // Add data
  data.forEach((item) => {
    worksheet.addRow([
      new Date(item.fecha),
      item.total,
      item.visa || "",
      item.facturacion || "",
      item.cliente || "",
      item.gastos || "",
      item.tipoGasto || "",
      item.kilometros,
    ])
  })

  // Style the header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = 15
  })

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  window.URL.revokeObjectURL(url)
}
