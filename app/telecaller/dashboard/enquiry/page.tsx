"use client";
import Enquirysection from "./enquiry-section";
import { TopBar } from "@/app/telecaller/(components)/AgencyTopbar";

export default function Enquiry() {
  return (
    <div className="w-full  h-screen bg-gray-50 mx-auto">
      <div className="z-0 relative">
    <TopBar breadcrumbs={[]}/>
      </div>
      <div className="h-screen max-w-[calc(100vw-310px)]  overflow-hidden  w-full min-h-screen">
        <Enquirysection />
      </div>
    </div>
  );
}
