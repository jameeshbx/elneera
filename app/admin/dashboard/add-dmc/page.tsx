"use client"

import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer"
import { DMCRegistrationForm } from "@/app/admin/dashboard/add-dmc/adminAdd-DMC"
import { DMCTable } from "@/app/admin/dashboard/add-dmc/dmc-table"
import { useState, useEffect } from "react"

export default function Home() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const handleStorageChange = () => {
      const sidebarState = localStorage.getItem("sidebarExpanded")
      if (sidebarState) {
        setSidebarExpanded(sidebarState === "true")
      }
    }

    handleStorageChange()
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleDMCAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div
        className={`fixed top-0 right-0 z-50 bg-white shadow-sm transition-all duration-300 ${
          sidebarExpanded ? "lg:left-64" : "lg:left-20"
        } left-16`}
      >
        <TopBarContainer />
      </div>

      <main className="flex-1 pt-16 overflow-x-hidden">
        <div className="max-w-full mx-auto space-y-8 bg-gray-50/50 p-4 sm:p-6 rounded-lg">
          <DMCRegistrationForm onDMCAdded={handleDMCAdded} />
          <DMCTable refreshTrigger={refreshTrigger} />
          <div className="text-xs text-gray-500 mt-8">
            © 2023, Made by <span className="text-emerald-500">Trekking Miles</span>.
          </div>
        </div>
      </main>
    </div>
  )
}
