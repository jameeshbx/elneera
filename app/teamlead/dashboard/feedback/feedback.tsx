"use client"

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Define the feedback data type
interface Feedback {
  id: string;
  createdAt: string;
  email: string;
  name: string;
  destination: string;
  dateRange: string;
  overallExperience: number;
  accommodationQuality: number;
  transportTransfers: number;
  serviceFromTeam: number;
  additionalComments?: string;
  travelAgain?: boolean;
}

interface EnquiryData {
  email: string;
  name: string;
}

const ratingMessages: Record<string, string> = {
  5: "Excellent",
  4: "Good",
  3: "Average",
  2: "Below Average",
  1: "Poor",
};

const ShareFeedbackForm = () => {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");
  const [shareMethod, setShareMethod] = useState("email");
  const [copied, setCopied] = useState(false);
  const [feedbackLink, setFeedbackLink] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnquiryDetails = async () => {
      try {
        if (!enquiryId) return;

        console.log(`Fetching enquiry details for ID: ${enquiryId}`);
        const response = await fetch(`/api/enquiries?id=${enquiryId}`);
        const data = await response.json();

        if (response.ok) {
          const enquiryData = data as EnquiryData;
          const dynamicFeedbackLink = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/feedback?enquiryId=${enquiryId}`;
          setFeedbackLink(dynamicFeedbackLink);
          setCustomerEmail(enquiryData.email);
          setCustomerName(enquiryData.name);
        } else {
          console.error("Failed to fetch enquiry details:", data.error);
        }
      } catch (error) {
        console.error("Error fetching enquiry details:", error);
      }
    };

    const fetchFeedbackData = async () => {
      try {
        // Add enquiryId parameter if you want specific feedback
        const url = enquiryId ? `/api/feedbacks?enquiryId=${enquiryId}` : '/api/feedbacks';
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          const feedbacks = data as Feedback[];
          setFeedbackData(feedbacks);
        } else {
          console.error("Failed to fetch feedback data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching feedback data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiryDetails();
    fetchFeedbackData();
  }, [enquiryId]);

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get rating text function
  const getRatingText = (rating: number) => {
    return `${rating} - ${ratingMessages[rating] || 'Unknown'}`;
  };

  const handleCopyLink = () => {
    if (feedbackLink) {
      navigator.clipboard.writeText(feedbackLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!customerEmail || !enquiryId) {
      alert("Customer email or enquiry ID is missing");
      return;
    }

    try {
      const response = await fetch("/api/send-feedback-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          enquiryId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert("Email sent successfully!");
      } else {
        console.error("Failed to send email:", data.error);
        alert("Failed to send email.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("An error occurred while sending the email.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            Share Feedback Form Link
          </h1>

          {/* Share Options */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Share via :</p>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="shareMethod"
                  value="email"
                  checked={shareMethod === "email"}
                  onChange={(e) => setShareMethod(e.target.value)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Email</span>
              </label>
            </div>

            <button
              onClick={handleSend}
              disabled={!customerEmail}
              className="bg-green-800 hover:bg-green-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>

          <div className="text-center text-gray-400 text-sm mb-6">or</div>

          {/* Copy Link Section */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Copy link</p>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <span className="text-sm text-gray-600 break-all">{feedbackLink || "Generating link..."}</span>
              </div>
              <button
                onClick={handleCopyLink}
                disabled={!feedbackLink}
                className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-black px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-green-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Feedback Responses</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Captured on
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Email Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Date of Trip
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Overall Experience
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Accommodation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Transport
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedbackData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No feedback responses yet.
                    </td>
                  </tr>
                ) : (
                  feedbackData.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {formatDate(feedback.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {feedback.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {feedback.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {feedback.destination}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {feedback.dateRange}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200">
                        {getRatingText(feedback.overallExperience)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200">
                        {getRatingText(feedback.accommodationQuality)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200">
                        {getRatingText(feedback.transportTransfers)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200">
                        {getRatingText(feedback.serviceFromTeam)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                        {feedback.additionalComments || "No comments"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareFeedbackForm;