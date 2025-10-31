"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/app/executive/(components)/Sidebar"
import { ColorProvider } from "@/context/color-context"

export default function ExecutiveDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarExpanded(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const sidebarWidth = isMobile ? "4rem" : sidebarExpanded ? "16rem" : "4rem"

  return (
    <ColorProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar 
          expanded={sidebarExpanded} 
          setExpanded={setSidebarExpanded}
        />
        
        <div 
          className="flex-1 flex flex-col transition-all duration-300 overflow-y-auto"
          style={{ marginLeft: sidebarWidth }}
        >
          {children}
        </div>
      </div>
    </ColorProvider>
  )
}