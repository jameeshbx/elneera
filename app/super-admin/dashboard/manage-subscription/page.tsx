"use client"

import { useState, useEffect } from "react"

import { SubscriptionTable } from "./manage-subscription"
import { fetchSubscriptions } from "./subscription-service"
import { SubscriptionData } from "@/actions/manage-subscription"
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer"

export default function ManageSubscription() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        setLoading(true)
        const data = await fetchSubscriptions({})
        setSubscriptions(data.subscriptions)
      } catch (error: unknown) {
        console.error("Error loading subscriptions:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load subscriptions"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadSubscriptions()
  }, [])

  // Listen for sidebar state changes from localStorage or custom events if needed
  useEffect(() => {
    const handleStorageChange = () => {
      const sidebarState = localStorage.getItem("sidebarExpanded")
      if (sidebarState) {
        setSidebarExpanded(sidebarState === "true")
      }
    }

    // Initial check
    handleStorageChange()

    // Listen for changes
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Topbar */}
      <div
        className={`fixed top-0 right-0 z-50 bg-white shadow-sm transition-all duration-300 ${
          sidebarExpanded ? "lg:left-64" : "lg:left-20"
        } left-16`}
      >
        <TopBarContainer />
      </div>

      <main
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarExpanded ? "lg:ml-64" : "lg:ml-20"
        } ml-16 mt-16`}
      >
        <div className="p-4 sm:p-6 lg:p-8 lg:pt-32 h-[calc(100vh-64px)] flex flex-col overflow-auto">
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <SubscriptionTable subscriptions={subscriptions} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
