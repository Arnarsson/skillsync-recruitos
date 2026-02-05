import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "destructive" | "warning"
  description?: string
  action?: React.ReactNode
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", description, action, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-primary text-primary-foreground",
      success: "bg-green-600 text-white dark:bg-green-700",
      destructive: "bg-destructive text-white",
      warning: "bg-yellow-600 text-white dark:bg-yellow-700",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-200 flex items-center justify-between gap-4",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1">
          <div>{children}</div>
          {description && <div className="text-xs opacity-90">{description}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }
