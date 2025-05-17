import { format } from "date-fns"

export async function exportToPDF(data: any[], fileName: string, summary: any) {
  // We'll use dynamic import for jspdf and jspdf-autotable
  const jsPDF = (await import("jspdf")).default
  await import("jspdf-autotable")

  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text("Registro de Taxi", 14, 22)

  // Add summary
  doc.setFontSize(12)
  doc.text(`Recaudación Total: ${summary.totalRecaudacion.toFixed(2)}€`, 14, 32)
  doc.text(`Comisión Conductor: ${summary.comisionConductor.toFixed(2)}€`, 14, 39)
  doc.text(`Gastos: ${summary.gastos.toFixed(2)}€`, 14, 46)
  doc.text(`Total Neto: ${summary.totalNeto.toFixed(2)}€`, 14, 53)

  // Add table
  const tableColumn = ["Fecha", "Total", "Visa", "Facturación", "Cliente", "Gastos", "Tipo de Gasto", "Kilómetros"]
  const tableRows = data.map((item) => [
    format(new Date(item.fecha), "dd/MM/yyyy"),
    item.total.toFixed(2) + "€",
    item.visa ? item.visa.toFixed(2) + "€" : "-",
    item.facturacion ? item.facturacion.toFixed(2) + "€" : "-",
    item.cliente || "-",
    item.gastos ? item.gastos.toFixed(2) + "€" : "-",
    item.tipoGasto || "-",
    item.kilometros.toString(),
  ])
  ;(doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 1,
      overflow: "linebreak",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
      6: { cellWidth: 30 },
      7: { cellWidth: 20 },
    },
  })

  doc.save(fileName)
}
