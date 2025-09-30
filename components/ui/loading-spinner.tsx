import { cn } from "@/lib/utils"

type SpinnerSize = "sm" | "md" | "lg"

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

export function LoadingSpinner({
  size = "md",
  className,
  "aria-label": ariaLabel = "Loading",
}: {
  size?: SpinnerSize
  className?: string
  "aria-label"?: string
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground",
          sizeMap[size],
        )}
      />
      <span className="sr-only">{ariaLabel}</span>
    </span>
  )
}

export default LoadingSpinner
