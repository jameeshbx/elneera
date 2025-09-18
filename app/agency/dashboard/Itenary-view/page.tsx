
"use client";
import React, { Suspense } from "react";
import BreadcrumbDemo from "../breadcrumbs-tab/breadcrumbs-tab";


import ItineraryView from "@/app/agency/dashboard/Itenary-view/Itenary-view";

export default function Enquiry() {
  return(
   <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading itinerary...</p>
          </div>
        </div>
      }
    >
      <div className="w-full  h-screen bg-gray-50 mx-auto">
      
      <div className=" max-w-[1200px] w-full ">
        <BreadcrumbDemo/>
        </div>
        <div>
      <ItineraryView />
      </div>
      </div>
    </Suspense>

  )
}





