"use client";
import React, { Suspense } from "react";
import BreadcrumbDemo from "@/app/teamlead/dashboard/breadcrumbs-tab/breadcrumbs-tab";

import KashmirBookingDashboard from "@/app/teamlead/dashboard/booking-details/booking";

export default function Enquiry() {
  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      {/* Wrap the EnquiryStatusDemo component in a Suspense boundary.
        This tells Next.js to wait for the client to render this part,
        preventing the 'useSearchParams' error during server prerendering.
      */}
      <Suspense fallback={<div>Loading...</div>}>
       
      </Suspense>
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo />
      </div>
      <div className="w-full">
        <KashmirBookingDashboard />
      </div>
    </div>
  );
}