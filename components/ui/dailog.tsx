import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = ({
  open,
  onOpenChange,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden",
          "animate-in fade-in-90 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("px-6 py-4 border-b flex items-center justify-between", className)}>
    {children}
  </div>
)

const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <h3 className={cn("text-lg font-semibold text-gray-900", className)}>{children}</h3>
)

const DialogClose = ({
  className,
}: {
  className?: string
}) => (
  <button
    className={cn(
      "rounded-full p-1 hover:bg-gray-100 transition-colors",
      "text-gray-500 hover:text-gray-700",
      className
    )}
  >
    <X className="h-5 w-5" />
  </button>
)

const DialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("p-6", className)}>{children}</div>
)

const DialogFooter = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("px-6 py-4 border-t flex justify-end gap-3", className)}>
    {children}
  </div>
)

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogContent,
  DialogFooter,
}