"use client"
import { useEffect, useState } from "react"
import { Bell, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/data/navigation"
import { Breadcrumbs } from "@/app/agency-admin/(components)/Breadcrumbs"
import { useColor } from "@/context/color-context"

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
  const [showNotifications, setShowNotifications] = useState(false)
  const { landingPageColor, isLightColor } = useColor()

  // Keep a local color state that falls back to the CSS var when context is not updated
  const getCssThemeColor = () => {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue('--theme-color') || landingPageColor
    } catch {
      return landingPageColor
    }
  }

  const [currentColor, setCurrentColor] = useState<string>(() => getCssThemeColor() || "#4ECDC4")


  // Keep local color updated when context or CSS var changes (listen to themeUpdated events)
  useEffect(() => {
    setCurrentColor(landingPageColor || getCssThemeColor() || "#4ECDC4")
  }, [landingPageColor])

  useEffect(() => {
    const handleThemeUpdate = (event: Event) => {
      // prefer event.detail.color, fall back to CSS var
      const detail = (event as CustomEvent)?.detail
      const colorFromEvent = detail?.color
      const newColor = colorFromEvent || getCssThemeColor() || landingPageColor || "#4ECDC4"
      setCurrentColor(newColor.trim())
    }

    window.addEventListener('themeUpdated', handleThemeUpdate as EventListener)
    return () => window.removeEventListener('themeUpdated', handleThemeUpdate as EventListener)
  }, [landingPageColor])

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  // Create a gradient overlay with the selected color
  // Helper: convert 6-digit hex (#RRGGBB) to rgba string with alpha
  const hexToRgba = (hex: string, alpha = 1) => {
    try {
      const cleaned = hex.replace('#', '').trim()
      if (cleaned.length === 3) {
        // expand shorthand like #abc -> #aabbcc
        const r = cleaned[0] + cleaned[0]
        const g = cleaned[1] + cleaned[1]
        const b = cleaned[2] + cleaned[2]
        const full = r + g + b
        const intVal = parseInt(full, 16)
        const rVal = (intVal >> 16) & 255
        const gVal = (intVal >> 8) & 255
        const bVal = intVal & 255
        return `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`
      }
      const intVal = parseInt(cleaned.substring(0, 6), 16)
      const rVal = (intVal >> 16) & 255
      const gVal = (intVal >> 8) & 255
      const bVal = intVal & 255
      return `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`
    } catch  {
      // fallback: if landingPageColor isn't a hex string, return it as-is (with opacity applied via CSS if supported)
      return landingPageColor
    }
  }

  const overlayStyle = {
    background: `linear-gradient(135deg, ${hexToRgba(currentColor, 0.9)} 0%, ${hexToRgba(currentColor, 0.8)} 50%, ${hexToRgba(currentColor, 0.7)} 100%)`,
  }

  // Dynamic text colors based on background
  const textColor = isLightColor ? "text-gray-900" : "text-white"
  const iconColor = isLightColor ? "text-gray-700" : "text-white"
  const hoverBg = isLightColor ? "hover:bg-gray-200/30" : "hover:bg-white/20"

  return (
    <div
      className={cn("w-full relative overflow-hidden", className)}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Color overlay */}
      <div 
        className="absolute inset-0 z-10"
        style={overlayStyle}
      />
      
      {/* Content container with relative positioning to appear above the background */}
      <div className="relative z-20">
        {/* Top navigation bar */}
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbs} isLightBackground={isLightColor} />

            {/* Search and notification */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative block">
                <Search className={cn("absolute left-2.5 top-2.5 h-4 w-4", 
                  isLightColor ? "text-gray-500" : "text-gray-400"
                )} />
                <input
                  type="text"
                  placeholder="Type here..."
                  className={cn(
                    "h-9 w-32 sm:w-40 md:w-52 rounded-full pl-8 pr-4 text-sm focus:outline-none focus:ring-2",
                    isLightColor 
                      ? "bg-white/90 text-gray-900 placeholder:text-gray-500 focus:ring-gray-400" 
                      : "bg-white/95 text-gray-900 placeholder:text-gray-500 focus:ring-emerald-300"
                  )}
                  data-cy="search-input"
                />
              </div>
              
              <button
                className={cn(
                  "relative rounded-full p-1 transition-colors",
                  textColor,
                  hoverBg
                )}
                data-cy="notification-button"
                onClick={toggleNotifications}
              >
                <Bell className={cn("h-5 w-5", iconColor, isLightColor ? "fill-gray-700" : "fill-white")} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </button>

            
            </div>
          </div>
        </div>

        {/* Title section - removing duplicate */}
        <div className={cn("px-4 sm:px-6 pb-5 pt-2", textColor)}>
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold font-Nunito" data-cy="page-title">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className={cn(
              "mt-1 text-sm font-Nunito",
              isLightColor ? "text-gray-700" : "text-white/80"
            )} data-cy="page-subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}