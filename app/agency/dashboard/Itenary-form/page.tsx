"use client"

import ItineraryGeneration from "./Itenary"
import BreadcrumbDemo from "../breadcrumbs-tab/breadcrumbs-tab"


export default function Enquiry() {
  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo/>
      </div>
      <div className="h-screen overflow-hidden max-w-[1200px] w-full min-h-screen">
        <ItineraryGeneration/>
      </div>
    </div>
  )
}