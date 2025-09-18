"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Types
interface Enquiry {
  id: string
  name: string
  phone: string
  email: string
  locations: string
  tourType: string
  estimatedDates: string
  currency: string
  budget: number
  notes: string
  assignedStaff: string
  pointOfContact: string
  pickupLocation: string
  dropLocation: string
  numberOfTravellers: string
  numberOfKids: string
  travelingWithPets: string
  flightsRequired: string
  leadSource: string
  tags: string
  mustSeeSpots: string
  status: string
  enquiryDate: string
  createdAt?: string
  updatedAt?: string
  paymentStatus?: string
  bookingStatus?: string
}

const paymentStatusColors = {
  PAID: "bg-green-100 text-green-800 hover:bg-green-200",
  UNPAID: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  REFUNDED: "bg-red-100 text-red-800 hover:bg-red-200",
}

const bookingStatusColors = {
  Confirmed: "bg-green-100 text-green-800 hover:bg-green-200",
  Pending: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  Cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
}

export default function ViewLeads() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedEnquiries, setSelectedEnquiries] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [showCalendar, setShowCalendar] = useState(false)

  const router = useRouter()

  const [filters, setFilters] = useState({
    leadSource: [] as string[],
    tags: [] as string[],
    pointOfContact: [] as string[],
    status: [] as string[],
    tourType: [] as string[],
    paymentStatus: [] as string[],
    bookingStatus: [] as string[],
    dateRange: { from: null as Date | null, to: null as Date | null },
  })

  // Dummy data generator for payment and booking status
  const generateDummyStatuses = (enquiries: Enquiry[]) => {
    const paymentStatuses = ["PAID", "UNPAID", "PARTIALLY_PAID", "REFUNDED"]
    const bookingStatuses = ["Confirmed", "Pending", "Cancelled"]

    return enquiries.map((enquiry) => ({
      ...enquiry,
      paymentStatus: enquiry.paymentStatus || paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      bookingStatus: enquiry.bookingStatus || bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)],
    }))
  }

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/enquiries")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch enquiries")
      }

      const enquiries = Array.isArray(result) ? result : []
      // Add dummy payment and booking statuses
      const enquiriesWithStatuses = generateDummyStatuses(enquiries)
      setEnquiries(enquiriesWithStatuses)
      setFilteredEnquiries(enquiriesWithStatuses)
    } catch {
      console.error("Error fetching enquiries")
      toast.error("Failed to fetch enquiries")
      setEnquiries([])
      setFilteredEnquiries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])

  // Filter and sort enquiries
  useEffect(() => {
    const filtered = enquiries.filter((enquiry) => {
      const matchesSearch =
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.locations.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilters = Object.entries(filters).every(([key, values]) => {
        if (key === "dateRange") return true
        if (!Array.isArray(values) || values.length === 0) return true
        return values.includes(enquiry[key as keyof Enquiry] as string)
      })

      return matchesSearch && matchesFilters
    })

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue: string | number | Date = a.createdAt as string | number
      const bValue: string | number | Date = b.createdAt as string | number

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredEnquiries(filtered)
    setCurrentPage(1)
  }, [enquiries, searchTerm, filters, sortOrder, dateRange])

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: checked
        ? [...(prev[filterType as keyof typeof prev] as string[]), value]
        : (prev[filterType as keyof typeof prev] as string[]).filter((item) => item !== value),
    }))
  }

  // Pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEnquiries = filteredEnquiries.slice(startIndex, endIndex)

  // Pagination info
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, startPage + 4)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap pb-0 w-full max-w-5xl mx-auto -mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for..."
                className="pl-9 w-30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Lead Source Dropdown */}
            <Select
              onValueChange={(value) => handleFilterChange("leadSource", value, !filters.leadSource.includes(value))}
            >
              <SelectTrigger className="w-30 bg-green-800 text-white">
                <SelectValue placeholder="Lead source" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set(enquiries.map((item) => item.leadSource)))
                  .filter(Boolean)
                  .map((source) => (
                    <SelectItem key={source} value={source}>
                      <div className="flex items-center">
                        <Checkbox checked={filters.leadSource.includes(source)} className="mr-2" />
                        {source}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Tags Dropdown */}
            <Select onValueChange={(value) => handleFilterChange("tags", value, !filters.tags.includes(value))}>
              <SelectTrigger className="w-28 bg-green-800 text-white">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set(enquiries.map((item) => item.tags)))
                  .filter(Boolean)
                  .map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      <div className="flex items-center text-sm">
                        <Badge className="bg-green-100 text-green-800 mr-2">{tag}</Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Point of Contact Dropdown */}
            <Select
              onValueChange={(value) =>
                handleFilterChange("pointOfContact", value, !filters.pointOfContact.includes(value))
              }
            >
              <SelectTrigger className="w-30 bg-green-800 text-white">
                <SelectValue placeholder="Point of contact" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set(enquiries.map((item) => item.pointOfContact)))
                  .filter(Boolean)
                  .map((contact) => (
                    <SelectItem key={contact} value={contact}>
                      <div className="flex items-center text-sm">
                        <Checkbox checked={filters.pointOfContact.includes(contact)} className="mr-2" />
                        {contact}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Date Calendar */}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button className="w-48 justify-start text-black font-normal bg-gray-200 hover:bg-gray-200">
                  <Calendar className="mr-2 h-3 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
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
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    })
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Button className="bg-white hover:bg-emerald-700 text-black border border-green-300 flex items-center gap-2">
              <Plus className="h-4 w-4 mr-2" />
              Add enquiry
            </Button>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => router.push("/agency/dashboard/enquiry/view-leads/exist-Itenary-view")}
            >
              Set existing itinerary
            </Button>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              Sort {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={currentEnquiries.length > 0 && selectedEnquiries.length === currentEnquiries.length}
                    onCheckedChange={(checked) =>
                      setSelectedEnquiries(checked ? currentEnquiries.map((e) => e.id) : [])
                    }
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Enquiry ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Name & Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Location(s)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Lead source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Point of contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Assigned to
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Payment status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 font-semibold uppercase tracking-wider">
                  Booking status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentEnquiries.map((enquiry) => (
                <tr key={enquiry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedEnquiries.includes(enquiry.id)}
                      onCheckedChange={(checked) =>
                        setSelectedEnquiries((prev) =>
                          checked ? [...prev, enquiry.id] : prev.filter((id) => id !== enquiry.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(enquiry.createdAt || enquiry.enquiryDate)}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-blue-600">{enquiry.id}</td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{enquiry.name}</div>
                      <div className="text-sm text-gray-500">{enquiry.email}</div>
                      <div className="text-sm text-gray-500">{enquiry.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {enquiry.locations || "Not specified"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{enquiry.leadSource}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{enquiry.pointOfContact || "Not assigned"}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{enquiry.assignedStaff || "Unassigned"}</td>
                  <td className="px-4 py-4">
                    <Badge
                      className={`${paymentStatusColors[enquiry.paymentStatus as keyof typeof paymentStatusColors] || "bg-gray-100 text-gray-800"} px-2 py-1 rounded-full text-xs`}
                    >
                      {enquiry.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      className={`${bookingStatusColors[enquiry.bookingStatus as keyof typeof bookingStatusColors] || "bg-gray-100 text-gray-800"} px-2 py-1 rounded-full text-xs`}
                    >
                      {enquiry.bookingStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {currentEnquiries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No enquiries found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {currentEnquiries.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{endIndex}</span> of{" "}
                  <span className="font-medium">{filteredEnquiries.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </Button>

                  {/* Page numbers */}
                  {(() => {
                    const pages = []
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i)
                    }

                    return pages.map((pageNum) => (
                      <Button
                        key={`page-${pageNum}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                      >
                        {pageNum}
                      </Button>
                    ))
                  })()}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const formatDate = (dateString: string) => {
  try {
    if (dateString.includes("-") && dateString.split("-")[0].length === 2) {
      const [day, month, year] = dateString.split("-")
      return `${day}-${month}-${year}`
    } else if (dateString.includes("T")) {
      return format(new Date(dateString), "dd-MM-yyyy")
    } else {
      return dateString
    }
  } catch {
    return dateString
  }
}
