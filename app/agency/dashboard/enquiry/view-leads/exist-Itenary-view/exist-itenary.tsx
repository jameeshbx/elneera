"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Search, Download, Share, ChevronDown, X, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

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

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  itinerary: Itinerary | null
}

const ShareModal = ({ isOpen, onClose, itinerary }: ShareModalProps) => {
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedLead, setSelectedLead] = useState("")

  useEffect(() => {
    if (itinerary && isOpen) {
      setEmail(itinerary.enquiry?.email || "")
      setWhatsapp(itinerary.enquiry?.phone || "")
      setSelectedLead(itinerary.enquiry?.name || "")
    }
  }, [itinerary, isOpen])

  const handleShare = () => {
    console.log("Sharing itinerary:", {
      itineraryId: itinerary?.id,
      email,
      whatsapp,
      notes,
      selectedLead,
    })
    toast.success("Itinerary shared successfully")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share to customer</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select lead<span className="text-red-500">*</span>
            </label>
            <Select value={selectedLead} onValueChange={(value: string) => setSelectedLead(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={itinerary?.enquiry?.name || ""}>{itinerary?.enquiry?.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email<span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              WhatsApp Number<span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsapp(e.target.value)}
              placeholder="+91 8973546243"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-20 resize-none"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Supporting document</label>
            <div className="flex gap-2">
              <Input type="file" className="flex-1" placeholder="Choose file" />
              <Button className="bg-green-600 hover:bg-green-700 text-white">Upload</Button>
            </div>
          </div>

          <Button onClick={handleShare} className="w-full bg-green-800 hover:bg-green-900 text-white mt-6">
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}

const ExistingItineraryView = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder] = useState<"asc" | "desc">("desc")
  const [selectedItineraries, setSelectedItineraries] = useState<string[]>([])
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const fetchItineraries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/itineraries")
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
  }, [])

  useEffect(() => {
    fetchItineraries()
  }, [fetchItineraries])

  // Filter and sort itineraries
  useEffect(() => {
    const filtered = itineraries.filter((itinerary) => {
      const matchesSearch =
        itinerary.destinations.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itinerary.enquiry?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itinerary.enquiry?.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (new Date(itinerary.startDate) >= dateRange.from && new Date(itinerary.endDate) <= dateRange.to)

      return matchesSearch && matchesDateRange
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "destinations":
          aValue = a.destinations.toLowerCase()
          bValue = b.destinations.toLowerCase()
          break
        case "name":
          aValue = (a.enquiry?.name || "").toLowerCase()
          bValue = (b.enquiry?.name || "").toLowerCase()
          break
        case "startDate":
          aValue = new Date(a.startDate || 0)
          bValue = new Date(b.startDate || 0)
          break
        default:
          const defaultA = a[sortBy as keyof Itinerary]
          const defaultB = b[sortBy as keyof Itinerary]
          aValue =
            typeof defaultA === "string" || typeof defaultA === "number" || defaultA instanceof Date
              ? defaultA
              : String(defaultA || "")
          bValue =
            typeof defaultB === "string" || typeof defaultB === "number" || defaultB instanceof Date
              ? defaultB
              : String(defaultB || "")
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredItineraries(filtered)
  }, [itineraries, searchTerm, sortBy, sortOrder, dateRange])

  const handleShare = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary)
    setShareModalOpen(true)
  }

  const handleDownload = async () => {
    try {
      // Implementation for download
      toast.success("Itinerary downloaded successfully")
    } catch {
      toast.error("Failed to download itinerary")
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading itineraries...</p>
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
                placeholder="Search for..."
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
                    <span>28 Mar 25 - 10 Apr 25</span>
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

            {/* Sort By - FIXED */}
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
                    Itinerary Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created For
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date Created
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
                    <td className="px-4 py-4">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        onClick={() => {
                          // Navigate to itinerary details or edit
                          console.log("View itinerary:", itinerary.id)
                        }}
                      >
                        {itinerary.enquiry?.name || "Untitled Itinerary"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{itinerary.destinations}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{itinerary.duration}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {itinerary.enquiry?.assignedStaff || itinerary.enquiry?.name || "N/A (Saved only)"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{formatDate(itinerary.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleDownload}
                          className="flex items-center gap-1 bg-gray-500 hover:bg-gray-400 text-white"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          className="bg-green-800 hover:bg-green-800 text-white flex items-center gap-1"
                          size="sm"
                          onClick={() => handleShare(itinerary)}
                        >
                          <Share className="h-4 w-4" />
                          Share
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
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} itinerary={selectedItinerary} />
      )}
    </div>
  )
}

export default ExistingItineraryView
