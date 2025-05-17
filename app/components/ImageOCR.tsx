"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Search } from "lucide-react"
import Image from "next/image"

interface ImageOCRProps {
  onOCRComplete: (result: {
    text: string
    visaLines: string[]
    amounts: string[]
    confidence: number
  }) => void
}

export default function ImageOCR({ onOCRComplete }: ImageOCRProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async () => {
    if (!image || !fileInputRef.current?.files?.[0]) {
      setError("Por favor, selecciona una imagen primero")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", fileInputRef.current.files[0])

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al procesar la imagen")
      }

      const result = await response.json()
      onOCRComplete(result)
    } catch (err) {
      console.error("Error processing image:", err)
      setError(err instanceof Error ? err.message : "Error al procesar la imagen")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center w-full">
        <label
          htmlFor="ocrImage"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {image ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={image || "/placeholder.svg"}
                  alt="Imagen para OCR"
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
            id="ocrImage"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            ref={fileInputRef}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button
        onClick={processImage}
        disabled={!image || isProcessing}
        className="w-full flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Procesando...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Procesar Imagen
          </>
        )}
      </Button>
    </div>
  )
}
