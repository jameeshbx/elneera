"use client"

import { useSearchParams } from "next/navigation";
import FeedbackForm from "@/components/feedback-form";
import { Suspense } from "react";

// Create a separate component for the content that uses useSearchParams
function FeedbackContent() {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");

  return <FeedbackForm enquiryId={enquiryId} />;
}

// Main page component with Suspense boundary
export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading feedback form...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}