"use client"

import type React from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Edit3, FileText, Share, MessageSquare, CreditCard, Banknote, Download, ThumbsUp } from "lucide-react"
import { useEffect, useState } from "react"

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

interface EnquiryData {
  id: string
  name: string
  phone: string
  email: string
  locations: string
  tourType: string
  estimatedDates: string
  currency: string
  budget: number
  assignedStaff: string
  pointOfContact: string
  enquiryDate: string
}

const BreadcrumbNavigation = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [enquiryData, setEnquiryData] = useState<EnquiryData | null>(null)

  // Get URL parameters
  const enquiryId = searchParams.get("enquiryId")
  const itineraryId = searchParams.get("itineraryId")

  useEffect(() => {
    // Load enquiry data if enquiryId is available
    const loadEnquiryData = async () => {
      if (enquiryId) {
        try {
          const response = await fetch(`/api/enquiries?id=${enquiryId}`)
          if (response.ok) {
            const data = await response.json()
            setEnquiryData(data)
          }
        } catch (error) {
          console.error("Error loading enquiry data:", error)
        }
      }
    }

    loadEnquiryData()
  }, [enquiryId])

  // Create query params string for sharing

  const navigationItems: NavigationItem[] = [
    {
      id: "generate",
      label: "Generate Itinerary",
      icon: Edit3,
      path: `/agency/dashboard/Itenary-form${enquiryId ? `?enquiryId=${enquiryId}` : ""}`,
    },
    {
      id: "itineraries",
      label: "Itineraries",
      icon: FileText,
      path: `/agency/dashboard/Itenary-view${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
    {
      id: "share-customer",
      label: "Share to Customer",
      icon: Share,
      path: `/agency/dashboard/share-customer${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
    {
      id: "share-dmc",
      label: "Share to DMC",
      icon: MessageSquare,
      path: `/agency/dashboard/share-dmc${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
    {
      id: "customer-transaction",
      label: "Customer payment",
      icon: CreditCard,
      path: `/agency/dashboard/customer-payment${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
    {
      id: "dmc-payout",
      label: "DMC payment",
      icon: Banknote,
      path: `/agency/dashboard/dmc-payment${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
    {
      id: "booking-details",
      label: "Booking details",
      icon: Download,
      path: `/agency/dashboard/booking-details${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
    {
      id: "feedbacks",
      label: "Feedbacks",
      icon: ThumbsUp,
      path: `/agency/dashboard/feedback${enquiryId && itineraryId ? `?enquiryId=${enquiryId}&itineraryId=${itineraryId}` : ""}`,
    },
  ]

  // Determine active item based on current path
  const getActiveIndex = () => {
    return navigationItems.findIndex((item) => {
      const itemPath = item.path.split("?")[0] // Remove query params for comparison
      const pathSegment = itemPath.split("/").pop() || ""
      return pathname.includes(pathSegment)
    })
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="w-full sticky top-0 z-10 bg-white shadow-sm">
      <div className="w-full border-b border-gray-200">
        <div className="flex items-center overflow-x-auto scrollbar-hide px-4">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon
            const isActive = getActiveIndex() === index
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-all duration-200
                  relative group
                  ${
                    isActive
                      ? "border-gray-500 bg-gray-100 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? "text-gray-700" : "text-gray-400"}`} />
                <span>{item.label}</span>
                {isActive && <span className="absolute inset-x-1 -bottom-px h-0.5 bg-gray-500" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Optional: Display current enquiry info */}
      {enquiryData && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Enquiry: {enquiryData.name}</span>
            <span>•</span>
            <span>Locations: {enquiryData.locations}</span>
            <span>•</span>
            <span>
              Budget: {enquiryData.currency}
              {enquiryData.budget}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BreadcrumbNavigation
