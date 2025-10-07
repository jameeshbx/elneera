"use client"

import { useState, useEffect } from "react"
import { Eye, Download, RefreshCw,  FileText, Send, X, Star, Clock} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

// Interface for DMC data from your API
interface DMC {
  id: string
  name: string
  primaryContact: string
  phoneNumber: string
  designation: string
  email: string
  status: string
  primaryCountry?: string
  destinationsCovered?: string
  cities?: string
}

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

interface ExtendedItinerary {
  id: string
  originalId?: string
  createdAt?: Date | string
  pdfUrl?: string | null
  editedPdfUrl?: string | null
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
  selectedDMCs?: SharedDMCItem[]
}

interface SharedDMCItem {
  id: string
  dmcId: string
  status: "AWAITING_TRANSFER" | "VIEWED" | "AWAITING_INTERNAL_REVIEW" | "QUOTATION_RECEIVED" | "REJECTED" | "COMMISSION_ADDED"
  notes?: string
  lastUpdated?: string | Date
  quotationAmount?: number
  markupPrice?: number
  commissionType?: string
  commissionAmount?: number
  dmc?: DMC
}

interface CommunicationLog {
  id: string
  date: string
  status: string
  companyType: "DMC" | "Agency"
  feedback: string
  dmcName: string
}

interface RowDMCSelections {
  [itineraryId: string]: string;
}

interface SharedDMC {
  id: string;
  dateGenerated: string;
  pdf: string;
  pdfUrl: string | null;
  activeStatus: boolean;
  enquiryId: string;
  customerId: string;
  assignedStaffId: string;
  selectedDMCs: Array<{
    id: string;
    dmcId: string;
    status: string;
  }>;
}

