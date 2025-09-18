"use client"
import { useState } from "react"
import { Bell, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem } from "@/data/navigation"
import { Breadcrumbs } from "./Breadcrumbs"
import { NotificationsPopup } from "./Notification-popup"

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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

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

            {/* Search and notification */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Type here..."
                className="h-9 w-32 sm:w-40 md:w-52 rounded-full bg-white pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                data-cy="search-input"
              />
              </div>
                <button
                className="relative rounded-full p-1 text-white hover:bg-emerald-600/30"
                data-cy="notification-button"
                onClick={toggleNotifications}
                >
                <Bell className="h-5 w-5 text-white fill-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                </button>

              {/* Notifications popup */}
              {showNotifications && (
                <div className="absolute right-4 top-14 z-50">
                  <NotificationsPopup onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
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

