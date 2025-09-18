"use client";
import React, { Suspense } from "react";
import BreadcrumbDemo from "../breadcrumbs-tab/breadcrumbs-tab";

import DMCPaymentInterface from "./dmc-payment";

export default function Enquiry() {
  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      {/* Wrap EnquiryStatusDemo in a Suspense boundary to prevent server-side rendering errors. */}
      <Suspense fallback={<div>Loading...</div>}>
      
      </Suspense>
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo />
      </div>
      <div className="w-full">
        <DMCPaymentInterface />
      </div>
    </div>
  );
}