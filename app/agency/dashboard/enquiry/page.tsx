"use client";

import { TopBar } from "../../(components)/AgencyTopbar";
import Enquirysection from "./enquiry-section";

export default function Enquiry() {
  return (
    <div className="w-full  h-screen bg-gray-50 mx-auto">
      <div className="z-0 relative">
        <TopBar breadcrumbs={[]} title="Enquiry" subtitle="Enquiry" />
      </div>
      <div className="h-screen max-w-[calc(100vw-310px)]  overflow-hidden  w-full min-h-screen">
        <Enquirysection />
      </div>
    </div>
  );
}
