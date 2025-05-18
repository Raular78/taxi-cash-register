import { Skeleton } from "../../../components/ui/skeleton"
import { Card, CardContent, CardHeader } from "../../../components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-40" />
              </div>
            </div>

            <Skeleton className="h-24 w-full" />

            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
