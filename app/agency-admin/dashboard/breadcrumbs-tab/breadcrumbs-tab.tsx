"use client"

import type React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Edit3, FileText, Share, MessageSquare,
  CreditCard, Banknote, Download, ThumbsUp,
  Menu, X
} from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [enquiryData, setEnquiryData] = useState<EnquiryData | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Get URL parameters
  const enquiryId = searchParams.get("enquiryId")
  const itineraryId = searchParams.get("itineraryId")

  useEffect(() => {
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

  const buildPath = (basePath: string, requireItineraryId: boolean = false) => {
    const params = new URLSearchParams()

    if (enquiryId) params.append('enquiryId', enquiryId)
    if (itineraryId && requireItineraryId) params.append('itineraryId', itineraryId)

    const queryString = params.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const navigationItems: NavigationItem[] = [
    {
      id: "generate",
      label: "Generate Itinerary",
      icon: Edit3,
      path: buildPath("/agency-admin/dashboard/Itenary-form"),
    },
    {
      id: "itineraries",
      label: "Itineraries",
      icon: FileText,
      path: buildPath("/agency-admin/dashboard/Itenary-view", true),
    },
    {
      id: "share-customer",
      label: "Share to Customer",
      icon: Share,
      path: buildPath("/agency-admin/dashboard/share-customer", true),
    },
    {
      id: "share-dmc",
      label: "Share to DMC",
      icon: MessageSquare,
      path: buildPath("/agency-admin/dashboard/share-dmc", true),
    },
    {
      id: "customer-transaction",
      label: "Customer Payment",
      icon: CreditCard,
      path: buildPath("/agency-admin/dashboard/customer-payment", true),
    },
    {
      id: "dmc-payout",
      label: "DMC Payment",
      icon: Banknote,
      path: buildPath("/agency-admin/dashboard/dmc-payment", true),
    },
    {
      id: "booking-details",
      label: "Booking Details",
      icon: Download,
      path: buildPath("/agency-admin/dashboard/booking-details", true),
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: ThumbsUp,
      path: buildPath("/agency-admin/dashboard/feedback", true),
    },
  ]

  const isActive = (path: string) => {
    return pathname.startsWith(path.split('?')[0])
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-lg font-medium text-gray-900 whitespace-nowrap">
                {enquiryData ?
                  <span className="hidden sm:inline">{enquiryData.name}&apos;s Booking</span> : <span className="hidden sm:inline">Booking&apos;s Dashboard</span>}
                <span className="sm:hidden">Menu</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-1 lg:space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`${active
                        ? "border-indigo-600 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.label.split(' ')[0]}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 bg-white shadow-lg">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={closeMobileMenu}
                className={`${active
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  } group flex items-center px-4 py-3 text-base font-medium border-l-4 ${active ? 'border-indigo-500' : 'border-transparent'
                  }`}
              >
                <Icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-500" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BreadcrumbNavigation