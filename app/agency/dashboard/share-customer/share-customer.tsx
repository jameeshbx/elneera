"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Download,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  Star,
  FileDown,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"

import type { CustomerFeedback, SentItinerary, FormData, NewNote, CustomerDashboardData } from "@/types/customer"


// Extended PDF Version interface
interface PDFVersion {
  id: string
  url: string
  version: number
  isActive: boolean
  createdAt: string
  metadata?: {
    isEdited?: boolean
    fileSize?: number
    s3Key?: string
  }
}

// Extended Itinerary interface with PDF versioning
interface ExtendedItinerary {
  id: string
  originalId?: string
  createdAt?: Date | string
  pdfUrl?: string | null // Changed from any to string | null
  editedPdfUrl?: string | null // Changed from any to string | null
  isEdited?: boolean
  activeStatus?: boolean
  status?: string
  destinations?: string | string[]
  startDate?: Date | string | null
  endDate?: Date | string | null
  budget?: number | null
  currency?: string | null
  enquiryId?: string | null
  customerId?: string | null
  updatedAt?: Date | string
  editedAt?: Date | string | null
  lastPdfRegeneratedAt?: Date | string | null
  activePdfVersion?: string
  customerName?: string
  pdfVersions?: PDFVersion[]
  activePdfUrl?: string | null
  displayVersion?: string
  versionNumber?: number
  isLatestVersion?: boolean
  dateGenerated?: string
  pdf?: string
  pdfStatus?: string
  itinerary?: string
}

