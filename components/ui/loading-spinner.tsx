import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  label?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", label, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-2", className)}
        {...props}
      >
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }
