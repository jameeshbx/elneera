"use client";
import React, { Suspense } from "react";
import BreadcrumbDemo from "@/app/executive/dashboard/breadcrumbs-tab/breadcrumbs-tab";

import TravelBookingInterface from "@/app/executive/dashboard/share-dmc/share-dmc";

export default function Enquiry() {
  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      {/* Wrap the component that causes the error in a Suspense boundary */}
      <Suspense fallback={<div>Loading...</div>}>
        
      </Suspense>
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo />
      </div>
      <div className="w-full">
        <TravelBookingInterface />
      </div>
    </div>
  );
}