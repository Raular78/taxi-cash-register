import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar variables de entorno
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
    const tokenLength = process.env.BLOB_READ_WRITE_TOKEN?.length || 0

    return NextResponse.json({
      status: "Blob Debug Info",
      hasToken,
      tokenLength,
      tokenPreview: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 10) + "...",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: "Error checking blob configuration",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
