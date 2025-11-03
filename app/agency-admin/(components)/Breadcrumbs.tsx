"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useColor } from "@/context/color-context"

export interface BreadcrumbItem {
  label: string
  href: string
  active?: boolean
  searchParams?: Record<string, string>
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  isLightBackground?: boolean
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const { isLightColor, landingPageColor } = useColor()
  
  // Helper function to build URL with search params
  const buildUrl = (baseUrl: string, searchParams?: Record<string, string>) => {
    if (!searchParams || Object.keys(searchParams).length === 0) return baseUrl
    
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const href = buildUrl(item.href, item.searchParams)
        
        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight 
                className={cn(
                  "h-4 w-4 mx-2",
                  isLightColor ? "text-gray-500" : "text-gray-300"
                )} 
                aria-hidden="true" 
              />
            )}
            {isLast ? (
              <span 
                className={cn(
                  "font-medium",
                  isLightColor ? "text-gray-700" : "text-white",
                  landingPageColor ? `text-${landingPageColor}-600` : ""
                )}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={href}
                className={cn(
                  "hover:underline transition-colors",
                  isLightColor ? "text-gray-600 hover:text-gray-900" : "text-gray-300 hover:text-white",
                  landingPageColor ? `text-${landingPageColor}-500 hover:text-${landingPageColor}-700` : ""
                )}
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}