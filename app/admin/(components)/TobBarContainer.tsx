"use client"

import { usePathname } from "next/navigation"
import { TopBar } from "./AdminTopBar"
import { getNavigationData } from "@/data/navigation"

export function TopBarContainer() {
  const pathname = usePathname()
  const { breadcrumbs, title, subtitle } = getNavigationData(pathname)

  return <TopBar breadcrumbs={breadcrumbs} title={title} subtitle={subtitle} />
}
