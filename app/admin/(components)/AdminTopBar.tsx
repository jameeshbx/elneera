"use client"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/data/navigation"
import { Breadcrumbs } from "./Breadcrumbs"

interface TopBarProps {
  breadcrumbs: BreadcrumbItem[]
  title?: string
  subtitle?: string
  className?: string
  backgroundImage?: string
}

export function TopBar({
  breadcrumbs,
  title,
  subtitle,
  className,
  backgroundImage = "/background/bg6.png?height=200&width=1920",
}: TopBarProps) {


  return (
    <div
      className={cn("w-full relative", className)}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Content container with relative positioning to appear above the background */}
      <div className="relative">
        {/* Top navigation bar */}
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbs} />

           
          </div>
        </div>

        <div className="px-4 pb-5 text-white sm:px-6">
          {title && (
            <h1
              className="text-base sm:text-lg md:text-xl font-semibold font-Nunito -mt-4 sm:-mt-6"
              data-cy="page-title"
            >
              {title}
            </h1>
          )}
        </div>

        {/* Remove duplicate title section */}
        <div className="px-4 sm:px-6 pb-5 pt-2 text-white">
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold font-Nunito" data-cy="page-title">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm opacity-80 font-Nunito" data-cy="page-subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

