"use client"

import Link from "next/link"
import type React from "react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Session } from "next-auth"

type MenuItem = {
  title: string
  href: string
  icon: React.ReactNode
  isDropdown?: boolean
  dropdownItems?: {
    name: string
    href: string
    logo?: React.ReactNode
  }[]
}

type SidebarProps = {
  expanded?: boolean
  setExpanded?: (value: boolean) => void
  onToggleExpanded?: () => void
  profileData?: {
    name: string
    email: string
    bio: string
    fullName: string
    mobile: string
    location: string
    image?: string
  } | null
}

interface CompanyInformation {
  name: string
  logoUrl: string | null
  landingPageColor: string
}

const Sidebar = ({ expanded: externalExpanded, setExpanded, profileData: initialProfileData }: SidebarProps) => {
  const pathname = usePathname()
  const [reportsOpen, setReportsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { data: session } = useSession()
  const [companyData, setCompanyData] = useState<CompanyInformation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logoKey, setLogoKey] = useState(Date.now())
  const [themeColor, setThemeColor] = useState("#4ECDC4")
  const [profileData, setProfileData] = useState(initialProfileData)
  const [profileImageKey, setProfileImageKey] = useState(Date.now())

  
  // Internal expanded state for when no external control is provided
  const [internalExpanded, setInternalExpanded] = useState(true)
  
  // Use external expanded state if provided, otherwise use internal
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded
  const [, setLogoError] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

 
  useEffect(() => {
  const fetchCompanyData = async () => {
    try {
      // Wait for session to be available
      if (!session) {
        console.log('No session available yet')
        return
      }

let userId = (session.user as Session['user'] & { id?: string })?.id;

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
        } catch{
          console.warn('whoami fetch error')
        }
      }

      if (!userId) {
        // Fallback: Try to fetch company data without userId
        const fallbackRes = await fetch('/api/auth/agency-profile-admin', {
          credentials: 'include'
        })
        
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          const landingPageColor = fallbackData?.companyInformation?.landingPageColor || '#4ECDC4'
          setThemeColor(landingPageColor)
          document.documentElement.style.setProperty('--theme-color', landingPageColor)
          document.documentElement.style.setProperty('--theme-color-light', `${landingPageColor}20`)
          document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(landingPageColor, -20))
            // Notify other components about the theme change
            try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: landingPageColor } })) } catch{}
            // Notify other components about logo (if present)
            try { window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logoUrl: fallbackData?.companyInformation?.logo || null, name: fallbackData?.companyInformation?.name || null } })) } catch  {}
          
          const logoUrl = fallbackData?.companyInformation?.logo || null
          setCompanyData({ 
            name: fallbackData?.companyInformation?.name || 'Team Lead', 
            logoUrl: logoUrl, 
            landingPageColor 
          })
          setLogoError(false)
          
          if (fallbackData?.profileData) {
            setProfileData({
              name: fallbackData.profileData.name,
              email: fallbackData.profileData.email,
              bio: fallbackData.profileData.bio || '',
              fullName: fallbackData.profileData.fullName,
              mobile: fallbackData.profileData.mobile,
              location: fallbackData.profileData.location,
              image: fallbackData.profileData.avatarUrl
            })
          }
        }
        setIsLoading(false)
        return
      }

      // 1) Fetch team lead details to get agencyId
      const teamLeadRes = await fetch(`/api/auth/agency-add-user/${userId}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!teamLeadRes.ok) {
        throw new Error(`Team lead fetch failed: ${teamLeadRes.status}`)
      }

      const teamLead = await teamLeadRes.json()

      // Expecting agencyId in the returned payload
      const agencyId = teamLead.agencyId || teamLead.data?.agencyId
      
      if (!agencyId) {
        console.warn('No agencyId found for team lead, falling back to session-based agency-profile-admin')
        const fbRes = await fetch('/api/auth/agency-profile-admin', { credentials: 'include' })
        if (!fbRes.ok) throw new Error(`Fallback profile fetch failed: ${fbRes.status}`)
        const fallbackData = await fbRes.json()
        const landingPageColor = fallbackData?.companyInformation?.landingPageColor || '#4ECDC4'
        setThemeColor(landingPageColor)
        document.documentElement.style.setProperty('--theme-color', landingPageColor)
        document.documentElement.style.setProperty('--theme-color-light', `${landingPageColor}20`)
        document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(landingPageColor, -20))
        
        const logoUrl = fallbackData?.companyInformation?.logo || null
        setCompanyData({ 
          name: fallbackData?.companyInformation?.name || 'Team Lead', 
          logoUrl: logoUrl, 
          landingPageColor 
        })
        setLogoError(false)
        
        if (fallbackData?.profileData) {
          setProfileData({
            name: fallbackData.profileData.name,
            email: fallbackData.profileData.email,
            bio: fallbackData.profileData.bio || '',
            fullName: fallbackData.profileData.fullName,
            mobile: fallbackData.profileData.mobile,
            location: fallbackData.profileData.location,
            image: fallbackData.profileData.avatarUrl
          })
        }
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

      const landingPageColor = agencyData?.companyInformation?.landingPageColor || "#4ECDC4"
      setThemeColor(landingPageColor)
      document.documentElement.style.setProperty('--theme-color', landingPageColor)
      document.documentElement.style.setProperty('--theme-color-light', `${landingPageColor}20`)
      document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(landingPageColor, -20))
      // Notify other components about the theme change
      try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: landingPageColor } })) } catch {}

      const companyLogo = agencyData?.companyInformation?.logo || null
      setCompanyData({
        name: agencyData?.companyInformation?.name || 'Team Lead',
        logoUrl: companyLogo,
        landingPageColor
      })
      setLogoError(false) // Reset error state when new logo is loaded
      
      // Broadcast logo and theme updates so header and other components can react
      try { window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { logoUrl: companyLogo, name: agencyData?.companyInformation?.name || null } })) } catch  {}
      try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: landingPageColor } })) } catch {}

      if (agencyData?.profileData) {
        setProfileData({
          name: agencyData.profileData.name,
          email: agencyData.profileData.email,
          bio: agencyData.profileData.bio || '',
          fullName: agencyData.profileData.fullName,
          mobile: agencyData.profileData.mobile,
          location: agencyData.profileData.location,
          image: agencyData.profileData.avatarUrl
        })
      }

    } catch  {
      // Silently handle errors without console.error to prevent unhandled error warnings
      // Fallback to default color
      const fallbackColor = "#4ECDC4"
      setThemeColor(fallbackColor)
      document.documentElement.style.setProperty('--theme-color', fallbackColor)
      document.documentElement.style.setProperty('--theme-color-light', `${fallbackColor}20`)
      document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(fallbackColor, -20))
      // Notify other components about the theme change
      try { window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { color: fallbackColor } })) } catch {}
    } finally {
      setIsLoading(false)
    }
  }

  // Only run when session is available
  if (session) {
    fetchCompanyData()
  }
}, [session])


  // Listen for logo updates from profile page AND agency form
  useEffect(() => {
    const handleLogoUpdate = (event: CustomEvent) => {
      console.log('Logo updated event received:', event.detail)
      if (event.detail?.logoUrl) {
        setCompanyData(prev => prev ? {
          ...prev,
          logoUrl: event.detail.logoUrl
        } : null)
        setLogoKey(Date.now())
        setLogoError(false)
      }
    }

    const handleThemeUpdate = (event: CustomEvent) => {
      console.log('Theme updated event received:', event.detail)
      if (event.detail?.color) {
        setThemeColor(event.detail.color)
        setCompanyData(prev => prev ? {
          ...prev,
          landingPageColor: event.detail.color
        } : null)
        
        document.documentElement.style.setProperty('--theme-color', event.detail.color)
        document.documentElement.style.setProperty('--theme-color-light', event.detail.color + '20')
        document.documentElement.style.setProperty('--theme-color-dark', adjustBrightness(event.detail.color, -20))
      }
    }

    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile updated event received:', event.detail)
      if (event.detail?.profileData) {
        setProfileData({
          name: event.detail.profileData.name,
          email: event.detail.profileData.email,
          bio: event.detail.profileData.bio || '',
          fullName: event.detail.profileData.fullName,
          mobile: event.detail.profileData.mobile,
          location: event.detail.profileData.location,
          image: event.detail.profileData.avatarUrl
        })
        setProfileImageKey(Date.now())
      }
    }

    window.addEventListener('logoUpdated', handleLogoUpdate as EventListener)
    window.addEventListener('themeUpdated', handleThemeUpdate as EventListener)
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate as EventListener)
      window.removeEventListener('themeUpdated', handleThemeUpdate as EventListener)
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

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

  const toggleReports = () => {
    setReportsOpen(!reportsOpen)
  }

  // Toggle function that works with both internal and external state
  const toggleSidebar = () => {
  if (setExpanded) {
    setExpanded(!expanded)
  } else {
    setInternalExpanded(!expanded)
  }
}

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/teamlead/dashboard",
      icon: <Image src="/dash.svg" alt="Dashboard" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Enquiries",
      href: "/teamlead/dashboard/enquiry",
      icon: <Image src="/login.svg" alt="Enquiries" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Flights",
      href: "/teamlead/dashboard/flights",
      icon: <Image src="/flight.png" alt="Flights" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Accommodation",
      href: "/teamlead/dashboard/accomadation",
      icon: <Image src="/sleep.png" alt="Accommodation" width={20} height={20} className="min-w-[20px]" />,
    },
    {
      title: "Reports",
      href: "/teamlead/dashboard/reports",
      icon: (
        <Image
          src="/subscription.svg"
          alt="Reports"
          width={20}
          height={20}
          className="min-w-[20px]"
        />
      ),
      isDropdown: true,
      dropdownItems: [
        {
          name: "Bookings",
          href: "/teamlead/dashboard/reports/recent-booking",
          logo: <Image src="/dmcagency.svg" alt="Bookings" width={16} height={16} className="mr-2 min-w-[16px]" />,
        },
        {
          name: "Revenue by Destinations",
          href: "/teamlead/dashboard/reports/revenue-destination",
          logo: (
            <Image
              src="/dmcagency.svg"
              alt="Revenue by Destinations"
              width={16}
              height={16}
              className="mr-2 min-w-[16px]"
            />
          ),
        },
        {
          name: "Revenue by DMC",
          href: "/teamlead/dashboard/reports/revenue-dmc",
          logo: (
            <Image src="/dmcagency.svg" alt="Revenue by DMC" width={16} height={16} className="mr-2 min-w-[16px]" />
          ),
        },
      ],
    },
    
    {
      title: "Add DMC",
      href: "/teamlead/dashboard/add-dmc",
      icon: <Image src="/Vector.svg" alt="Add DMC" width={20} height={20} className="min-w-[20px]" />,
    },
  ]

  // Resolve image path (handles absolute, prefixed, and uploads)
  const resolveImage = (path: string | null | undefined) => {
    if (!path) return undefined
    if (path.startsWith('http')) return path
    if (path.startsWith('/')) return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${path}`
    return `${process.env.NEXT_PUBLIC_BASE_URL || ''}/uploads/${path}`
  }

  const accountItems = [
    {
      title: profileData?.name || session?.user?.name || "Profile",
      href: "/teamlead/dashboard/profile",
      icon: (
        <Image
          key={`profile-${profileImageKey}`}
          src={resolveImage(profileData?.image) || resolveImage(session?.user?.image) || "/avatar/Image (3).png"}
          alt="Profile"
          width={20}
          height={20}
          className="min-w-[20px] rounded-full object-cover"
        />
      ),
    },
    {
      title: "Settings",
      href: "/teamlead/dashboard/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Logout",
      href: "#",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ]

const isCollapsed = isMobile ? !expanded : !expanded

  const getLogoUrl = (logoPath: string | null | undefined) => {
    if (!logoPath) return null
    
    if (logoPath.startsWith('http')) {
      return logoPath
    }
    
    if (logoPath.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${logoPath}`
    }
    
    return `${process.env.NEXT_PUBLIC_BASE_URL || ''}/uploads/${logoPath}`
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 h-full bg-white shadow-lg transition-all duration-300 ${
        isMobile ? "w-16" : expanded ? "w-64" : "w-16"
      }`}
      data-cy="sidebar"
    >
      {/* Toggle Button - Only show on desktop */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-50 flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      )}

      <div className="flex flex-col h-full p-2 md:p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Logo Section */}
       <div className="flex items-center p-2 mb-6">
                 <Link href="/" data-cy="sidebar-logo-link" className="flex items-center w-full">
                   {isLoading ? (
                     <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                   ) : (
                     <>
                       {companyData?.logoUrl ? (
                         <div className="flex items-center w-full">
                           <Image
                             key={`${logoKey}-${companyData.logoUrl}`}
                             src={getLogoUrl(companyData.logoUrl) || '/placeholder.svg?height=32&width=120'}
                             alt="Company Logo"
                             width={isCollapsed ? 32 : 120}
                             height={isCollapsed ? 32 : 32}
                             className="object-contain max-w-full h-8"
                             priority
                             onError={(e) => {
                               console.error('Error loading logo:', companyData.logoUrl)
                               e.currentTarget.style.display = 'none'
                               const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback')
                               if (fallback) fallback.classList.remove('hidden')
                             }}
                           />
                           <div className="logo-fallback hidden">
                             <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                               <span className="text-xs font-medium text-gray-500">
                                 {companyData?.name?.charAt(0)?.toUpperCase() || 'LOGO'}
                               </span>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                           <span className="text-xs font-medium text-gray-500">
                             {companyData?.name?.charAt(0)?.toUpperCase() || 'LOGO'}
                           </span>
                         </div>
                       )}
                       {!isCollapsed && !companyData?.logoUrl && (
                         <span className="ml-2 text-lg font-semibold">
                           {companyData?.name || 'Agency'}
                         </span>
                       )}
                     </>
                   )}
                 </Link>
               </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <div key={item.href}>
              {item.isDropdown ? (
                <div className="relative">
                  <button
                    onClick={toggleReports}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center w-full ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors ${
                      pathname.startsWith("/teamlead/dashboard/reports")
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor: pathname.startsWith("/teamlead/dashboard/reports") ? themeColor : 'transparent'
                    }}
                    data-cy={`sidebar-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="text-sm md:text-base font-medium">{item.title}</span>
                        <svg
                          className={`w-4 h-4 ml-auto transition-transform ${reportsOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {reportsOpen && !isCollapsed && (
                    <div className="ml-6 md:ml-8 mt-1 space-y-1">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-lg ${
                            pathname === dropdownItem.href
                              ? "text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          style={{
                            backgroundColor: pathname === dropdownItem.href ? themeColor : 'transparent'
                          }}
                          data-cy={`sidebar-dropdown-item-${dropdownItem.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {dropdownItem.logo}
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors relative ${
                    pathname === item.href ? "text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  style={{
                    backgroundColor: pathname === item.href ? themeColor : 'transparent'
                  }}
                  data-cy={`sidebar-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                  {!isCollapsed && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                  {(isMobile || isCollapsed) && hoveredItem === item.title && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </Link>
              )}
            </div>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-200">
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">ACCOUNT PAGES</h3>
            )}
            <div className="space-y-2">
              {accountItems.map((item) =>
                item.title === "Logout" ? (
                  <button
                    key={item.href}
                    onClick={item.onClick}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center w-full ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors text-gray-700 hover:bg-gray-100 relative`}
                    data-cy={`sidebar-account-item-${item.title.toLowerCase()}`}
                  >
                    <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!isCollapsed && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                    {(isMobile || isCollapsed) && hoveredItem === item.title && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                        {item.title}
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center ${isCollapsed ? "justify-center p-3" : "p-2 md:p-3"} rounded-lg transition-colors text-gray-700 hover:bg-gray-100 relative`}
                    data-cy={`sidebar-account-item-${item.title.toLowerCase()}`}
                  >
                    <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!isCollapsed && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                    {(isMobile || isCollapsed) && hoveredItem === item.title && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                        {item.title}
                      </div>
                    )}
                  </Link>
                ),
              )}
            </div>
          </div>
        </nav>
 
        {!isCollapsed && (
          <div className="p-2 md:p-3 mt-auto">
            <Image
              src="/Background.svg"
              alt="background"
              width={218}
              height={250}
              className="w-full mt-4 md:mt-6"
            />
            <div className="p-2 md:p-3 bg-gray-50 rounded-lg mt-[-120px] md:mt-[-160px]">
              <Image
                src="/Icon.svg"
                alt="help icon"
                width={28}
                height={28}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <h4 className="mt-1 md:mt-2 mb-0 md:mb-1 text-xs md:text-[15px] text-white font-poppins">
                Need help?
              </h4>
              <p className="mb-1 md:mb-2 text-[11px] md:text-[13px] text-white font-poppins">
                Please check our docs
              </p>
              <button 
                className="w-full px-2 py-1 md:px-3 md:py-2 text-xs md:text-[13px] text-center text-white font-poppins rounded-md transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                DOCUMENTATION
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar