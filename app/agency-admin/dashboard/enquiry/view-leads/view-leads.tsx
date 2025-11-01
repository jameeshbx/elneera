"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Calendar, X, ChevronDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

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
  assignedStaffName?: string
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

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    if (!dateString) return "-"
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      if (dateString.includes("-") && dateString.split("-")[0].length === 2) {
        return dateString
      }
      return dateString || "-"
    }
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}-${month}-${year}`
  } catch {
    return dateString || "-"
  }
}

const formatDateShort = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear().toString().slice(-2)
  return `${day} ${month} ${year}`
}

// Fetch staff data from API
const fetchStaffName = async (staffId: string) => {
  try {
    const response = await fetch(`/api/staff/${staffId}`)
    if (!response.ok) return staffId
    const data = await response.json()
    return data.name || staffId
  } catch {
    return staffId
  }
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
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/enquiries")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch enquiries")
      }

      const enquiries = Array.isArray(result) ? result : []
      
      // Fetch staff names for all enquiries
      const enquiriesWithStaffNames = await Promise.all(
        enquiries.map(async (enquiry) => {
          if (enquiry.assignedStaff) {
            const staffName = await fetchStaffName(enquiry.assignedStaff)
            return { ...enquiry, assignedStaffName: staffName }
          }
          return { ...enquiry, assignedStaffName: 'Unassigned' }
        })
      )
      
      setEnquiries(enquiriesWithStaffNames)
      setFilteredEnquiries(enquiriesWithStaffNames)
    } catch (error) {
      console.error("Error fetching enquiries:", error)
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
    let filtered = [...enquiries]

    if (searchTerm) {
      filtered = filtered.filter((enquiry) => {
        const search = searchTerm.toLowerCase()
        return (
          enquiry.name?.toLowerCase().includes(search) ||
          enquiry.email?.toLowerCase().includes(search) ||
          enquiry.phone?.toLowerCase().includes(search) ||
          enquiry.locations?.toLowerCase().includes(search) ||
          enquiry.id?.toLowerCase().includes(search)
        )
      })
    }

    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((enquiry) => {
        const enquiryDate = new Date(enquiry.createdAt || enquiry.enquiryDate)
        if (dateRange.from && enquiryDate < dateRange.from) return false
        if (dateRange.to && enquiryDate > dateRange.to) return false
        return true
      })
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.enquiryDate).getTime()
      const bDate = new Date(b.createdAt || b.enquiryDate).getTime()

      if (sortOrder === "asc") {
        return aDate - bDate
      } else {
        return bDate - aDate
      }
    })

    setFilteredEnquiries(filtered)
    setCurrentPage(1)
  }, [enquiries, searchTerm, sortOrder, dateRange])

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  const hasActiveFilters = 
    dateRange.from || 
    dateRange.to ||
    searchTerm

  const clearAllFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    setSearchTerm("")
  }

  const handleNameClick = (enquiryId: string) => {
    window.location.href = `/agency-admin/dashboard/Itenary-form?enquiryId=${enquiryId}`
  }

  const handleAddEnquiry = () => {
    window.location.href = "/agency-admin/dashboard/enquiry"
  }

  // Pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEnquiries = filteredEnquiries.slice(startIndex, endIndex)

  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, startPage + 4)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-xs sm:text-sm md:text-base text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-5 lg:p-6 mb-3 sm:mb-4 md:mb-6">
        {/* Search and Action Buttons */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
         

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
             <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5  sm:h-4 sm:w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone..."
              className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
              onClick={handleAddEnquiry}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Add enquiry
            </Button>

            <Button
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
              onClick={() => window.location.href = "/agency-admin/dashboard/enquiry/view-leads/exist-Itenary-view"}
            >
              Set existing itinerary
            </Button>

 <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-auto min-w-[160px] lg:min-w-[180px] h-9 md:h-10 justify-start text-left font-normal text-xs sm:text-sm"
              >
                <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {formatDateShort(dateRange.from)} - {formatDateShort(dateRange.to)}
                    </>
                  ) : (
                    formatDateShort(dateRange.from)
                  )
                ) : (
                  <span>Select date range</span>
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

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-9 md:h-10 text-xs sm:text-sm"
          >
            Sort {sortOrder === "asc" ? "↑" : "↓"}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="h-9 md:h-10 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear all
            </Button>
          )}

          </div>
        </div>

        {/* Filter Row - Desktop */}
        
        
        </div>

        {/* Filter Button - Mobile/Tablet */}
        <div className="md:hidden">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full h-9 sm:h-10 justify-between text-xs sm:text-sm"
          >
            <span className="flex items-center">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-emerald-600 text-white text-xs px-1.5 py-0.5">
                  {(dateRange.from ? 1 : 0) + (searchTerm ? 1 : 0)}
                </Badge>
              )}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
          </Button>

          {showMobileFilters && (
            <div className="mt-2 sm:mt-3 space-y-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-9 sm:h-10 justify-start text-left font-normal text-xs sm:text-sm"
                  >
                    <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDateShort(dateRange.from)} - {formatDateShort(dateRange.to)}
                        </>
                      ) : (
                        formatDateShort(dateRange.from)
                      )
                    ) : (
                      <span>Select date range</span>
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
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Sort {sortOrder === "asc" ? "↑" : "↓"}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
            {searchTerm && (
              <Badge variant="secondary" className="pl-2 sm:pl-3 pr-1 py-0.5 sm:py-1 text-xs">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm("")} className="ml-1.5 sm:ml-2 hover:bg-gray-300 rounded-full p-0.5">
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </Badge>
            )}
            {(dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="pl-2 sm:pl-3 pr-1 py-0.5 sm:py-1 text-xs">
                Date: {dateRange.from && formatDateShort(dateRange.from)}
                {dateRange.to && ` - ${formatDateShort(dateRange.to)}`}
                <button onClick={clearDateRange} className="ml-1.5 sm:ml-2 hover:bg-gray-300 rounded-full p-0.5">
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
   

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-2 sm:space-y-3">
        {currentEnquiries.map((enquiry) => (
          <div key={enquiry.id} className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handleNameClick(enquiry.id)}
                  className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left break-words"
                >
                  {enquiry.name}
                </button>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 font-mono">{enquiry.id}</p>
              </div>
              <Checkbox
                checked={selectedEnquiries.includes(enquiry.id)}
                onCheckedChange={(checked) =>
                  setSelectedEnquiries((prev) =>
                    checked ? [...prev, enquiry.id] : prev.filter((id) => id !== enquiry.id),
                  )
                }
                className="ml-2 flex-shrink-0"
              />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 flex-shrink-0">Date:</span>
                <span className="text-gray-900 font-medium text-right">{formatDate(enquiry.createdAt || enquiry.enquiryDate)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 flex-shrink-0">Location:</span>
                <span className="text-gray-900 text-right break-words">{enquiry.locations || "Not specified"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 flex-shrink-0">Lead source:</span>
                <span className="text-gray-900 text-right">{enquiry.leadSource || "-"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 flex-shrink-0">Point of contact:</span>
                <span className="text-gray-900 text-right">{enquiry.pointOfContact || "Not assigned"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 flex-shrink-0">Assigned to:</span>
                <span className="text-gray-900 text-right">{enquiry.assignedStaffName || "Unassigned"}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge
                className={`${paymentStatusColors[enquiry.paymentStatus as keyof typeof paymentStatusColors] || "bg-gray-100 text-gray-800"} px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium`}
              >
                {enquiry.paymentStatus || "UNPAID"}
              </Badge>
              <Badge
                className={`${bookingStatusColors[enquiry.bookingStatus as keyof typeof bookingStatusColors] || "bg-gray-100 text-gray-800"} px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium`}
              >
                {enquiry.bookingStatus || "Pending"}
              </Badge>
            </div>
          </div>
        ))}

        {/* Empty state - Mobile */}
        {currentEnquiries.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-1 sm:mb-2">No enquiries found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Try adjusting your search or filter criteria</p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="text-xs sm:text-sm"
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 xl:px-4 py-3 text-left w-10 xl:w-12">
                  <Checkbox
                    checked={currentEnquiries.length > 0 && selectedEnquiries.length === currentEnquiries.length}
                    onCheckedChange={(checked) =>
                      setSelectedEnquiries(checked ? currentEnquiries.map((e) => e.id) : [])
                    }
                  />
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Enquiry ID
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location(s)
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Lead source
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Point of contact
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned to
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment status
                </th>
                <th className="px-3 xl:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Booking status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentEnquiries.map((enquiry) => (
                <tr key={enquiry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 xl:px-4 py-3 xl:py-4">
                    <Checkbox
                      checked={selectedEnquiries.includes(enquiry.id)}
                      onCheckedChange={(checked) =>
                        setSelectedEnquiries((prev) =>
                          checked ? [...prev, enquiry.id] : prev.filter((id) => id !== enquiry.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4 text-xs xl:text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(enquiry.createdAt || enquiry.enquiryDate)}
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4 text-xs xl:text-sm text-gray-700 font-mono whitespace-nowrap">
                    {enquiry.id}
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4">
                    <button
                      onClick={() => handleNameClick(enquiry.id)}
                      className="text-xs xl:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                    >
                      {enquiry.name}
                    </button>
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4 text-xs xl:text-sm text-gray-700 max-w-[150px] xl:max-w-xs">
                    <div className="truncate" title={enquiry.locations}>
                      {enquiry.locations || "Not specified"}
                    </div>
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4 text-xs xl:text-sm text-gray-700 whitespace-nowrap">
                    {enquiry.leadSource || "-"}
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4 text-xs xl:text-sm text-gray-700 whitespace-nowrap">
                    {enquiry.pointOfContact || "Not assigned"}
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4 text-xs xl:text-sm text-gray-700 whitespace-nowrap">
                    {enquiry.assignedStaffName || "Unassigned"}
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4">
                    <Badge
                      className={`${paymentStatusColors[enquiry.paymentStatus as keyof typeof paymentStatusColors] || "bg-gray-100 text-gray-800"} px-2 xl:px-3 py-0.5 xl:py-1 rounded-full text-xs font-medium`}
                    >
                      {enquiry.paymentStatus || "UNPAID"}
                    </Badge>
                  </td>
                  <td className="px-3 xl:px-4 py-3 xl:py-4">
                    <Badge
                      className={`${bookingStatusColors[enquiry.bookingStatus as keyof typeof bookingStatusColors] || "bg-gray-100 text-gray-800"} px-2 xl:px-3 py-0.5 xl:py-1 rounded-full text-xs font-medium`}
                    >
                      {enquiry.bookingStatus || "Pending"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state - Desktop */}
        {currentEnquiries.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No enquiries found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {currentEnquiries.length > 0 && (
          <div className="bg-gray-50 px-3 xl:px-4 py-3 xl:py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-3 xl:gap-4">
            <div className="flex-1 flex justify-between sm:hidden w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
              <div>
                <p className="text-xs xl:text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredEnquiries.length)}</span> of{" "}
                  <span className="font-medium">{filteredEnquiries.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                    className="rounded-r-none text-xs xl:text-sm"
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-none text-xs xl:text-sm"
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
                        className={`rounded-none text-xs xl:text-sm ${currentPage === pageNum ? "bg-emerald-600 text-white hover:bg-emerald-700 z-10" : ""}`}
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
                    className="rounded-none text-xs xl:text-sm"
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="rounded-l-none text-xs xl:text-sm"
                  >
                    »
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Pagination */}
      {currentEnquiries.length > 0 && (
        <div className="lg:hidden bg-white rounded-lg shadow-sm p-3 sm:p-4 mt-3 sm:mt-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {filteredEnquiries.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex-1 text-xs sm:text-sm"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex-1 text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}