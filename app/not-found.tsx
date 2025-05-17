import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-6xl font-bold text-red-500">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">Página no encontrada</h2>
        <p className="mb-6 text-gray-600">Lo sentimos, la página que estás buscando no existe o ha sido movida.</p>
        <Link
          href="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
