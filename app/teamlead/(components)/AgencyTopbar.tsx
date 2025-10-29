"use client"
import { useState, useEffect } from "react"
import { Bell, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/data/navigation"
import { Breadcrumbs } from "@/app/agency-admin/(components)/Breadcrumbs"
import { useSession } from "next-auth/react"

interface TopBarProps {
  breadcrumbs: BreadcrumbItem[]
  title?: string
  subtitle?: string
  className?: string
  backgroundImage?: string
}

interface CompanyInformation {
  name: string
  logoUrl: string | null
  landingPageColor: string
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
  const [, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const [, setCompanyData] = useState<CompanyInformation | null>(null)

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

  const checkIfLightColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    setIsLightColor(luminance > 0.5)
  }

  // Fetch company data - exact same logic as Sidebar
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        // Wait for session to be available
        if (!session) {
          console.log('No session available yet')
          return
        }

         let userId = session.user.id;
        // If session didn't include id, ask server for it
        if (!userId) {
          try {
            const whoami = await fetch('/api/auth/whoami', { credentials: 'include' })
            if (whoami.ok) {
              const body = await whoami.json()
              if (body?.success && body?.id) {
                userId = body.id
              }
            } else {
              console.warn('whoami lookup failed:', whoami.status)
            }
          } catch {
            console.warn('whoami fetch error')
          }
        }

        if (!userId) {
          console.error('User ID not found in session nor via whoami. Session data:', session)
          // Fallback: Try to fetch company data without userId
          const fallbackRes = await fetch('/api/auth/agency-profile-admin', {
            credentials: 'include'
          })
          
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json()
            const landingPageColor = fallbackData?.companyInformation?.landingPageColor || '#4ECDC4'
            setThemeColor(landingPageColor)
            checkIfLightColor(landingPageColor)
            document.documentElement.style.setProperty('--theme-color', landingPageColor)
            document.documentElement.style.setProperty('--theme-color-light', `${landingPageColor}20`)
            document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(landingPageColor, -20))
            // Notify other components about the theme change
            try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: landingPageColor } })) } catch  {}
            
            setCompanyData({ 
              name: fallbackData?.companyInformation?.name || 'Team Lead', 
              logoUrl: fallbackData?.companyInformation?.logo || null, 
              landingPageColor 
            })
          }
          setIsLoading(false)
          return
        }

        console.log('Fetching data for userId:', userId)

        // 1) Fetch team lead details to get agencyId
        const teamLeadRes = await fetch(`/api/auth/agency-add-user/${userId}`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!teamLeadRes.ok) {
          throw new Error(`Team lead fetch failed: ${teamLeadRes.status}`)
        }

        const teamLead = await teamLeadRes.json()
        console.log('Team Lead details:', teamLead)

        // Expecting agencyId in the returned payload
        const agencyId = teamLead.agencyId || teamLead.data?.agencyId
        
        if (!agencyId) {
          console.warn('No agencyId found for team lead, falling back to session-based agency-profile-admin')
          const fbRes = await fetch('/api/auth/agency-profile-admin', { credentials: 'include' })
          if (!fbRes.ok) throw new Error(`Fallback profile fetch failed: ${fbRes.status}`)
          const fallbackData = await fbRes.json()
          const landingPageColor = fallbackData?.companyInformation?.landingPageColor || '#4ECDC4'
          setThemeColor(landingPageColor)
          checkIfLightColor(landingPageColor)
          document.documentElement.style.setProperty('--theme-color', landingPageColor)
          document.documentElement.style.setProperty('--theme-color-light', `${landingPageColor}20`)
          document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(landingPageColor, -20))
          // Notify other components about the theme change
          try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: landingPageColor } })) } catch  {}
          
          setCompanyData({ 
            name: fallbackData?.companyInformation?.name || 'Team Lead', 
            logoUrl: fallbackData?.companyInformation?.logo || null, 
            landingPageColor 
          })
          setIsLoading(false)
          return
        }

        // 2) Fetch agency admin details using agencyId
        const agencyRes = await fetch(`/api/auth/agency-profile-admin?agencyId=${agencyId}`, {
          method: 'GET',
          credentials: 'include'
        })

        if (!agencyRes.ok) {
          throw new Error(`Agency profile fetch failed: ${agencyRes.status}`)
        }

        const agencyData = await agencyRes.json()
        console.log('Agency admin data:', agencyData)

        const landingPageColor = agencyData?.companyInformation?.landingPageColor || "#4ECDC4"
        setThemeColor(landingPageColor)
        checkIfLightColor(landingPageColor)
        document.documentElement.style.setProperty('--theme-color', landingPageColor)
        document.documentElement.style.setProperty('--theme-color-light', `${landingPageColor}20`)
        document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(landingPageColor, -20))
        // Notify other components about the theme change
        try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: landingPageColor } })) } catch{}

        setCompanyData({
          name: agencyData?.companyInformation?.name || 'Team Lead',
          logoUrl: agencyData?.companyInformation?.logo || null,
          landingPageColor
        })

      } catch {
        console.error('Error fetching company data:')
        // Fallback to default color
        const fallbackColor = "#4ECDC4"
        setThemeColor(fallbackColor)
        checkIfLightColor(fallbackColor)
        document.documentElement.style.setProperty('--theme-color', fallbackColor)
        document.documentElement.style.setProperty('--theme-color-light', `${fallbackColor}20`)
        document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(fallbackColor, -20))
        // Notify other components about the theme change
        try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: fallbackColor } })) } catch  {}
      } finally {
        setIsLoading(false)
      }
    }

    // Only run when session is available
    if (session) {
      fetchCompanyData()
    }
  }, [session])

  // Listen for theme updates from Sidebar or other components
  useEffect(() => {
    const handleThemeUpdate = (event: CustomEvent) => {
      console.log('TopBar: themeUpdated event received:', event.detail)
      if (event.detail?.color) {
        setThemeColor(event.detail.color)
        checkIfLightColor(event.detail.color)
        setCompanyData(prev => prev ? {
          ...prev,
          landingPageColor: event.detail.color
        } : null)
        
        document.documentElement.style.setProperty('--theme-color', event.detail.color)
        document.documentElement.style.setProperty('--theme-color-light', event.detail.color + '20')
        document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(event.detail.color, -20))
      }
    }

    window.addEventListener('themeUpdated', handleThemeUpdate as EventListener)
    
    return () => {
      window.removeEventListener('themeUpdated', handleThemeUpdate as EventListener)
    }
  }, [])

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