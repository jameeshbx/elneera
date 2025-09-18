"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BreadcrumbDemo from "../breadcrumbs-tab/breadcrumbs-tab";

import PaymentOverviewForm from "./customer";

export default function CustomerPayment() {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId") ?? "";
  const customerId = searchParams.get("customerId") ?? "";

  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      {/* Wrap EnquiryStatusDemo in a Suspense boundary to prevent server-side rendering errors. */}
      <Suspense fallback={<div>Loading...</div>}>
       
      </Suspense>
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo />
      </div>
      <div className="w-full">
        <PaymentOverviewForm enquiryId={enquiryId} customerId={customerId} />
      </div>
    </div>
  );
}