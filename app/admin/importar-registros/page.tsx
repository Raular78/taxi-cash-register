"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "..\..\..\components\ui/card"
import { Button } from "..\..\..\components\ui/button"
import { Textarea } from "..\..\..\components\ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "..\..\..\components\ui/table"
import { Input } from "..\..\..\components\ui/input"
import {
  ChevronLeft,
  Table2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "..\..\..\components\ui/alert"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface User {
  id: number
  username: string
  email: string
}

interface ParsedRecord {
  date: string
  cash: number
  card: number
  court: number
  other: number
  total: number
  driverAmount: number
  expenses: number
  expenseNotes: string
}

export default function ImportarRegistros() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("1") // Default to ID 1 (Carlos)
  const [inputData, setInputData] = useState<string>("")
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState<"input" | "preview" | "success">("input")
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("")

  // Cargar conductores al montar el componente
  useEffect(() => {
    // Establecer Carlos como conductor por defecto
    setUsers([
      {
        id: 1,
        username: "Carlos",
        email: "carlos@example.com",
      },
    ])
    setSelectedUserId("1")
    setIsLoadingUsers(false)
  }, [])

  // Plantilla para la tabla de datos
  const tableTemplate = `DIA      EFECTIVO    VISA    JUZGADO    MUTUA/aut    TOTAL    CHOFER    GASTOS    CONCEPTO
01.04.24  111,29      25      33,25      0           245,45   -85,90     15        GAS + autop
03.04.25  156,48      59      6,90       0           412,9    -144,51    15        gas+ autopista
04.04.25  1,42        52      21,10      0           388,5    -135,97    30        gasoil
05.04.25  23,81       30      4,40       0           543,4    -190,19    25        
06.04.25  -46,23      24      8,80       0           357,8    -125,23    30        gasoil
07.04.25  55,78       25      63,05      0           352,05   -123,21    20        
08.04.25  -14,88      15      120,75     3,39        291,09   -101,88    30        
`

  // Insertar la plantilla en el área de texto
  const insertTemplate = () => {
    setInputData(tableTemplate)
  }

  // Formatear los datos pegados para mejorar su estructura
  const formatData = () => {
    if (!inputData.trim()) return

    try {
      // Dividir por líneas
      const lines = inputData.trim().split("\n")
      const formattedLines = []

      // Procesar cada línea
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Detectar si es una línea de encabezado
        if (line.includes("DIA") && line.includes("EFECTIVO") && line.includes("VISA")) {
          formattedLines.push(
            "DIA      EFECTIVO    VISA    JUZGADO    MUTUA/aut    TOTAL    CHOFER    GASTOS    CONCEPTO",
          )
          continue
        }

        // Intentar extraer fecha en formato DD.MM.YY
        const dateMatch = line.match(/(\d{2})\.(\d{2})\.(\d{2})/)
        if (dateMatch) {
          // Es una línea de datos
          const dateStr = dateMatch[0]
          const parts = line.replace(dateStr, "").trim().split(/\s+/).filter(Boolean)

          if (parts.length >= 6) {
            const cash = parts[0] || "0"
            const card = parts[1] || "0"
            const court = parts[2] || "0"
            const other = parts[3] || "0"
            const total = parts[4] || "0"
            const driver = parts[5] || "0"
            const expenses = parts.length > 6 ? parts[6] : ""
            const concept = parts.length > 7 ? parts.slice(7).join(" ") : ""

            // Formatear la línea con espacios para alinear las columnas
            const formattedLine = `${dateStr}  ${cash.padEnd(10)}${card.padEnd(8)}${court.padEnd(10)}${other.padEnd(12)}${total.padEnd(8)}${driver.padEnd(9)}${expenses.padEnd(9)}${concept}`
            formattedLines.push(formattedLine)
          } else {
            // Si no tiene suficientes partes, mantener la línea original
            formattedLines.push(line)
          }
        } else if (/^\d+(?:,\d+)?/.test(line)) {
          // Es una línea de gastos
          const parts = line.split(/\s+/).filter(Boolean)
          if (parts.length >= 1) {
            const expense = parts[0]
            const concept = parts.length > 1 ? parts.slice(1).join(" ") : ""
            formattedLines.push(`        ${" ".repeat(48)}${expense.padEnd(9)}${concept}`)
          } else {
            formattedLines.push(line)
          }
        } else {
          // Otra línea, mantenerla como está
          formattedLines.push(line)
        }
      }

      setInputData(formattedLines.join("\n"))
    } catch (error) {
      console.error("Error formatting data:", error)
      // Si hay un error, mantener los datos originales
    }
  }

  const parseTableData = () => {
    setError(null)
    setProcessingStatus("Analizando datos...")

    if (!inputData.trim()) {
      setError("Por favor, introduce datos para importar o carga un archivo PDF.")
      setProcessingStatus("")
      return
    }

    try {
      console.log("Procesando datos:", inputData.substring(0, 100) + "...") // Log para depuración
      setProcessingStatus("Identificando registros...")

      // Dividir por líneas
      const lines = inputData.trim().split("\n")
      const records: ParsedRecord[] = []

      console.log(`Número de líneas: ${lines.length}`)

      // Variables para seguimiento de gastos
      let currentExpenses = 0
      let currentExpenseNotes = ""

      // Procesar cada línea
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line || line.startsWith("DIA") || line.startsWith("Tabla")) {
          console.log(`Línea ${i + 1} ignorada: ${line}`)
          continue
        }

        // Intentar extraer fecha en formato DD.MM.YY
        const dateMatch = line.match(/(\d{2})\.(\d{2})\.(\d{2})/)
        if (!dateMatch) {
          // Si no hay fecha, podría ser una línea de gastos
          const expenseMatch = line.match(/^(\d+(?:,\d+)?)\s+(.+)/)
          if (expenseMatch) {
            currentExpenses = Number.parseFloat(expenseMatch[1].replace(",", ".")) || 0
            currentExpenseNotes = expenseMatch[2] || ""
            console.log(`Gasto encontrado: ${currentExpenses}, Notas: ${currentExpenseNotes}`)
          }
          continue
        }

        // Extraer la fecha y el resto de la línea
        const dateStr = dateMatch[0]
        const restOfLine = line.substring(line.indexOf(dateStr) + dateStr.length).trim()

        // Dividir el resto de la línea por espacios
        const parts = restOfLine.split(/\s+/).filter(Boolean)
        console.log(`Línea ${i + 1} partes: ${parts.length}`, parts)

        // Verificar si tenemos suficientes partes
        if (parts.length < 5) {
          console.log(`Línea ${i + 1} ignorada por tener menos de 5 partes después de la fecha`)
          continue
        }

        try {
          // Convertir a formato ISO
          const [day, month, year] = dateStr.split(".")
          const fullYear = `20${year}` // Asumiendo años 2000+
          const isoDate = `${fullYear}-${month}-${day}`
          console.log(`Fecha ISO: ${isoDate}`)

          // Extraer valores numéricos
          const cash = Number.parseFloat(parts[0].replace(",", ".")) || 0
          const card = Number.parseFloat(parts[1].replace(",", ".")) || 0
          const court = Number.parseFloat(parts[2].replace(",", ".")) || 0
          const other = Number.parseFloat(parts[3].replace(",", ".")) || 0
          const total = Number.parseFloat(parts[4].replace(",", ".")) || 0
          const driverAmount = parts.length > 5 ? Number.parseFloat(parts[5].replace(",", ".")) || 0 : 0

          console.log(
            `Valores: cash=${cash}, card=${card}, court=${court}, other=${other}, total=${total}, driver=${driverAmount}`,
          )

          // Buscar gastos en la siguiente línea
          let expenses = currentExpenses
          let expenseNotes = currentExpenseNotes

          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim()
            if (
              !nextLine.match(/\d{2}\.\d{2}\.\d{2}/) &&
              !nextLine.startsWith("DIA") &&
              !nextLine.startsWith("Tabla")
            ) {
              const expenseParts = nextLine.split(/\s+/).filter(Boolean)

              if (expenseParts.length >= 1 && /^\d+(?:,\d+)?$/.test(expenseParts[0])) {
                expenses = Number.parseFloat(expenseParts[0].replace(",", ".")) || 0
                expenseNotes = expenseParts.slice(1).join(" ")
                console.log(`Gastos: ${expenses}, Notas: ${expenseNotes}`)
                i++ // Saltar la siguiente línea ya que la hemos procesado

                // Resetear los gastos actuales
                currentExpenses = 0
                currentExpenseNotes = ""
              }
            }
          }

          records.push({
            date: isoDate,
            cash,
            card,
            court,
            other,
            total,
            driverAmount,
            expenses,
            expenseNotes,
          })
          console.log(`Registro añadido para fecha ${isoDate}`)
        } catch (err) {
          console.error(`Error procesando línea ${i + 1}:`, err)
        }
      }

      console.log(`Total de registros procesados: ${records.length}`)
      setProcessingStatus(`Se encontraron ${records.length} registros.`)

      if (records.length === 0) {
        setError("No se pudieron extraer registros válidos de los datos proporcionados. Verifica el formato.")
        setProcessingStatus("")
        return
      }

      setParsedData(records)
      setStep("preview")
    } catch (error) {
      console.error("Error parsing data:", error)
      setError(`Error al procesar los datos: ${error instanceof Error ? error.message : String(error)}`)
      setProcessingStatus("")
    }
  }

  const importRecords = async () => {
    if (parsedData.length === 0) {
      setError("No hay datos para importar.")
      return
    }

    setIsLoading(true)
    setError(null)
    setProcessingStatus("Importando registros...")

    try {
      console.log("Enviando datos para importar:", {
        driverId: Number.parseInt(selectedUserId),
        records: parsedData.length,
      })

      const response = await fetch("/api/daily-records/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: Number.parseInt(selectedUserId),
          records: parsedData.map((record) => ({
            date: record.date,
            cashAmount: record.cash,
            cardAmount: record.card,
            invoiceAmount: record.court,
            otherAmount: record.other,
            totalAmount: record.total,
            driverCommission: Math.abs(record.driverAmount),
            fuelExpense: record.expenses,
            otherExpenseNotes: record.expenseNotes,
            // Campos requeridos con valores por defecto
            startKm: 0,
            endKm: 0,
            totalKm: 0,
            otherExpenses: 0,
            netAmount: record.total - Math.abs(record.driverAmount),
          })),
        }),
      })

      const responseData = await response.json()
      console.log("Respuesta de la API:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Error al importar registros")
      }

      setSuccess(`Se han importado ${parsedData.length} registros correctamente.`)
      setStep("success")
    } catch (error) {
      console.error("Error importing records:", error)
      setError(`Error al importar los registros: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      setProcessingStatus("")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setProcessingStatus("Preparando archivo...")

    // Verificar si es un PDF
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setIsPdfLoading(true)
      setProcessingStatus("Extrayendo texto del PDF...")
      try {
        // Enviar el PDF al servidor para procesarlo
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/pdf-extract", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Error al procesar el PDF")
        }

        const data = await response.json()
        if (data.text) {
          setInputData(data.text)
          console.log("Texto extraído del PDF:", data.text.substring(0, 100) + "...")
          setProcessingStatus("Texto extraído correctamente. Listo para procesar.")
        } else {
          throw new Error("No se pudo extraer texto del PDF")
        }
      } catch (error) {
        console.error("Error processing PDF:", error)
        setError(`Error al procesar el PDF: ${error instanceof Error ? error.message : String(error)}`)
        setProcessingStatus("")
      } finally {
        setIsPdfLoading(false)
      }
    } else {
      // Si es un archivo de texto, leerlo directamente
      setProcessingStatus("Leyendo archivo de texto...")
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setInputData(content || "")
        setProcessingStatus("Archivo leído correctamente. Listo para procesar.")
      }
      reader.readAsText(file)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
  }

  // Función para exportar los datos a CSV
  const exportToCSV = () => {
    if (parsedData.length === 0) return

    // Crear cabecera CSV
    const headers = "Fecha,Efectivo,Tarjeta,Juzgado,Otros,Total,Comisión,Gastos,Notas\n"

    // Crear filas de datos
    const rows = parsedData
      .map((record) => {
        return `${formatDate(record.date)},${record.cash},${record.card},${record.court},${record.other},${record.total},${Math.abs(record.driverAmount)},${record.expenses},"${record.expenseNotes}"`
      })
      .join("\n")

    // Combinar cabecera y filas
    const csv = headers + rows

    // Crear blob y descargar
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `registros_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <Button variant="ghost" onClick={() => router.push("/admin")} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <CardTitle>Importar Registros Históricos</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === "input" && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Conductor</label>
                <div className="flex items-center justify-between border rounded-md p-2">
                  <span>Carlos</span>
                  <span className="text-sm text-muted-foreground">Seleccionado automáticamente</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Subir archivo PDF o de texto</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.txt,.csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                    disabled={isPdfLoading}
                  />
                  {isPdfLoading && (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Procesando PDF...</span>
                    </div>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">Archivo seleccionado: {selectedFile.name}</p>
                )}
                {processingStatus && <p className="text-sm text-blue-500 mt-1">{processingStatus}</p>}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Datos a importar</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={insertTemplate}>
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Insertar plantilla
                    </Button>
                    <Button variant="outline" size="sm" onClick={formatData} disabled={!inputData.trim()}>
                      <Table2 className="h-4 w-4 mr-1" />
                      Formatear datos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setInputData("")} disabled={!inputData.trim()}>
                      Limpiar
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="El texto extraído del PDF aparecerá aquí. También puedes pegar datos manualmente."
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  rows={15}
                  className="font-mono text-sm text-black bg-white"
                  style={{ color: "black", backgroundColor: "white" }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Asegúrate de que los datos estén en formato tabular con columnas separadas por espacios.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Formato esperado:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto text-black">
                  {`DIA      EFECTIVO    VISA    JUZGADO    MUTUA/aut    TOTAL    CHOFER    GASTOS    CONCEPTO
01.04.24  111,29      25      33,25      0           245,45   -85,90     15        GAS + autop
03.04.25  156,48      59      6,90       0           412,9    -144,51    15        gas+ autopista
04.04.25  1,42        52      21,10      0           388,5    -135,97    30        gasoil`}
                </pre>
              </div>

              <div className="flex justify-end">
                <Button onClick={parseTableData} disabled={isLoading || isPdfLoading || !inputData.trim()}>
                  <Table2 className="h-4 w-4 mr-2" />
                  Procesar Datos
                </Button>
              </div>
            </>
          )}

          {step === "preview" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Vista previa de los datos</h3>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a CSV
                </Button>
              </div>
              <div className="overflow-x-auto mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Efectivo</TableHead>
                      <TableHead>Tarjeta</TableHead>
                      <TableHead>Juzgado</TableHead>
                      <TableHead>Otros</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Gastos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{formatCurrency(record.cash)}</TableCell>
                        <TableCell>{formatCurrency(record.card)}</TableCell>
                        <TableCell>{formatCurrency(record.court)}</TableCell>
                        <TableCell>{formatCurrency(record.other)}</TableCell>
                        <TableCell>{formatCurrency(record.total)}</TableCell>
                        <TableCell>{formatCurrency(Math.abs(record.driverAmount))}</TableCell>
                        <TableCell>
                          {formatCurrency(record.expenses)}
                          {record.expenseNotes && (
                            <span className="ml-2 text-xs text-muted-foreground">({record.expenseNotes})</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("input")} disabled={isLoading}>
                  Volver
                </Button>
                <Button onClick={importRecords} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Importar Registros
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Importación Completada</h3>
              <p className="mb-6">{success}</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.push("/admin/registros-diarios")}>
                  Ver Registros
                </Button>
                <Button
                  onClick={() => {
                    setStep("input")
                    setInputData("")
                    setParsedData([])
                    setSuccess(null)
                    setSelectedFile(null)
                  }}
                >
                  Importar Más Registros
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

