"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {  useSearchParams } from "next/navigation"
import { Download, Plus, X, AlertCircle, CheckCircle, Clock, FileText, Eye, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"

import type {
  Customer,
  Itinerary,
  CustomerFeedback,
  SentItinerary,
  FormData,
  NewNote,
  CustomerDashboardData,
} from "@/types/customer"

const ShareCustomerDashboard = () => {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    whatsappNumber: "",
    notes: "",
    supportingDocument: null,
  })

  const [showAddNotePopup, setShowAddNotePopup] = useState(false)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [selectedPDFUrl, setSelectedPDFUrl] = useState<string | null>(null)
  const [newNote, setNewNote] = useState<NewNote>({
    title: "",
    description: "",
    type: "note",
    document: null,
  })

  const [, setSelectedCustomer] = useState<Customer | null>(null)
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [customerFeedbacks, setCustomerFeedbacks] = useState<CustomerFeedback[]>([])
  const [sentItineraries, setSentItineraries] = useState<SentItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [enquiryId, setEnquiryId] = useState<string | null>(null)
  const [itineraryId, setItineraryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingItinerary, setSendingItinerary] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [regeneratingPDF, setRegeneratingPDF] = useState<string | null>(null)
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null)
  const { toast } = useToast()

  // Keep URL and state in sync; restore from localStorage if URL lacks params
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId")
    const enquiryIdParam = searchParams.get("enquiryId")
    const itineraryIdParam = searchParams.get("itineraryId")

    if (customerIdParam || enquiryIdParam) {
      setCustomerId(customerIdParam)
      setEnquiryId(enquiryIdParam)
      setItineraryId(itineraryIdParam)
      fetchCustomerData(customerIdParam, enquiryIdParam, itineraryIdParam)
      // Persist context
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "shareCustomerContext",
          JSON.stringify({ customerId: customerIdParam, enquiryId: enquiryIdParam, itineraryId: itineraryIdParam })
        )
      }
      return
    }

    // Fallback to last context from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("shareCustomerContext")
        if (stored) {
          const ctx = JSON.parse(stored) as { customerId?: string | null; enquiryId?: string | null; itineraryId?: string | null }
          const restoreCustomerId = ctx.customerId || null
          const restoreEnquiryId = ctx.enquiryId || null
          const restoreItineraryId = ctx.itineraryId || null

          setCustomerId(restoreCustomerId)
          setEnquiryId(restoreEnquiryId)
          setItineraryId(restoreItineraryId)

          // Update URL to reflect restored context without adding history entry
          const params = new URLSearchParams()
          if (restoreCustomerId) params.set("customerId", restoreCustomerId)
          if (restoreEnquiryId) params.set("enquiryId", restoreEnquiryId)
          if (restoreItineraryId) params.set("itineraryId", restoreItineraryId)

          fetchCustomerData(restoreCustomerId, restoreEnquiryId, restoreItineraryId)
          return
        }
      } catch { }
    }

    setError("Either Customer ID or Enquiry ID is required")
    setLoading(false)
  }, [searchParams])

  // Add refresh handler
  const handleRefresh = () => {
    fetchCustomerData(customerId, enquiryId, itineraryId, true)
    toast({
      title: "Refreshing",
      description: "Fetching latest customer data...",
    })
  }

  // Listen for parameter changes and auto-refresh
  useEffect(() => {
    const handleParamChange = () => {
      const currentParams = new URLSearchParams(window.location.search)
      const newCustomerId = currentParams.get("customerId")
      const newEnquiryId = currentParams.get("enquiryId")
      const newItineraryId = currentParams.get("itineraryId")

      if ((newCustomerId && newCustomerId !== customerId) ||
        (newEnquiryId && newEnquiryId !== enquiryId) ||
        (newItineraryId && newItineraryId !== itineraryId)) {
        // Force refresh data when parameters change
        setTimeout(() => {
          fetchCustomerData(newCustomerId, newEnquiryId, newItineraryId, true)
        }, 100)
      }
    }

    window.addEventListener('popstate', handleParamChange)
    return () => window.removeEventListener('popstate', handleParamChange)
  }, [customerId, enquiryId, itineraryId])

  const fetchCustomerData = async (
    customerIdParam: string | null,
    enquiryIdParam: string | null,
    itineraryIdParam: string | null,
    forceRefresh = false
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Clear existing data if force refresh
      if (forceRefresh) {
        setSelectedCustomer(null)
        setItineraries([])
        setCustomerFeedbacks([])
        setSentItineraries([])
      }

      console.log("Fetching customer data for:", { customerIdParam, enquiryIdParam, itineraryIdParam })

      const params = new URLSearchParams()
      if (customerIdParam) {
        params.append("customerId", customerIdParam)
      }
      if (enquiryIdParam) {
        params.append("enquiryId", enquiryIdParam)
      }
      if (itineraryIdParam) {
        params.append("itineraryId", itineraryIdParam)
      }

      const response = await fetch(`/api/share-customer?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data: CustomerDashboardData = await response.json()
      if (data.customer) {
        setSelectedCustomer(data.customer)
        setFormData((prev) => ({
          ...prev,
          name: data.customer?.name || "",
          email: data.customer?.email || "",
          whatsappNumber: data.customer?.whatsappNumber || data.customer?.phone || "",
        }))
      }

      setItineraries(data.itineraries || [])
      setCustomerFeedbacks(data.feedbacks || [])
      setSentItineraries(data.sentItineraries || [])

      // Auto-select first itinerary with PDF if available
      const firstItineraryWithPDF = (data.itineraries || []).find((it) => it.pdfUrl)
      if (firstItineraryWithPDF) {
        setSelectedItinerary(firstItineraryWithPDF)
      }
    } catch (error) {
      console.error("Error fetching customer data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch customer data")
    } finally {
      setLoading(false)
    }
  }

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s+/g, ""))
  }

  // Handle itinerary selection
  const handleSelectItinerary = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary)
    console.log("Selected itinerary:", itinerary)
  }

  const handleToggleActiveStatus = async (itinerary: Itinerary) => {
    try {
      const newActiveStatus = !itinerary.activeStatus

      const response = await fetch("/api/update-itinerary-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itineraryId: itinerary.id,
          activeStatus: newActiveStatus,
          enquiryId: enquiryId,
          customerId: customerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update status")
      }

      // Update local state - set this one as active and others as inactive if activating
      setItineraries((prev) =>
        prev.map((item) => ({
          ...item,
          activeStatus:
            newActiveStatus && item.id === itinerary.id ? true : newActiveStatus ? false : item.activeStatus,
        })),
      )

      // If activating this itinerary, select it
      if (newActiveStatus) {
        setSelectedItinerary(itinerary)
      }

      toast({
        variant: "success",
        title: "✅ Status Updated",
        description: `Itinerary ${newActiveStatus ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("Error updating active status:", error)
      toast({
        variant: "destructive",
        title: "❌ Update Failed",
        description: "Failed to update itinerary status. Please try again.",
      })
    }
  }

  // Enhanced Send Itinerary function with better error handling
  const sendItineraryViaEmail = async () => {
    // Enhanced validation
    if (!formData.name?.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Please enter customer name",
      })
      return
    }

    if (!formData.email?.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Please enter customer email",
      })
      return
    }

    if (!validateEmail(formData.email)) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Please enter a valid email address",
      })
      return
    }

    if (!formData.whatsappNumber?.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Please enter WhatsApp number",
      })
      return
    }

    if (!validatePhoneNumber(formData.whatsappNumber)) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Please enter a valid phone number",
      })
      return
    }

    // Check if an itinerary is selected or available
    const itineraryToSend = selectedItinerary || itineraries[0]
    if (!itineraryToSend) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "No itinerary available to send. Please generate an itinerary first.",
      })
      return
    }

    if (!itineraryToSend.pdfUrl) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "PDF not available for selected itinerary. Please generate PDF first.",
      })
      return
    }

    if (!customerId && !enquiryId) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Customer ID or Enquiry ID is required",
      })
      return
    }

    try {
      setSendingItinerary(true)

      const requestBody = {
        customerId: customerId || enquiryId,
        itineraryId: itineraryToSend.id,
        enquiryId: enquiryId,
        customerName: formData.name.trim(),
        email: formData.email.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        notes: formData.notes?.trim() || null,

      }

      console.log(" Sending request to API:", requestBody)

      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch("/api/sent-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("API Response status:", response.status)
      console.log(" API Response headers:", Object.fromEntries(response.headers.entries()))

      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text()
      console.log(" Raw response:", responseText.substring(0, 500)) // Log first 500 chars

      // Check if response is actually JSON
      let result
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          result = JSON.parse(responseText)
          console.log("Parsed JSON result:", result)
        } catch (parseError) {
          console.error(" Failed to parse JSON:", parseError)
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
        }
      } else {
        console.error(" API returned non-JSON response:", {
          status: response.status,
          contentType,
          body: responseText.substring(0, 500),
        })

        // Try to extract meaningful error from HTML response
        if (responseText.includes("Email server connection failed")) {
          throw new Error("Email server connection failed. Please check email configuration.")
        } else if (responseText.includes("Internal Server Error")) {
          throw new Error("Internal server error. Please try again later.")
        } else {
          throw new Error(`Server error (${response.status}): Unable to process request. Please contact support.`)
        }
      }

      if (!response.ok) {
        const errorMessage = result?.error || result?.message || `HTTP error! status: ${response.status}`

        // Handle specific error types
        if (errorMessage.includes("Email server connection failed")) {
          throw new Error(
            " Email Configuration Error: The email server is not properly configured. Please contact your administrator.",
          )
        } else if (errorMessage.includes("Invalid email")) {
          throw new Error(" Invalid Email: Please check the email address and try again.")
        } else if (errorMessage.includes("PDF not found")) {
          throw new Error(" PDF Error: The itinerary PDF could not be found. Please regenerate the PDF.")
        } else {
          throw new Error(errorMessage)
        }
      }

      if (result.success && result.sentItinerary) {
        // Refresh full dashboard data to ensure persistence and show existing entries
        await fetchCustomerData(customerId, enquiryId, itineraryId)
        setFormData((prev) => ({
          ...prev,
          notes: "",

        }))

        toast({
          variant: "success",
          title: "✅ Email Sent Successfully!",
          description: `Itinerary sent to ${formData.email}. Customer will receive it shortly.`,
        })

        setSelectedItinerary(null)

        // Redirect to Share DMC section after success, preserving context
        const dmcParams = new URLSearchParams()
        if (customerId) dmcParams.set("customerId", customerId)
        if (enquiryId) dmcParams.set("enquiryId", enquiryId)
        if (itineraryId) dmcParams.set("itineraryId", itineraryId)

        toast({
          title: "✅ Email Sent Successfully!",
          description: "Email sent successfully! The customer will receive the itinerary shortly.",
          duration: 5000, // Show for 5 seconds
        })
      } else {
        throw new Error(result.error || "Failed to send itinerary")
      }
    } catch (error) {
      console.error("💥 Error sending itinerary:", error)

      let errorMessage = "Failed to send email"

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timeout. Please check your internet connection and try again."
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("Email server connection failed")) {
          errorMessage = "Email server is currently unavailable. Please contact support or try again later."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        variant: "destructive",
        title: "❌ Email Failed",
        description: errorMessage,
        duration: 8000, // Show longer for error messages
      })
    } finally {
      setSendingItinerary(false)
    }
  }

  const handleRegeneratePDF = async (itinerary: Itinerary) => {
    setRegeneratingPDF(itinerary.id)

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enquiryId: enquiryId || "",
          itineraryId: itinerary.id,
          formData: itinerary,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to regenerate PDF")
      }

      const result = await response.json()

      // Update the itinerary with new PDF URL and set as active
      setItineraries((prev) =>
        prev.map((item) => ({
          ...item,
          ...(item.id === itinerary.id
            ? { pdfUrl: result.pdfUrl, pdf: "Available", activeStatus: true }
            : { activeStatus: false }), // Deactivate others
        })),
      )

      // Set this itinerary as selected
      setSelectedItinerary({ ...itinerary, pdfUrl: result.pdfUrl, activeStatus: true })

      // Update active status in database
      await fetch("/api/update-itinerary-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itineraryId: itinerary.id,
          activeStatus: true,
          enquiryId: enquiryId,
          customerId: customerId,
        }),
      })

      toast({
        variant: "success",
        title: "✅ PDF Regenerated Successfully!",
        description: "The PDF has been regenerated and set as active.",
      })
    } catch (error) {
      console.error("Error regenerating PDF:", error)
      toast({
        variant: "destructive",
        title: "❌ PDF Regeneration Failed",
        description: "Failed to regenerate PDF. Please try again.",
      })
    } finally {
      setRegeneratingPDF(null)
    }
  }

  // View PDF function
  const handleViewPDF = (pdfUrl: string | null) => {
    if (pdfUrl) {
      setSelectedPDFUrl(pdfUrl)
      setShowPDFPreview(true)
    } else {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "PDF not available",
      })
    }
  }

  // Download PDF function
  const handleDownloadPDF = (pdfUrl: string | null, filename: string) => {
    if (pdfUrl) {
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = filename || "itinerary.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "PDF not available",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }


  const handleNoteFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setNewNote((prev) => ({
        ...prev,
        document: file,
      }))
    }
  }

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.description.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Please fill in all required fields",
      })
      return
    }

    if (!customerId && !enquiryId) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Customer ID or Enquiry ID is required",
      })
      return
    }

    try {
      setAddingNote(true)

      const requestBody = {
        customerId: customerId,
        enquiryId: enquiryId,
        itineraryId: itineraryId,
        type: newNote.type,
        title: newNote.title,
        description: newNote.description,
      }

      const response = await fetch("/api/share-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.feedback) {
        setCustomerFeedbacks((prev) => [result.feedback, ...prev])
        setNewNote({
          title: "",
          description: "",
          type: "note",
          document: null,
        })
        setShowAddNotePopup(false)
        toast({
          variant: "success",
          title: "✅ Note Added Successfully!",
          description: "The note has been successfully added.",
        })
      } else {
        throw new Error(result.error || "Failed to add note")
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to add note. Please try again.",
      })
    } finally {
      setAddingNote(false)
    }
  }

  const getFeedbackIcon = (type: string, status: string) => {
    if (status === "confirmed") return <CheckCircle className="w-4 h-4 text-green-600" />
    if (status === "changes") return <AlertCircle className="w-4 h-4 text-orange-600" />
    if (type === "note") return <FileText className="w-4 h-4 text-blue-600" />
    return <Clock className="w-4 h-4 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Itinerary List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Itinerary Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Generated Itineraries</h3>
                    <p className="text-sm text-gray-600">Total: {itineraries.length} itineraries</p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
                {selectedItinerary && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Selected: {selectedItinerary.destinations || `Itinerary ${selectedItinerary.id}`}
                    {selectedItinerary.activeStatus && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">ACTIVE</span>
                    )}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-green-50 border-b">
                      <th className="text-left p-4 text-sm font-medium text-gray-700">Select & Date</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-700">PDF Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-700">Active Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itineraries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          No itineraries found for this customer
                        </td>
                      </tr>
                    ) : (
                      itineraries.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} ${selectedItinerary?.id === item.id ? "ring-2 ring-green-500 bg-green-50" : ""
                            } ${item.activeStatus ? "border-l-4 border-l-green-500" : ""
                            } cursor-pointer hover:bg-green-50`}
                          onClick={() => handleSelectItinerary(item)}
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="selectedItinerary"
                                checked={selectedItinerary?.id === item.id}
                                onChange={() => handleSelectItinerary(item)}
                                className="mr-2 text-green-600"
                              />
                              <div>
                                <span className="text-sm text-gray-600">{item.dateGenerated}</span>
                                {item.activeStatus && (
                                  <div className="text-xs text-green-600 font-medium">● ACTIVE</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-8 rounded flex items-center justify-center text-white text-sm font-medium ${item.pdfUrl ? "bg-green-500" : "bg-gray-400"
                                  }`}
                              >
                                {item.pdfUrl ? "✓" : "×"}
                              </div>
                              {!item.pdfUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRegeneratePDF(item)
                                  }}
                                  disabled={regeneratingPDF === item.id}
                                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                >
                                  {regeneratingPDF === item.id ? "Generating..." : "Generate PDF"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActiveStatus(item)
                              }}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${item.activeStatus ? "bg-green-400" : "bg-gray-300"
                                } hover:opacity-80`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${item.activeStatus ? "translate-x-6" : "translate-x-0"
                                  }`}
                              ></div>
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {item.pdfUrl && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewPDF(item.pdfUrl ?? null)
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                                    disabled={!item.pdfUrl}
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadPDF(item.pdfUrl ?? null, `itinerary-${item.id}.pdf`)
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                                    disabled={!item.pdfUrl}
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Share To Customer Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">📧 Send Itinerary via Email</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter customer name"
                    disabled={sendingItinerary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter email address"
                    disabled={sendingItinerary}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number*</label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter WhatsApp number"
                    disabled={sendingItinerary}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Add special notes for the customer"
                    disabled={sendingItinerary}
                  />
                </div>
              </div>


              {/* Selected Itinerary Info */}
              {selectedItinerary && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">Selected Itinerary:</h4>
                  <div className="text-xs text-green-700">
                    <p>ID: {selectedItinerary.id}</p>
                    <p>Generated: {selectedItinerary.dateGenerated}</p>
                    <p>PDF: {selectedItinerary.pdfUrl ? "✅ Available" : "❌ Not Available"}</p>
                  </div>
                </div>
              )}

              <button
                onClick={sendItineraryViaEmail}
                disabled={sendingItinerary || !selectedItinerary?.pdfUrl}
                className="w-full py-3 bg-green-900 text-white font-medium rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingItinerary ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Sending Email...
                  </>
                ) : (
                  <>📧 Send Itinerary via Email</>
                )}
              </button>

              {!selectedItinerary?.pdfUrl && (
                <p className="text-center text-sm text-red-600 mt-2">
                  Please select an itinerary with PDF to send email
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Customer Feedbacks */}
          <div className="bg-white rounded-lg shadow-sm h-fit">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Customer Feedbacks & Updates</h3>
                  <p className="text-xs text-gray-500">Total: {customerFeedbacks.length} items</p>
                </div>
                <button
                  onClick={() => setShowAddNotePopup(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">RECENT</span>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {customerFeedbacks.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No feedback or notes yet</p>
                    <p className="text-xs">Click &quot;Add Note&quot; to get started</p>
                  </div>
                ) : (
                  customerFeedbacks.map((feedback) => (
                    <div key={feedback.id} className="border-l-4 border-green-500 pl-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{feedback.title}</h4>
                            {getFeedbackIcon(feedback.type, feedback.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{feedback.description}</p>

                          {feedback.documentUrl && (
                            <div className="mt-2">
                              <button className="text-xs text-blue-600 hover:underline">
                                📎 View Document: {feedback.documentName}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sent Itineraries Table */}
        <div className="bg-white rounded-lg shadow-sm mt-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">📧 Email History - Sent Itineraries</h3>
            <p className="text-sm text-gray-600">Total: {sentItineraries.length} sent via email</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50 border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Email Sent On</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Customer Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">WhatsApp Number</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Notes</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {sentItineraries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      No emails sent yet
                    </td>
                  </tr>
                ) : (
                  sentItineraries.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">{item.date}</td>
                      <td className="p-4 text-sm text-gray-900">{item.customerName}</td>
                      <td className="p-4 text-sm text-gray-600">{item.email}</td>
                      <td className="p-4 text-sm text-gray-600">{item.whatsappNumber}</td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={item.notes || undefined}>
                        {item.notes || "No notes"}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Note Popup */}
      {showAddNotePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Customer Feedback</h3>
              <button
                onClick={() => setShowAddNotePopup(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={addingNote}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={addingNote}
                >
                  <option value="note">Note</option>
                  <option value="feedback">Feedback</option>
                  <option value="change_request">Change Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title*</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter title"
                  disabled={addingNote}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description*</label>
                <textarea
                  value={newNote.description}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter description"
                  disabled={addingNote}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Document</label>
                <input
                  type="file"
                  onChange={handleNoteFileUpload}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={addingNote}
                />
                {newNote.document && <p className="text-sm text-gray-600 mt-2">Selected: {newNote.document.name}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddNotePopup(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={addingNote}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={addingNote}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingNote ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Adding...
                  </>
                ) : (
                  "Add Note"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && selectedPDFUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl mx-4 h-5/6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">PDF Preview</h3>
              <button onClick={() => setShowPDFPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe src={selectedPDFUrl} className="w-full h-full border rounded" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ShareCustomerDashboard
