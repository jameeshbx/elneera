import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600",
        destructive: "bg-white data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof checkboxVariants> {
  asChild?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "input"
    return (
      <Comp
        type="checkbox"
        className={cn(checkboxVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox, checkboxVariants }