const DMCAdminInterface = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const enquiryId = searchParams.get("enquiryId")
  const customerId = searchParams.get("customerId")

  const [itineraries, setItineraries] = useState<ExtendedItinerary[]>([])
  const [availableDMCs, setAvailableDMCs] = useState<DMC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowDMCSelections, setRowDMCSelections] = useState<RowDMCSelections>({});
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)

  const [showCommunicationLog, setShowCommunicationLog] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [showSetMargin, setShowSetMargin] = useState(false)
  const [selectedDMCItem, setSelectedDMCItem] = useState<SharedDMCItem | null>(null)
  const [selectedItinerary, setSelectedItinerary] = useState<ExtendedItinerary | null>(null)

  const [statusDetails, setStatusDetails] = useState("AWAITING_TRANSFER")
  const [feedbackText, setFeedbackText] = useState("")
  const [commissionType, setCommissionType] = useState<string>("FLAT")
  const [commissionAmount, setCommissionAmount] = useState("180")
  const [markupPrice, setMarkupPrice] = useState("1280")
  const [comments, setComments] = useState("")
  const [quotationPrice, setQuotationPrice] = useState("1100.00")

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([])
  const [isSubmittingCommission, setIsSubmittingCommission] = useState(false)
  const [isShareToCustomerLoading, setIsShareToCustomerLoading] = useState(false)

  // PDF-related state
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [selectedPDFUrl, setSelectedPDFUrl] = useState<string | null>(null)

  // Auto-refresh state
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true)

  // Calculate markup price dynamically
  const calculateMarkupPrice = () => {
    const quotation = parseFloat(quotationPrice) || 0
    const commission = parseFloat(commissionAmount) || 0
    
    if (commissionType === "PERCENTAGE") {
      const commissionValue = (quotation * commission) / 100
      return (quotation + commissionValue).toFixed(2)
    } else {
      return (quotation + commission).toFixed(2)
    }
  }

  // Update markup price when quotation or commission changes
  useEffect(() => {
    setMarkupPrice(calculateMarkupPrice())
  }, [quotationPrice, commissionAmount, commissionType])

  // Fetch DMCs and shared itineraries from API
  useEffect(() => {
    if (enquiryId || customerId) {
      fetchData()
    }
  }, [enquiryId, customerId])

  // Auto-refresh functionality
  useEffect(() => {
    if (!isAutoRefreshEnabled || (!enquiryId && !customerId)) return
  
    const interval = setInterval(() => {
      fetchData(false)
    }, 10000)
  
    return () => clearInterval(interval)
  }, [isAutoRefreshEnabled, enquiryId, customerId])

  const fetchData = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true)
        setError(null)
      }

      console.log("Fetching data for:", { enquiryId, customerId })

      // Fetch DMCs
      const dmcResponse = await fetch("/api/auth/agency-add-dmc?limit=100")
      
      if (!dmcResponse.ok) {
        throw new Error(`Failed to fetch DMCs: ${dmcResponse.statusText}`)
      }

      const dmcData = await dmcResponse.json()
      if (dmcData.success && dmcData.data) {
        setAvailableDMCs(dmcData.data)
      }

      // Fetch itineraries from share-customer API
      const params = new URLSearchParams()
      if (enquiryId) params.append("enquiryId", enquiryId)
      if (customerId) params.append("customerId", customerId)

      const itinerariesResponse = await fetch(`/api/share-customer?${params.toString()}`)
      
      if (!itinerariesResponse.ok) {
        throw new Error(`Failed to fetch itineraries: ${itinerariesResponse.statusText}`)
      }

      const itinerariesData = await itinerariesResponse.json()
      
      if (itinerariesData.success && itinerariesData.itineraries) {
        // Fetch shared DMC data to get selected DMCs
        const sharedResponse = await fetch(`/api/share-dmc?${params.toString()}`)
        let sharedDMCData = null
        
        if (sharedResponse.ok) {
          sharedDMCData = await sharedResponse.json()
        }

        // Merge itineraries with shared DMC data
        const mergedItineraries = itinerariesData.itineraries.map((itin: ExtendedItinerary) => {
          const sharedDMC = sharedDMCData?.data?.find((shared: SharedDMC) => 
            shared.id === itin.originalId || shared.id === itin.id
          )
          
          return {
            ...itin,
            selectedDMCs: sharedDMC?.selectedDMCs || []
          }
        })

        setItineraries(mergedItineraries)
      }

    } catch (err) {
      console.error("Error fetching data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data"
      if (showLoadingState) {
        setError(errorMessage)
      }
    } finally {
      if (showLoadingState) {
        setLoading(false)
      }
    }
  }

  const handleDMCSelect = (itineraryId: string, dmcId: string) => {
    setRowDMCSelections(prev => ({
      ...prev,
      [itineraryId]: dmcId
    }));
  };

  const handleSendToDMC = async (itinerary: ExtendedItinerary) => {
    const dmcId = rowDMCSelections[itinerary.id];
    
    if (!dmcId) {
      alert("Please select a DMC")
      return;
    }

    if (!itinerary.activePdfUrl) {
      alert("PDF not available for this itinerary")
      return;
    }
  
    try {
      setSendingEmail(itinerary.id);
      
      const response = await fetch('/api/share-dmc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedDMCs: [dmcId],
          enquiryId: enquiryId || itinerary.enquiryId,
          customerId: customerId || itinerary.customerId,
          selectedItinerary: {
            id: itinerary.originalId || itinerary.id,
            pdfUrl: itinerary.activePdfUrl,
            dateGenerated: itinerary.dateGenerated || new Date().toISOString().split("T")[0],
          },
          dateGenerated: itinerary.dateGenerated || new Date().toISOString().split("T")[0],
          assignedStaffId: "staff-1",
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to share with DMC');
      }

      
      // Clear the selection for this row
      setRowDMCSelections(prev => {
        const updated = { ...prev };
        delete updated[itinerary.id];
        return updated;
      });
      
      // Refresh data to show updated state with new DMC card
      await fetchData(false);
      
      alert(`Successfully sent to DMC!`);
      
    } catch (error) {
      console.error('Error sharing with DMC:', error);
      alert("Failed to share with DMC");
    } finally {
      setSendingEmail(null);
    }
  };

  // View PDF function
  const handleViewPDF = async (pdfUrl: string | null) => {
    if (!pdfUrl) {
      alert("PDF not available")
      return
    }

    try {
      // If it's an S3 URL, generate a fresh pre-signed URL
      if (pdfUrl.includes("amazonaws.com")) {
        const url = new URL(pdfUrl)
        const key = url.pathname.substring(1)

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
      alert("Failed to load PDF. Please try again.")
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
      alert("PDF not available")
    }
  }

  const handleViewUpdates = (dmcItem: SharedDMCItem, itinerary: ExtendedItinerary) => {
    setSelectedDMCItem(dmcItem)
    setSelectedItinerary(itinerary)
    setCommunicationLogs([])
    setShowCommunicationLog(true)
  }

  const handleUpdateStatus = (dmcItem: SharedDMCItem) => {
    setSelectedDMCItem(dmcItem)
    setStatusDetails(dmcItem.status)
    setFeedbackText(dmcItem.notes || "")
    setShowUpdateStatus(true)
  }

  const handleSetMargin = (dmcItem: SharedDMCItem) => {
    setSelectedDMCItem(dmcItem)
    setQuotationPrice(dmcItem.quotationAmount?.toString() || "1100.00")
    setCommissionType(dmcItem.commissionType || "FLAT")
    setCommissionAmount(dmcItem.commissionAmount?.toString() || "180")
    setMarkupPrice(dmcItem.markupPrice?.toString() || calculateMarkupPrice())
    setComments(dmcItem.notes || "")
    setShowSetMargin(true)
  }

  const handleShareToCustomer = async (itinerary: ExtendedItinerary, dmcItem: SharedDMCItem) => {
    try {
      setIsShareToCustomerLoading(true)

      const response = await fetch("/api/share-dmc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itinerary.originalId || itinerary.id,
          action: "shareToCustomer",
          enquiryId: enquiryId || itinerary.enquiryId,
          customerId: customerId || itinerary.customerId,
          dmcId: dmcItem.dmcId,
          itineraryId: itinerary.originalId || itinerary.id,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to share to customer")
      }

      alert("Quote shared with customer successfully")
      await fetchData(false)

    } catch (error) {
      console.error("Error sharing to customer:", error)
      alert("Failed to share quote with customer")
    } finally {
      setIsShareToCustomerLoading(false)
    }
  }

  const updateDMCStatus = async () => {
    if (!selectedDMCItem) return

    try {
      const response = await fetch("/api/share-dmc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedDMCItem.id,
          action: "updateDMCStatus",
          itemId: selectedDMCItem.id,
          status: statusDetails,
          notes: feedbackText,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status")
      }

      setShowUpdateStatus(false)
      alert("DMC status updated")
      await fetchData(false)
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    }
  }

  const addCommission = async () => {
    if (!selectedDMCItem || !enquiryId) return

    try {
      setIsSubmittingCommission(true)

      const response = await fetch("/api/share-dmc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedItinerary?.originalId || selectedItinerary?.id,
          action: "addCommission",
          enquiryId: enquiryId,
          dmcId: selectedDMCItem.dmcId,
          quotationAmount: parseFloat(quotationPrice),
          commissionType: commissionType,
          commissionAmount: parseFloat(commissionAmount),
          markupPrice: parseFloat(markupPrice),
          comments: comments,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add commission")
      }

      setShowSetMargin(false)
      alert("Commission added successfully")
      await fetchData(false)
    } catch (error) {
      console.error("Error adding commission:", error)
      alert("Failed to add commission")
    } finally {
      setIsSubmittingCommission(false)
    }
  }

  const handlePayDMC = () => {
    const queryParams = new URLSearchParams({
      enquiryId: enquiryId || "",
      customerId: customerId || "",
    });
    router.push(`/agency-admin/dashboard/dmc-payment?${queryParams.toString()}`)
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  const getDMCById = (dmcId: string) => {
    return availableDMCs.find((dmc) => dmc.id === dmcId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading DMC data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error Loading Data</p>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Share Itineraries with DMCs</span>
            {enquiryId && (
              <span className="ml-4">
                Enquiry: <span className="font-medium text-gray-800">{enquiryId}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
              className={`px-3 py-1.5 text-sm rounded flex items-center gap-2 ${
                isAutoRefreshEnabled 
                  ? "bg-green-50 border border-green-200 text-green-700" 
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isAutoRefreshEnabled ? "text-green-600" : ""}`} />
              Auto-refresh {isAutoRefreshEnabled ? "ON" : "OFF"}
            </button>
            <button 
              onClick={handleRefresh}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Itinerary PDF Versions Table */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Itinerary PDF Versions</h3>
            <p className="text-sm text-gray-600">
              {itineraries.length > 0
                ? `Total: ${itineraries.length} PDF versions available`
                : "No PDF versions generated yet"}
            </p>
          </div>

          <div className="overflow-x-auto">
            {itineraries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">No PDF Versions Available</h4>
                <p className="text-sm text-gray-500">
                  Generate itinerary PDFs to share with DMCs
                </p>
              </div>
            ) : (
              <>
                {/* Latest PDF Section */}
                <div className="p-4 border-b bg-green-50">
                  <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Latest PDF Versions
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-200">
                          <th className="text-left p-2 text-xs font-medium text-green-700 uppercase">Date</th>
                          <th className="text-left p-2 text-xs font-medium text-green-700 uppercase">PDF Version</th>
                          <th className="text-left p-2 text-xs font-medium text-green-700 uppercase">Actions</th>
                          <th className="text-left p-2 text-xs font-medium text-green-700 uppercase">Status</th>
                          <th className="text-left p-2 text-xs font-medium text-green-700 uppercase">Select DMC</th>
                          <th className="text-right p-2 text-xs font-medium text-green-700 uppercase">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itineraries
                          .filter((version) => version.isLatestVersion)
                          .map((version) => (
                            <tr
                              key={version.id}
                              className="border-b border-green-100 hover:bg-green-25"
                            >
                              <td className="p-3">
                                <div className="text-sm text-gray-900">
                                  {version.dateGenerated || new Date(version.createdAt || "").toLocaleDateString()}
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
                                        onClick={() => handleViewPDF(version.activePdfUrl!)}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View
                                      </button>
                                      <button
                                        onClick={() => handleDownloadPDF(
                                          version.activePdfUrl!,
                                          `itinerary-v${version.versionNumber}.pdf`
                                        )}
                                        className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                                      >
                                        <Download className="w-3 h-3" />
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
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    LATEST
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <select
                                  value={rowDMCSelections[version.id] || ''}
                                  onChange={(e) => handleDMCSelect(version.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  <option value="">Select DMC...</option>
                                  {availableDMCs
                                    .filter(dmc => !version.selectedDMCs?.some(item => item.dmcId === dmc.id))
                                    .map((dmc) => (
                                      <option key={dmc.id} value={dmc.id}>
                                        {dmc.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleSendToDMC(version)}
                                  disabled={!rowDMCSelections[version.id] || sendingEmail === version.id}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                                >
                                  {sendingEmail === version.id ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      Send
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Previous PDFs Section */}
                {itineraries.filter((version) => !version.isLatestVersion).length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Previous PDF Versions ({itineraries.filter((version) => !version.isLatestVersion).length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase">Date</th>
                            <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase">PDF Version</th>
                            <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase">Actions</th>
                            <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase">Status</th>
                            <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase">Select DMC</th>
                            <th className="text-right p-2 text-xs font-medium text-gray-700 uppercase">Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itineraries
                            .filter((version) => !version.isLatestVersion)
                            .map((version) => (
                              <tr
                                key={version.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  <div className="text-sm text-gray-900">
                                    {version.dateGenerated || new Date(version.createdAt || "").toLocaleDateString()}
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
                                          onClick={() => handleViewPDF(version.activePdfUrl!)}
                                          className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                                        >
                                          <Eye className="w-3 h-3" />
                                          View
                                        </button>
                                        <button
                                          onClick={() => handleDownloadPDF(
                                            version.activePdfUrl!,
                                            `itinerary-v${version.versionNumber}.pdf`
                                          )}
                                          className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                                        >
                                          <Download className="w-3 h-3" />
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
                                <td className="p-3">
                                  <select
                                    value={rowDMCSelections[version.id] || ''}
                                    onChange={(e) => handleDMCSelect(version.id, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="">Select DMC...</option>
                                    {availableDMCs
                                      .filter(dmc => !version.selectedDMCs?.some(item => item.dmcId === dmc.id))
                                      .map((dmc) => (
                                        <option key={dmc.id} value={dmc.id}>
                                          {dmc.name}
                                        </option>
                                      ))}
                                  </select>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleSendToDMC(version)}
                                    disabled={!rowDMCSelections[version.id] || sendingEmail === version.id}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                                  >
                                    {sendingEmail === version.id ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-3 h-3" />
                                        Send
                                      </>
                                    )}
                                  </button>
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

        {/* DMC Cards Section */}
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Itinerary Quote & Margin Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.flatMap((itinerary) =>
            (itinerary.selectedDMCs || []).map((dmcItem) => {
              const dmc = dmcItem.dmc || getDMCById(dmcItem.dmcId)
              if (!dmc) return null

              const getCardStatus = () => {
                switch (dmcItem.status) {
                  case "VIEWED":
                    return "Itinerary viewed"
                  case "AWAITING_INTERNAL_REVIEW":
                    return "Awaiting internal review"
                  case "QUOTATION_RECEIVED":
                    return "Quotation received"
                  case "REJECTED":
                    return "Rejected"
                  default:
                    return "Itinerary sent"
                }
              }

              const getCardColor = () => {
                switch (dmcItem.status) {
                  case "QUOTATION_RECEIVED":
                    return "bg-white border-l-4 border-green-500"
                  case "REJECTED":
                    return "bg-white border-l-4 border-red-500"
                  case "VIEWED":
                    return "bg-white border-l-4 border-blue-500"
                  default:
                    return "bg-white border-l-4 border-gray-300"
                }
              }

              const hasCommission = dmcItem.quotationAmount && dmcItem.markupPrice

              return (
                <div key={dmcItem.id} className={`shadow-sm rounded-lg ${getCardColor()}`}>
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center mr-3 text-white font-bold">
                        {dmc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">{dmc.name}</h3>
                        <p className="text-sm text-gray-500">
                          {dmcItem.status === "AWAITING_INTERNAL_REVIEW" ? "Not responded" : "Manually entered"}
                        </p>
                        {dmc.email && (
                          <p className="text-xs text-gray-400">{dmc.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1">{getCardStatus()}</h3>
                      <p className="text-sm text-gray-500">Itinerary sent on : {itinerary.dateGenerated}</p>
                      {dmcItem.status === "QUOTATION_RECEIVED" && dmcItem.quotationAmount && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Quoted Price : <span className="text-lg">${dmcItem.quotationAmount}</span>
                          </p>
                          {hasCommission && (
                            <p className="text-sm font-semibold text-blue-600">
                              Final Price : <span className="text-lg">${dmcItem.markupPrice}</span>
                            </p>
                          )}
                        </div>
                      )}
                      {dmcItem.notes && (
                        <p className="text-xs text-gray-500 mt-2">Notes: {dmcItem.notes}</p>
                      )}
                      {dmcItem.lastUpdated && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last updated: {new Date(dmcItem.lastUpdated).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                        onClick={() => handleViewUpdates(dmcItem, itinerary)}
                      >
                        View updates
                      </button>
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                        onClick={() => handleUpdateStatus(dmcItem)}
                      >
                        Update Status
                      </button>
                      {dmcItem.status === "QUOTATION_RECEIVED" && (
                        <>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                            onClick={() => handleSetMargin(dmcItem)}
                          >
                            Set margin
                          </button>
                          {hasCommission && (
                            <>
                              <button
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded flex items-center gap-1"
                                onClick={() => handleShareToCustomer(itinerary, dmcItem)}
                                disabled={isShareToCustomerLoading}
                              >
                                <Send className="w-3 h-3" />
                                Share to customer
                              </button>
                              <button
                                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded"
                                onClick={handlePayDMC}
                              >
                                Pay to DMC
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            }),
          )}
        </div>

        {itineraries.every(itinerary => !itinerary.selectedDMCs || itinerary.selectedDMCs.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No DMCs added yet</p>
            <p className="text-sm">Use the dropdown in the table above to add DMCs to your itineraries</p>
          </div>
        )}

        {/* Communication Log Modal */}
        {showCommunicationLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Communication Log: Status Updates & Responses</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    DMC: {selectedDMCItem && getDMCById(selectedDMCItem.dmcId)?.name}
                  </p>
                </div>
                <button onClick={() => setShowCommunicationLog(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Feedback received</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Company Type</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {communicationLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          No communication logs found
                        </td>
                      </tr>
                    ) : (
                      communicationLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-600">{log.date}</td>
                          <td className="p-3 text-sm text-gray-600">{log.status}</td>
                          <td className="p-3 text-sm text-gray-600">{log.companyType}</td>
                          <td className="p-3 text-sm text-gray-600">{log.feedback}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Update status and add feedbacks</h2>
                <button onClick={() => setShowUpdateStatus(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {selectedDMCItem && getDMCById(selectedDMCItem.dmcId)?.name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {selectedDMCItem && getDMCById(selectedDMCItem.dmcId)?.name}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusDetails}
                    onChange={(e) => setStatusDetails(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="AWAITING_TRANSFER">Awaiting Transfer</option>
                    <option value="VIEWED">Viewed</option>
                    <option value="AWAITING_INTERNAL_REVIEW">Awaiting Internal Review</option>
                    <option value="QUOTATION_RECEIVED">Quotation Received</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback/Notes</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter feedback or notes..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowUpdateStatus(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={updateDMCStatus} 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Set Margin Modal */}
        {showSetMargin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">Add commission</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    DMC: {selectedDMCItem && getDMCById(selectedDMCItem.dmcId)?.name}
                  </p>
                  <p className="text-sm text-gray-600">Quotation received</p>
                </div>
                <button onClick={() => setShowSetMargin(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quotation received</label>
                  <div className="flex">
                    <span className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={quotationPrice}
                      onChange={(e) => setQuotationPrice(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Enter quotation amount"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission type</label>
                    <select
                      value={commissionType}
                      onChange={(e) => setCommissionType(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="FLAT">Flat commission</option>
                      <option value="PERCENTAGE">Percentage commission</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission</label>
                    <div className="flex">
                      <input
                        type="number"
                        step="0.01"
                        value={commissionAmount}
                        onChange={(e) => setCommissionAmount(e.target.value)}
                        className="flex-1 p-3 border border-r-0 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500"
                        placeholder={commissionType === "PERCENTAGE" ? "10" : "180"}
                      />
                      <div className="flex items-center px-3 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
                        {commissionType === "PERCENTAGE" ? "%" : "$"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Markup price</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={markupPrice}
                        readOnly
                        className="flex-1 p-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50"
                        placeholder="1280"
                      />
                      <div className="flex items-center px-3 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
                        $
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter comments..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowSetMargin(false)}
                    disabled={isSubmittingCommission}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addCommission} 
                    disabled={isSubmittingCommission}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {isSubmittingCommission ? "Adding..." : "Add commission"}
                  </button>
                </div>
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
                <button 
                  onClick={() => setShowPDFPreview(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <iframe 
                src={selectedPDFUrl} 
                className="w-full h-full border rounded" 
                title="PDF Preview" 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DMCAdminInterface