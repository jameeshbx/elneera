"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Search, Download, ChevronDown, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useSession } from "next-auth/react"

// Types
interface Itinerary {
  id: string
  destinations: string
  startDate: string
  endDate: string
  duration?: string
  createdAt: string
  status: string
  enquiry: {
    id: string
    name: string
    phone: string
    email: string
    locations: string
    tourType: string
    estimatedDates: string
    currency: string
    budget: number
    enquiryDate: string
    assignedStaff: string
    leadSource: string
    tags: string
    mustSeeSpots: string
    flightsRequired: string
    notes: string
  }
}

interface DownloadLog {
  itineraryId: string
  downloadedAt: string
  fileName: string
}

const ExistingItineraryView = () => {
  const [, setItineraries] = useState<Itinerary[]>([])
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [,] = useState<"asc" | "desc">("desc")
  const [selectedItineraries, setSelectedItineraries] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([])
  const { data: session } = useSession()

  const fetchItineraries = useCallback(async () => {
    try {
      setLoading(true)

      if (!session?.user?.id) {
        setItineraries([])
        setFilteredItineraries([])
        setLoading(false)
        return
      }

      // Fetch only itineraries for the current user
      const response = await fetch(`/api/itineraries?userId=${session.user.id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch itineraries")
      }

      const itineraries = Array.isArray(result) ? result : []

      // Calculate duration for each itinerary
      const itinerariesWithDuration = itineraries.map((itinerary) => ({
        ...itinerary,
        duration: calculateDuration(itinerary.startDate, itinerary.endDate),
      }))

      setItineraries(itinerariesWithDuration)
      setFilteredItineraries(itinerariesWithDuration)
    } catch (error) {
      console.error("Error fetching itineraries:", error)
      toast.error("Failed to fetch itineraries")
      setItineraries([])
      setFilteredItineraries([])
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchItineraries()
  }, [fetchItineraries])

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return "N/A"

    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const nights = diffDays - 1

      return `${diffDays}D/${nights}N`
    } catch {
      return "N/A"
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItineraries(filteredItineraries.map((i) => i.id))
    } else {
      setSelectedItineraries([])
    }
  }

  const handleSelectItinerary = (itineraryId: string, checked: boolean) => {
    if (checked) {
      setSelectedItineraries((prev) => [...prev, itineraryId])
    } else {
      setSelectedItineraries((prev) => prev.filter((id) => id !== itineraryId))
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const handleDownload = async (itinerary: Itinerary) => {
    try {
      setDownloadingId(itinerary.id)

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itineraryId: itinerary.id,
          enquiryId: itinerary.enquiry?.id,
          formData: {
            customerName: itinerary.enquiry?.name,
            customerEmail: itinerary.enquiry?.email,
            customerPhone: itinerary.enquiry?.phone,
            destinations: itinerary.destinations.split(",").map((d) => d.trim()),
            startDate: itinerary.startDate,
            endDate: itinerary.endDate,
            travelType: itinerary.enquiry?.tourType,
            budget: itinerary.enquiry?.budget,
            currency: itinerary.enquiry?.currency,
            adults: 2,
            children: 0,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to generate PDF")
      }

      const data = await response.json()

      const downloadLog: DownloadLog = {
        itineraryId: itinerary.id,
        downloadedAt: new Date().toISOString(),
        fileName: data.filename || `itinerary-${itinerary.id}.pdf`,
      }
      setDownloadLogs((prev) => [...prev, downloadLog])

      if (data.pdfUrl) {
        const link = document.createElement("a")
        link.href = data.pdfUrl
        link.download = downloadLog.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success(`PDF downloaded successfully at ${new Date().toLocaleTimeString()}`)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error(error instanceof Error ? error.message : "Failed to download PDF")
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your itineraries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search destinations or customer name..."
                className="pl-9 w-80"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48 justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange?.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yy")} - {format(dateRange.to, "dd MMM yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yy")
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: DateRange | undefined) => setDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="destinations">Destination</SelectItem>
                <SelectItem value="name">Customer Name</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm p-0 mb-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={
                        filteredItineraries.length > 0 && selectedItineraries.length === filteredItineraries.length
                      }
                      onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Travel Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItineraries.map((itinerary) => (
                  <tr key={itinerary.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedItineraries.includes(itinerary.id)}
                        onCheckedChange={(checked: boolean) => handleSelectItinerary(itinerary.id, checked)}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{itinerary.destinations}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{itinerary.duration}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {formatDate(itinerary.startDate)} to {formatDate(itinerary.endDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{formatDate(itinerary.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(itinerary)}
                          disabled={downloadingId === itinerary.id}
                          className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {downloadingId === itinerary.id ? "Downloading..." : "Download"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredItineraries.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No itineraries found</h3>
                <p className="text-sm">You haven&apos;t created any itineraries yet</p>       
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Download Logs */}
      {downloadLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Download History</h3>
          <div className="space-y-2">
            {downloadLogs.map((log, index) => (
              <div key={index} className="text-xs text-gray-600 flex justify-between">
                <span>{log.fileName}</span>
                <span>{new Date(log.downloadedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExistingItineraryView
