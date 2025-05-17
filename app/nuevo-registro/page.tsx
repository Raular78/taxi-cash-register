"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout"
import Image from "next/image"
import { Camera, Upload } from "lucide-react"
import ImageOCR from "../components/ImageOCR"

export default function NuevoRegistro() {
  const [fecha, setFecha] = useState("")
  const [kilometros, setKilometros] = useState("")
  const [total, setTotal] = useState("")
  const [visa, setVisa] = useState("")
  const [facturacion, setFacturacion] = useState("")
  const [cliente, setCliente] = useState("")
  const [gastos, setGastos] = useState("")
  const [tipoGasto, setTipoGasto] = useState("gasolina")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showOCR, setShowOCR] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Establecer la fecha actual por defecto
  useEffect(() => {
    const today = new Date()
    setFecha(today.toISOString().split("T")[0])
  }, [])

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOCRComplete = (result: any) => {
    setOcrResult(result)

    // Si se encontraron cantidades, sugerir la primera como valor de Visa
    if (result.amounts && result.amounts.length > 0) {
      // Limpiar la cantidad (reemplazar comas por puntos)
      const amount = result.amounts[0].replace(",", ".")
      setVisa(amount)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("fecha", fecha)
    formData.append("kilometros", kilometros)
    formData.append("total", total)
    formData.append("visa", visa || "0")
    formData.append("facturacion", facturacion || "0")
    formData.append("cliente", cliente)
    formData.append("gastos", gastos || "0")
    formData.append("tipoGasto", tipoGasto)

    if (fileInputRef.current?.files?.[0]) {
      formData.append("documentoFoto", fileInputRef.current.files[0])
    }

    try {
      const response = await fetch("/api/records", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear el registro")
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear el registro: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout title="Nuevo Registro | Taxi Cash Register">
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Nuevo Registro</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="fecha">
                Fecha
              </label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="kilometros">
                Kilómetros
              </label>
              <input
                type="number"
                id="kilometros"
                value={kilometros}
                onChange={(e) => setKilometros(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="total">
                Total
              </label>
              <input
                type="number"
                id="total"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                required
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="visa">
                Visa
              </label>
              <input
                type="number"
                id="visa"
                value={visa}
                onChange={(e) => setVisa(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="facturacion">
                Facturación
              </label>
              <input
                type="number"
                id="facturacion"
                value={facturacion}
                onChange={(e) => setFacturacion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="cliente">
                Cliente
              </label>
              <input
                type="text"
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="gastos">
                Gastos
              </label>
              <input
                type="number"
                id="gastos"
                value={gastos}
                onChange={(e) => setGastos(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="tipoGasto">
                Tipo de Gasto
              </label>
              <select
                id="tipoGasto"
                value={tipoGasto}
                onChange={(e) => setTipoGasto(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
              >
                <option value="gasolina">Gasolina</option>
                <option value="taller">Taller</option>
                <option value="autopista">Autopista</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium" htmlFor="documentoFoto">
                Foto del Documento
              </label>
              <button
                type="button"
                onClick={() => setShowOCR(!showOCR)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showOCR ? "Ocultar OCR" : "Usar OCR para Visa"}
              </button>
            </div>

            {showOCR ? (
              <div className="mb-4">
                <ImageOCR onOCRComplete={handleOCRComplete} />

                {ocrResult && (
                  <div className="mt-4 p-3 bg-gray-700/50 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Resultados OCR:</h3>
                    {ocrResult.visaLines.length > 0 ? (
                      <div>
                        <p className="text-xs text-gray-300 mb-1">Líneas con posibles pagos Visa:</p>
                        <ul className="text-xs text-gray-300 list-disc pl-5 mb-2">
                          {ocrResult.visaLines.map((line: string, index: number) => (
                            <li key={index}>{line}</li>
                          ))}
                        </ul>
                        {ocrResult.amounts.length > 0 && (
                          <p className="text-xs text-gray-300">Cantidades detectadas: {ocrResult.amounts.join(", ")}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300">No se detectaron marcas de Visa en la imagen.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                <label
                  htmlFor="documentoFoto"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {photoPreview ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={photoPreview || "/placeholder.svg"}
                          alt="Vista previa del documento"
                          width={120}
                          height={120}
                          className="rounded-md object-contain max-h-28"
                        />
                      </div>
                    ) : (
                      <>
                        <Camera className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-400">
                          <span className="font-semibold">Haz clic para capturar</span> o arrastra una imagen
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG o JPEG</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    id="documentoFoto"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Guardar Registro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
