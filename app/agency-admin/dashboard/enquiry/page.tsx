"use client";

import Enquirysection from "@/app/agency-admin/dashboard/enquiry/enquiry-section";
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer";

export default function Enquiry() {
  return (
    <div className="w-full  h-screen bg-gray-50 mx-auto">
      <div className="z-0 relative">
        <TopBarContainer />
      </div>
      <div className="h-screen max-w-[calc(100vw-310px)]  overflow-hidden  w-full min-h-screen">
        <Enquirysection />
      </div>
    </div>
  );
}