export default function ShareCustomerDashboard() {
  const router = useRouter()
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
  const [selectedPDFUrl, setSelectedPDFUrl] = useState<string | undefined>(undefined)
  const [selectedItinerary, setSelectedItinerary] = useState<ExtendedItinerary | null>(null)
  const [selectedPDFVersion, setSelectedPDFVersion] = useState<string | null>(null)
  const [newNote, setNewNote] = useState<NewNote>({
    title: "",
    description: "",
    type: "note",
    document: null,
  })

  const [itineraryVersions, setItineraryVersions] = useState<ExtendedItinerary[]>([])
  const [customerFeedbacks, setCustomerFeedbacks] = useState<CustomerFeedback[]>([])
  const [sentItineraries, setSentItineraries] = useState<SentItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [enquiryId, setEnquiryId] = useState<string | null>(null)
  const [itineraryId, setItineraryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingItinerary, setSendingItinerary] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const { toast } = useToast()

  // Keep URL and state in sync; restore from localStorage if URL lacks params
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId")
    const enquiryIdParam = searchParams.get("enquiryId")
    const itineraryIdParam = searchParams.get("itineraryId")
    const pdfGeneratedParam = searchParams.get("pdfGenerated")
    const pdfTypeParam = searchParams.get("pdfType")

    if (customerIdParam || enquiryIdParam) {
      setCustomerId(customerIdParam)
      setEnquiryId(enquiryIdParam)
      setItineraryId(itineraryIdParam)

      // Show notification if coming from PDF generation
      if (pdfGeneratedParam === "true") {
        setTimeout(() => {
          toast({
            title: "PDF Generated Successfully!",
            description: `${pdfTypeParam === "regenerated" ? "Regenerated" : "Generated"} PDF is now available`,
            variant: "default",
          })
        }, 1000)
      }

      fetchCustomerData(customerIdParam, enquiryIdParam, itineraryIdParam)
      // Persist context
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "shareCustomerContext",
          JSON.stringify({ customerId: customerIdParam, enquiryId: enquiryIdParam, itineraryId: itineraryIdParam }),
        )
      }
      return
    }

    // Fallback to last context from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("shareCustomerContext")
        if (stored) {
          const ctx = JSON.parse(stored) as {
            customerId?: string | null
            enquiryId?: string | null
            itineraryId?: string | null
          }
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
          router.replace(`/agency-admin/dashboard/share-customer?${params.toString()}`)

          fetchCustomerData(restoreCustomerId, restoreEnquiryId, restoreItineraryId)
          return
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    setError("Either Customer ID or Enquiry ID is required")
    setLoading(false)
  }, [searchParams, router, toast]) // Added missing dependencies

  const fetchCustomerData = async (
    customerIdParam: string | null,
    enquiryIdParam: string | null,
    itineraryIdParam: string | null,
    forceRefresh = false,
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Clear existing data if force refresh
      if (forceRefresh) {
        setSelectedItinerary(null)
        setItineraryVersions([])
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
        setFormData((prev) => ({
          ...prev,
          name: data.customer?.name || "",
          email: data.customer?.email || "",
          whatsappNumber: data.customer?.whatsappNumber || data.customer?.phone || "",
        }))
      }

      // Process itineraries and create separate rows for each PDF version
      const allVersions: ExtendedItinerary[] = []

      if (data.itineraries && data.itineraries.length > 0) {
        data.itineraries.forEach((itinerary) => {
          // Get all PDF versions for this itinerary
          const pdfVersions = Array.isArray(itinerary.pdfVersions) ? itinerary.pdfVersions : []

          if (pdfVersions.length > 0) {
            // Create a row for each PDF version
            pdfVersions.forEach((version) => {
              const versionItinerary: ExtendedItinerary = {
                ...itinerary,
                id: `${itinerary.id}-v${version.version}`, // Unique ID for each version row
                originalId: itinerary.id, // Keep reference to original itinerary
                activePdfUrl: version.url,
                displayVersion: version.metadata?.isEdited
                  ? `REGENERATED (V${version.version})`
                  : `GENERATED (V${version.version})`,
                versionNumber: version.version,
                isLatestVersion: version.isActive,
                isEdited: version.metadata?.isEdited || false,
                createdAt: version.createdAt,
                pdfVersions: [version], // Only include this specific version
                activeStatus: version.isActive,
              }
              allVersions.push(versionItinerary)
            })
          } else {
            // Handle itineraries without PDF versions (legacy)
            let versionNumber = 1
            let displayVersion = "GENERATED (V1)"
            let activePdfUrl = itinerary.pdfUrl

            if (itinerary.editedPdfUrl) {
              versionNumber = 2
              displayVersion = "REGENERATED (V2)"
              activePdfUrl = itinerary.editedPdfUrl
            }

            const legacyItinerary: ExtendedItinerary = {
              ...itinerary,
              activePdfUrl,
              displayVersion,
              versionNumber,
              isLatestVersion: true,
              isEdited: !!itinerary.editedPdfUrl,
              pdfVersions: [],
            }
            allVersions.push(legacyItinerary)
          }
        })
      }

      // Sort versions by creation date (newest first)
      const sortedVersions = allVersions.sort((a, b) => {
        const dateA = new Date(a.createdAt || "").getTime()
        const dateB = new Date(b.createdAt || "").getTime()
        return dateB - dateA
      })

      setItineraryVersions(sortedVersions)

      // Select the latest version by default
      const latestVersion = sortedVersions.find((version) => version.activePdfUrl)
      if (latestVersion && latestVersion.activePdfUrl) {
        setSelectedPDFUrl(latestVersion.activePdfUrl + `?t=${Date.now()}`)
        setSelectedItinerary(latestVersion)
        setSelectedPDFVersion(latestVersion.activePdfUrl)
      }

      setCustomerFeedbacks(data.feedbacks || [])
      setSentItineraries(data.sentItineraries || [])
    } catch (error) {
      console.error("Error fetching customer data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch customer data")
    } finally {
      setLoading(false)
    }
  }

  // Add refresh handler
  const handleRefresh = () => {
    fetchCustomerData(customerId, enquiryId, itineraryId, true)
    toast({
      title: "Refreshing",
      description: "Fetching latest customer data...",
    })
  }

  // Handle itinerary selection
  const handleSelectItinerary = (itinerary: ExtendedItinerary) => {
    setSelectedItinerary(itinerary)
    setSelectedPDFVersion(itinerary.activePdfUrl || null)
    console.log("Selected itinerary version:", itinerary)
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

  const handleGeneratePDF = async (itineraryId: string, isRegeneration = false) => {
    try {
      setGeneratingPDF(itineraryId)

      const endpoint = isRegeneration ? "/api/regenerate-pdf" : "/api/generate-pdf"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itineraryId,
          enquiryId,
          formData: {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.whatsappNumber,
          },
          isEditedVersion: isRegeneration,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate PDF")
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "PDF Generated Successfully!",
          description: `${isRegeneration ? "Regenerated" : "Generated"} PDF is now available`,
          variant: "default",
        })

        // Refresh the data to show the new PDF
        await fetchCustomerData(customerId, enquiryId, itineraryId, true)
      } else {
        throw new Error(result.error || "Failed to generate PDF")
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
      })
    } finally {
      setGeneratingPDF(null)
    }
  }

  // Send Itinerary function with PDF version selection
  const sendItineraryViaEmail = async () => {
    // Enhanced validation
    if (!formData.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter customer name",
      })
      return
    }

    if (!formData.email?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter customer email",
      })
      return
    }

    if (!validateEmail(formData.email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address",
      })
      return
    }

    if (!formData.whatsappNumber?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter WhatsApp number",
      })
      return
    }

    if (!validatePhoneNumber(formData.whatsappNumber)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid phone number",
      })
      return
    }

    if (!selectedPDFVersion) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a PDF version to send",
      })
      return
    }

    const itineraryToSend =
      selectedItinerary ||
      itineraryVersions.find((it) => it.activeStatus && it.activePdfUrl) ||
      itineraryVersions.find((it) => it.activePdfUrl)

    if (!itineraryToSend) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No itinerary available to send. Please generate an itinerary first.",
      })
      return
    }

    if (!customerId && !enquiryId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Customer ID or Enquiry ID is required",
      })
      return
    }

    try {
      setSendingItinerary(true)

      const requestBody = {
        customerId: customerId || enquiryId,
        itineraryId: itineraryToSend.originalId || itineraryToSend.id, // Use original ID for database reference
        enquiryId: enquiryId,
        customerName: formData.name.trim(),
        email: formData.email.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        notes: formData.notes?.trim() || null,
        pdfUrl: selectedPDFVersion, // Send the selected PDF version
        pdfVersion: itineraryToSend.versionNumber,
        isEditedVersion: itineraryToSend.isEdited,
      }

      console.log("Sending request to API:", requestBody)

      const response = await fetch("/api/sent-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000), // 60 second timeout
      })

      const responseText = await response.text()
      let result

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          result = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError)
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
        }
      } else {
        console.error("API returned non-JSON response:", {
          status: response.status,
          contentType,
          body: responseText.substring(0, 500),
        })

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
        throw new Error(errorMessage)
      }

      if (result.success && result.sentItinerary) {
        // Refresh full dashboard data to ensure persistence and show existing entries
        await fetchCustomerData(customerId, enquiryId, itineraryId)
        setFormData((prev) => ({
          ...prev,
          notes: "",
        }))

        const versionText = itineraryToSend?.displayVersion || "Selected PDF"

        toast({
          variant: "default",
          title: "Email Sent Successfully!",
          description: `${versionText} sent to ${formData.email}. Customer will receive it shortly.`,
        })

        // Redirect to Share DMC section after success, preserving context
        const dmcParams = new URLSearchParams()
        if (customerId) dmcParams.set("customerId", customerId)
        if (enquiryId) dmcParams.set("enquiryId", enquiryId)
        if (itineraryId) dmcParams.set("itineraryId", itineraryId)
        router.push(`/agency-admin/dashboard/share-dmc?${dmcParams.toString()}`)
      } else {
        throw new Error(result.error || "Failed to send itinerary")
      }
    } catch (error) {
      console.error("Error sending itinerary:", error)

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
        title: "Email Failed",
        description: errorMessage,
        duration: 8000,
      })
    } finally {
      setSendingItinerary(false)
    }
  }

  // View PDF function with S3 URL handling
  const handleViewPDF = async (pdfUrl: string) => {
    if (!pdfUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No PDF URL available",
      })
      return
    }

    try {
      // If it's an S3 URL, generate a fresh pre-signed URL
      if (pdfUrl.includes("amazonaws.com")) {
        const url = new URL(pdfUrl)
        const key = url.pathname.substring(1) // Remove leading slash

        const response = await fetch(`/api/generate-presigned-url?key=${encodeURIComponent(key)}`)

        if (!response.ok) {
          throw new Error("Failed to generate pre-signed URL")
        }

        const { url: signedUrl } = await response.json()
        setSelectedPDFUrl(signedUrl)
      } else {
        setSelectedPDFUrl(pdfUrl)
      }

      setShowPDFPreview(true)
    } catch (error) {
      console.error("Error generating pre-signed URL:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load PDF. Please try again.",
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
        title: "Error",
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
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    if (!customerId && !enquiryId) {
      toast({
        variant: "destructive",
        title: "Error",
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
          variant: "default",
          title: "Note Added Successfully!",
          description: "The note has been successfully added.",
        })
      } else {
        throw new Error(result.error || "Failed to add note")
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        variant: "destructive",
        title: "Error",
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

  const renderPDFViewer = () => (
    <div className="relative w-full h-full">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={() => setShowPDFPreview(false)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <iframe key={selectedPDFUrl} src={selectedPDFUrl} className="w-full h-full border-0" title="PDF Preview" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - PDF Versions Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Itinerary PDF Versions</h3>
                    <p className="text-sm text-gray-600">
                      {itineraryVersions.length > 0
                        ? `Total: ${itineraryVersions.length} PDF versions available`
                        : "No PDF versions generated yet"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const targetItineraryId =
                          itineraryId || itineraryVersions[0]?.originalId || itineraryVersions[0]?.id
                        if (targetItineraryId) {
                          handleGeneratePDF(targetItineraryId, false)
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "No itinerary ID available for PDF generation",
                          })
                        }
                      }}
                      disabled={generatingPDF !== null}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      {generatingPDF ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          Generate PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </div>
                {selectedItinerary && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      Selected for Email: Version {selectedItinerary.versionNumber} - {selectedItinerary.displayVersion}
                      {selectedItinerary.isLatestVersion && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          LATEST
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                {itineraryVersions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">No PDF Versions Available</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Generate your first PDF to get started with sharing itineraries
                    </p>
                    <button
                      onClick={() => {
                        const targetItineraryId = itineraryId || customerId || enquiryId
                        if (targetItineraryId) {
                          handleGeneratePDF(targetItineraryId, false)
                        }
                      }}
                      disabled={generatingPDF !== null}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                      {generatingPDF ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          Generate First PDF
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Latest PDF Section */}
                    <div className="p-4 border-b bg-green-50">
                      <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Latest PDF Version
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-green-200">
                              <th className="text-left p-2 text-xs font-medium text-green-700 uppercase tracking-wide">
                                Select
                              </th>
                              <th className="text-left p-2 text-xs font-medium text-green-700 uppercase tracking-wide">
                                Date
                              </th>
                              <th className="text-left p-2 text-xs font-medium text-green-700 uppercase tracking-wide">
                                PDF
                              </th>
                              <th className="text-left p-2 text-xs font-medium text-green-700 uppercase tracking-wide">
                                Action
                              </th>
                              <th className="text-left p-2 text-xs font-medium text-green-700 uppercase tracking-wide">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {itineraryVersions
                              .filter((version) => version.isLatestVersion)
                              .map((version) => (
                                <tr
                                  key={version.id}
                                  className={`border-b border-green-100 hover:bg-green-25 cursor-pointer ${
                                    selectedItinerary?.id === version.id ? "bg-green-100" : ""
                                  }`}
                                  onClick={() => handleSelectItinerary(version)}
                                >
                                  <td className="p-3">
                                    <input
                                      type="radio"
                                      name="selectedPDF"
                                      checked={selectedItinerary?.id === version.id}
                                      onChange={() => handleSelectItinerary(version)}
                                      className="text-green-600"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm text-gray-900">
                                      {new Date(version.createdAt || "").toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(version.createdAt || "").toLocaleTimeString()}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                          version.isEdited ? "bg-blue-500" : "bg-green-500"
                                        }`}
                                      >
                                        V{version.versionNumber}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {version.displayVersion}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {version.isEdited ? "Regenerated PDF" : "Original PDF"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      {version.activePdfUrl && (
                                        <>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleViewPDF(version.activePdfUrl!)
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                                          >
                                            <Eye className="w-3 h-3" />
                                            View
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDownloadPDF(
                                                version.activePdfUrl!,
                                                `itinerary-latest-v${version.versionNumber}.pdf`,
                                              )
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                                          >
                                            <Download className="w-3 h-3" />
                                            Download
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          version.activePdfUrl ? "bg-green-500" : "bg-red-500"
                                        }`}
                                      ></div>
                                      <span
                                        className={`text-xs font-medium ${
                                          version.activePdfUrl ? "text-green-600" : "text-red-600"
                                        }`}
                                      >
                                        {version.activePdfUrl ? "Available" : "Missing"}
                                      </span>
                                      {version.isLatestVersion && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                          <Star className="w-3 h-3" />
                                          LATEST
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Previous PDFs Section */}
                    {itineraryVersions.filter((version) => !version.isLatestVersion).length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Previous PDF Versions (
                          {itineraryVersions.filter((version) => !version.isLatestVersion).length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                                  Select
                                </th>
                                <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                                  Date
                                </th>
                                <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                                  PDF
                                </th>
                                <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                                  Action
                                </th>
                                <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {itineraryVersions
                                .filter((version) => !version.isLatestVersion)
                                .map((version) => (
                                  <tr
                                    key={version.id}
                                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                      selectedItinerary?.id === version.id ? "bg-blue-50" : ""
                                    }`}
                                    onClick={() => handleSelectItinerary(version)}
                                  >
                                    <td className="p-3">
                                      <input
                                        type="radio"
                                        name="selectedPDF"
                                        checked={selectedItinerary?.id === version.id}
                                        onChange={() => handleSelectItinerary(version)}
                                        className="text-green-600"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <div className="text-sm text-gray-900">
                                        {new Date(version.createdAt || "").toLocaleDateString()}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(version.createdAt || "").toLocaleTimeString()}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                            version.isEdited ? "bg-blue-400" : "bg-gray-400"
                                          }`}
                                        >
                                          V{version.versionNumber}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-700">
                                            {version.displayVersion}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {version.isEdited ? "Regenerated PDF" : "Original PDF"}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-1">
                                        {version.activePdfUrl && (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewPDF(version.activePdfUrl!)
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                                            >
                                              <Eye className="w-3 h-3" />
                                              View
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownloadPDF(
                                                  version.activePdfUrl!,
                                                  `itinerary-v${version.versionNumber}.pdf`,
                                                )
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                                            >
                                              <Download className="w-3 h-3" />
                                              Download
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            version.activePdfUrl ? "bg-green-500" : "bg-red-500"
                                          }`}
                                        ></div>
                                        <span
                                          className={`text-xs font-medium ${
                                            version.activePdfUrl ? "text-green-600" : "text-red-600"
                                          }`}
                                        >
                                          {version.activePdfUrl ? "Available" : "Missing"}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">Send Selected PDF Version via Email</h3>

              {/* Selected PDF Info */}
              {selectedPDFVersion && selectedItinerary ? (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Selected PDF Version Ready to Send
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-green-700">
                    <div>
                      <p>
                        <strong>Version:</strong> {selectedItinerary.versionNumber}
                      </p>
                      <p>
                        <strong>Type:</strong> {selectedItinerary.displayVersion}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Status:</strong> {selectedItinerary.activePdfUrl ? "Available" : "Missing"}
                      </p>
                      <p>
                        <strong>Latest:</strong> {selectedItinerary.isLatestVersion ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No PDF Version Selected
                  </h4>
                  <p className="text-xs text-yellow-700">
                    Please select a PDF version from the table above to send via email.
                  </p>
                </div>
              )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

              <button
                onClick={sendItineraryViaEmail}
                disabled={sendingItinerary || !selectedPDFVersion}
                className="w-full py-3 bg-green-900 text-white font-medium rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingItinerary ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Sending Email...
                  </>
                ) : selectedPDFVersion ? (
                  <>Send Selected PDF Version via Email</>
                ) : (
                  <>Select a PDF Version First</>
                )}
              </button>

              {!selectedPDFVersion && (
                <p className="text-center text-sm text-red-600 mt-2">
                  ⚠️ Please select a PDF version from the table above to enable email sending
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
                    <p className="text-xs">
                      Click {'"'}Add Note{'"'} to get started
                    </p>
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
                                View Document: {feedback.documentName}
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
            <h3 className="text-lg font-semibold">Email History - Sent Itineraries</h3>
            <p className="text-sm text-gray-600">Total: {sentItineraries.length} sent via email</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50 border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Email Sent On</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Customer Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">PDF Version</th>
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
                      <td className="p-4 text-sm text-gray-600">
                        {item.isEdited ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            REGENERATED V{item.pdfVersion || "2"}
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            GENERATED V{item.pdfVersion || "1"}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={item.notes || undefined}>
                        {item.notes || "No notes"}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.status}
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
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl mx-4 h-5/6">{renderPDFViewer()}</div>
        </div>
      )}
    </div>
  )
}
