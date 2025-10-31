"use client"
import { useState, useEffect } from "react"
import { Bell, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/data/navigation"
import { Breadcrumbs } from "@/app/agency-admin/(components)/Breadcrumbs"

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
  const [themeColor, setThemeColor] = useState("#4ECDC4")
  const [isLightColor, setIsLightColor] = useState(false)

  const adjustBrightness = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  // Listen for theme updates from Sidebar
  useEffect(() => {
    const handleThemeUpdate = (event: CustomEvent) => {
      console.log('TopBar - Theme updated event received:', event.detail);
      if (event.detail?.color) {
        const newColor = event.detail.color;
        setThemeColor(newColor);
        checkIfLightColor(newColor);
        
        // Update CSS variables to match the new theme
        document.documentElement.style.setProperty('--theme-color', newColor);
        document.documentElement.style.setProperty('--theme-color-light', `${newColor}20`);
        document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(newColor, -20));
      }
    };

    // Add event listener for theme updates
    window.addEventListener('theme-updated', handleThemeUpdate as EventListener);

    // Initial theme setup from CSS variable or default
    const initialColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-color')
      .trim() || "#4ECDC4";
    
    if (initialColor !== "#4ECDC4") {
      setThemeColor(initialColor);
      checkIfLightColor(initialColor);
    }

    return () => {
      window.removeEventListener('theme-updated', handleThemeUpdate as EventListener);
    };
  }, []);

  const checkIfLightColor = (hexColor: string) => {
    // Remove # if present
    const hex = hexColor.replace('#', '')
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // If luminance is greater than 0.5, it's a light color
    setIsLightColor(luminance > 0.5)
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  // Create a gradient overlay with the selected color
  const overlayStyle = {
    background: `linear-gradient(135deg, ${themeColor}E6 0%, ${themeColor}CC 50%, ${themeColor}B3 100%)`,
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

        {/* Title section */}
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