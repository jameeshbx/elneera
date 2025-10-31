"use client"

import { usePathname } from "next/navigation"
import { getNavigationData } from "@/data/navigation"
import { TopBar } from "@/app/agency/(components)/AgencyTopbar"

export function TopBarContainer() {
  const pathname = usePathname()
  const { breadcrumbs, title, subtitle } = getNavigationData(pathname)

  return (
    <TopBar 
      breadcrumbs={breadcrumbs} 
      title={title}
      subtitle={subtitle}
     
      // You can override the background image per route if needed
      backgroundImage={pathname.includes('dashboard') ? "/background/bg6.png" : "/background/bg6.png"}
    />
  )
}