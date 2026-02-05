import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  illustration?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, illustration, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
        {...props}
      >
        {/* Illustration or Icon */}
        {illustration ? (
          <div className="mb-4">{illustration}</div>
        ) : Icon ? (
          <div className="mb-4 p-3 rounded-lg bg-muted">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : null}

        {/* Content */}
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
        )}

        {/* Action */}
        {action && <div className="mt-4">{action}</div>}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
