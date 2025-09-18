import * as React from "react"
import { cn } from "@/lib/utils"

const Card = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border shadow-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("px-6 py-4 border-b", className)}
      {...props}
    >
      {children}
    </div>
  )
}

const CardTitle = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn("text-lg font-semibold text-gray-900", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

const CardDescription = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

const CardContent = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}

const CardFooter = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("px-6 py-4 border-t", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }