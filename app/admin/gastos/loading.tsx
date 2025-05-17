export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="h-10 w-40 bg-gray-200 animate-pulse rounded"></div>

      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-4"></div>
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
