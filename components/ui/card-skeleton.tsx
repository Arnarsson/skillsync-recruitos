import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  withImage?: boolean
  withAction?: boolean
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ className, lines = 3, withImage = false, withAction = false, ...props }, ref) => {
    return (
      <Card ref={ref} className={className} {...props}>
        {withImage && (
          <div className="px-6 pt-6">
            <Skeleton className="w-full h-40 rounded-lg" />
          </div>
        )}
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={cn("h-4 mb-2", i === lines - 1 && "w-3/4")} />
          ))}
          {withAction && (
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
CardSkeleton.displayName = "CardSkeleton"

export { CardSkeleton }
