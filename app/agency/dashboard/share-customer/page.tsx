"use client";
import React from "react";
import BreadcrumbDemo from "../breadcrumbs-tab/breadcrumbs-tab";

import ShareCustomerDashboard from "./share-customer";

export default function Enquiry() {
  return (
    <div className="w-full h-screen bg-gray-50 mx-auto">
      
      <div className="max-w-[1200px] w-full">
        <BreadcrumbDemo/>
      </div>
      <div className="w-full">
        <ShareCustomerDashboard/>
      </div>
    </div>
  );
}