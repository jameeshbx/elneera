"use client"

import { useSearchParams } from "next/navigation";
import DmcQuoteForm from "@/components/ui/dmcQuote-form";
import { Suspense } from "react";

// Create a separate component for the content that uses useSearchParams
function DmcQuoteContent() {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");
  const dmcId = searchParams.get("dmcId");
  

  return <DmcQuoteForm enquiryId={enquiryId} dmcId={dmcId} />;
}

// Main page component with Suspense boundary
export default function DmcQuotePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading DMC quote form...</div>}>
      <DmcQuoteContent />
    </Suspense>
  );
}