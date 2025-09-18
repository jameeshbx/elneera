"use client"


import BreadcrumbDemo from "@/app/agency-admin/dashboard/breadcrumbs-tab/breadcrumbs-tab"

import TravelBookingSystem from "@/app/agency-admin/dashboard/feedback/feedback"

export default function Enquiry() {
  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo/>
      </div>
      <div className="h-screen overflow-hidden max-w-[1200px] w-full min-h-screen">
      <TravelBookingSystem/>
      </div>
    </div>
  )
}