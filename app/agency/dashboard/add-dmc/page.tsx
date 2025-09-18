"use client"
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer"
import { DMCRegistrationForm } from "@/app/agency/dashboard/add-dmc/add-dmc"
import { DMCTable } from "@/app/agency/dashboard/add-dmc/dmc-table"
import { useState, useEffect } from "react"
import { DMCFormProvider } from "@/context/dmc-form-context"

export default function Home() {
  // Track sidebar expanded state to match the layout
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

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

      {/* Main content with padding to account for fixed header */}
      <DMCFormProvider>
      <main className="flex-1 pt-16 overflow-x-hidden">
        <div className="max-w-full mx-auto space-y-8 bg-gray-50/50 p-4 sm:p-6 rounded-lg">
          <DMCRegistrationForm />
          <DMCTable />

          <div className="text-xs text-gray-500 mt-8">
            © 2025, Made by <span className="text-emerald-500">Trekking Miles</span>.
          </div>
        </div>
      </main>
      </DMCFormProvider>
    </div>
  )
}
