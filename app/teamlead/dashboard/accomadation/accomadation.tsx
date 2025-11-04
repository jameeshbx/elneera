"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, ChevronDown, Plus, ArrowUpRight, X, Check } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { DragDropContext, type DropResult } from "react-beautiful-dnd"

// Types for Accommodation Enquiry
interface AccommodationEnquiry {
  id: string
  name: string
  phone: string
  email: string
  locations: string[]
  startDate: string
  endDate: string
  adults: number
  children: number
  under5: number
  from6to12: number
  budget: number
  accommodationType: string[]
  hotelPreference: string[]
  assignedStaff: string
  pointOfContact: string
  notes: string
  leadSource: string
  status: string
  enquiryDate: string
  createdAt?: string
  updatedAt?: string
}

interface Column {
  id: string
  title: string
  icon: string
  enquiries: AccommodationEnquiry[]
}

const generateUniqueId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const accommodationColumns: Column[] = [
  { id: "enquiry", title: "Enquiry", icon: "🏨", enquiries: [] },
  { id: "availability_check", title: "Availability Check", icon: "🔍", enquiries: [] },
  { id: "quote_generation", title: "Quote Generation", icon: "💰", enquiries: [] },
  { id: "customer_review", title: "Customer Review", icon: "👀", enquiries: [] },
  { id: "booking_confirmed", title: "Booking Confirmed", icon: "✅", enquiries: [] },
  { id: "payment_processing", title: "Payment Processing", icon: "💳", enquiries: [] },
  { id: "confirmed", title: "Confirmed", icon: "🎉", enquiries: [] },
  { id: "cancelled", title: "Cancelled", icon: "❌", enquiries: [] },
]

const accommodationColumnMessages: Record<string, string> = {
  enquiry: "Awaiting accommodation request",
  availability_check: "Checking room availability",
  quote_generation: "Generating accommodation quotes",
  customer_review: "Awaiting customer decision",
  booking_confirmed: "Accommodation booking confirmed",
  payment_processing: "Processing payment",
  confirmed: "Accommodation confirmed",
  cancelled: "Accommodation booking cancelled",
}

const availableLocations = ["Srinagar", "Gulmarg", "Pahalgam", "Sonamarg", "Leh", "Kargil"]

const accommodationTypes = [
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "homestay", label: "Homestay" },
  { value: "guesthouse", label: "Guest House" },
]

const hotelOptions = [
  { value: "standard-1-star", label: "Standard (1 Star)" },
  { value: "premium-4-star", label: "Premium (4 Star)" },
  { value: "budget", label: "Budget" },
  { value: "luxury", label: "Luxury" },
]

export default function AccommodationDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [columns, setColumns] = useState<Column[]>(accommodationColumns)
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredEnquiry, setHoveredEnquiry] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showAccommodationDropdown, setShowAccommodationDropdown] = useState(false)
  const [showHotelDropdown, setShowHotelDropdown] = useState(false)

  const [newAccommodationEnquiry, setNewAccommodationEnquiry] = useState<
    Omit<AccommodationEnquiry, "id" | "status" | "enquiryDate">
  >({
    name: "",
    phone: "",
    email: "",
    locations: [],
    startDate: "",
    endDate: "",
    adults: 2,
    children: 0,
    under5: 0,
    from6to12: 0,
    budget: 500,
    accommodationType: [],
    hotelPreference: [],
    assignedStaff: "",
    pointOfContact: "",
    notes: "",
    leadSource: "Direct",
  })

  useEffect(() => {
    setIsClient(true)
    fetchAccommodationEnquiries()
  }, [])

  const fetchAccommodationEnquiries = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/accommodation-enquiries")
      console.log("Fetched accommodation enquiries:", response.data)

      const enquiries = Array.isArray(response.data) ? response.data : []

      const cols = accommodationColumns.map((col) => ({
        ...col,
        enquiries: enquiries.filter((e: AccommodationEnquiry) => e.status === col.id),
      }))

      setColumns(cols)
    } catch (error) {
      console.error("Error fetching accommodation enquiries:", error)
      toast.error("Failed to fetch accommodation enquiries")
      setColumns(accommodationColumns.map((col) => ({ ...col, enquiries: [] })))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateCounter = (field: "adults" | "children" | "under5" | "from6to12", increment: boolean) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1)),
    }))
  }

  const toggleLocation = (location: string) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter((item) => item !== location)
        : [...prev.locations, location],
    }))
  }

  const toggleAccommodationType = (type: string) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      accommodationType: prev.accommodationType.includes(type)
        ? prev.accommodationType.filter((item) => item !== type)
        : [...prev.accommodationType, type],
    }))
  }

  const toggleHotelPreference = (preference: string) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      hotelPreference: prev.hotelPreference.includes(preference)
        ? prev.hotelPreference.filter((item) => item !== preference)
        : [...prev.hotelPreference, preference],
    }))
  }

  const removeLocation = (location: string) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      locations: prev.locations.filter((item) => item !== location),
    }))
  }

  const removeAccommodationType = (type: string) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      accommodationType: prev.accommodationType.filter((item) => item !== type),
    }))
  }

  const removeHotelPreference = (preference: string) => {
    setNewAccommodationEnquiry((prev) => ({
      ...prev,
      hotelPreference: prev.hotelPreference.filter((item) => item !== preference),
    }))
  }

  const handleAddAccommodationEnquiry = async () => {
    try {
      if (!newAccommodationEnquiry.name || !newAccommodationEnquiry.phone || !newAccommodationEnquiry.email) {
        toast.error("Please fill in all required fields")
        return
      }

      const today = new Date()
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${today.getFullYear()}`

      const newEnquiryWithId: AccommodationEnquiry = {
        ...newAccommodationEnquiry,
        id: generateUniqueId(),
        status: "enquiry",
        enquiryDate: formattedDate,
      }

      console.log("Sending accommodation enquiry data:", newEnquiryWithId)

      const response = await axios.post("/api/accommodation-enquiries", newEnquiryWithId)

      console.log("Accommodation enquiry created:", response.data)

      toast.success("Accommodation Enquiry Added", {
        description: `New accommodation enquiry for ${newEnquiryWithId.name} has been added successfully.`,
      })

      setIsDialogOpen(false)
      resetForm()
      await fetchAccommodationEnquiries()
    } catch (error) {
      console.error("Error adding accommodation enquiry:", error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to add accommodation enquiry. Please try again."

      toast.error("Error", {
        description: errorMessage,
      })
    }
  }

  const resetForm = () => {
    setNewAccommodationEnquiry({
      name: "",
      phone: "",
      email: "",
      locations: [],
      startDate: "",
      endDate: "",
      adults: 2,
      children: 0,
      under5: 0,
      from6to12: 0,
      budget: 500,
      accommodationType: [],
      hotelPreference: [],
      assignedStaff: "",
      pointOfContact: "",
      notes: "",
      leadSource: "Direct",
    })
  }

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source } = result

      // Handle undefined destination explicitly for type safety
      if (
        !destination ||
        destination === undefined ||
        (destination.droppableId === source.droppableId && destination.index === source.index)
      ) {
        return
      }

      const sourceColumn = columns.find((col) => col.id === source.droppableId)
      const movedEnquiry = sourceColumn?.enquiries[source.index]

      if (!movedEnquiry) return

      setColumns((prevColumns) => {
        const newColumns = JSON.parse(JSON.stringify(prevColumns))
        const sourceColIndex = newColumns.findIndex((col: Column) => col.id === source.droppableId)
        const destColIndex = newColumns.findIndex((col: Column) => col.id === destination.droppableId)

        if (sourceColIndex === -1 || destColIndex === -1) {
          return prevColumns
        }

        const movedItem = newColumns[sourceColIndex].enquiries[source.index]
        newColumns[sourceColIndex].enquiries.splice(source.index, 1)

        const updatedItem = {
          ...movedItem,
          status: destination.droppableId as AccommodationEnquiry["status"],
        }

        newColumns[destColIndex].enquiries.splice(destination.index, 0, updatedItem)

        return newColumns
      })

      try {
        const response = await axios.put("/api/accommodation-enquiries", {
          id: movedEnquiry.id,
          status: destination.droppableId,
        })

        console.log("Accommodation enquiry status updated:", response.data)

        const destColumn = accommodationColumns.find((col) => col.id === destination.droppableId)
        toast.success("Accommodation Enquiry Updated", {
          description: `${movedEnquiry.name}'s accommodation enquiry moved to ${destColumn?.title}`,
        })
      } catch (error) {
        console.error("Error updating accommodation enquiry:", error)
        toast.error("Failed to update accommodation enquiry status")
        await fetchAccommodationEnquiries()
      }
    },
    [columns, accommodationColumns],
  )

  const filteredColumns = columns.map((column) => ({
    ...column,
    enquiries: column.enquiries.filter(
      (enquiry) =>
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.phone.includes(searchTerm) ||
        enquiry.locations.some((loc) => loc.toLowerCase().includes(searchTerm.toLowerCase())),
    ),
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accommodation enquiries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col w-full overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-100 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:justify-between sm:items-center">
          <div className="relative w-[180px] sm:w-64 bg-white">
            <Search className="absolute left-2 top-2.5 h-4 w-4" />
            <input
              type="text"
              placeholder="Search accommodation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 bg-white border border-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition-colors w-full rounded-md px-3"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
              Sort by
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="bg-white hover:bg-white text-green-800 border-2 border-green-600 text-sm sm:text-base flex items-center gap-1 px-4 py-2 rounded-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add Accommodation Enquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Columns area */}
      <div className="relative flex-1 p-2 sm:p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {isClient ? (
              <div className="flex gap-4">
                {filteredColumns.map((column) => (
                  <div
                    key={column.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[240px] w-[240px] sm:w-[260px] flex-shrink-0 h-[calc(100vh-180px)] sm:h-[calc(100vh-140px)]"
                  >
                    {/* Column header */}
                    <div className="p-3 sm:p-4 shadow-sm rounded-t-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 sm:p-3 rounded-md text-2xl">{column.icon}</div>
                        <h3 className="font-semibold text-sm sm:text-base">{column.title}</h3>
                      </div>
                    </div>

                    {/* Enquiries list */}
                    <div className="p-2 sm:p-3 overflow-y-auto h-[calc(100%-76px)]">
                      {column.enquiries.map((enquiry, index) => (
                        <div
                          key={enquiry.id}
                          className="bg-white rounded-lg p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-shadow relative cursor-move"
                          onMouseEnter={() => setHoveredEnquiry(enquiry.id)}
                          onMouseLeave={() => setHoveredEnquiry(null)}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "text/plain",
                              JSON.stringify({
                                enquiryId: enquiry.id,
                                sourceColumnId: column.id,
                                sourceIndex: index,
                              }),
                            )
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm sm:text-base">{enquiry.name}</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">{enquiry.phone}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{enquiry.email}</p>
                            <p className="text-xs sm:text-sm text-purple-600">{enquiry.locations.join(", ")}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {enquiry.adults} Adults, {enquiry.children} Children
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs sm:text-sm text-green-500">Enquiry on: {enquiry.enquiryDate}</p>
                              <div className="relative group">
                                <button
                                  className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-black hover:bg-gray-100 transition-colors"
                                  onClick={() => console.log("Process accommodation for:", enquiry.id)}
                                >
                                  <ArrowUpRight className="w-4 h-4 text-gray-600" />
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  Process Accommodation
                                </div>
                              </div>
                            </div>
                            {hoveredEnquiry === enquiry.id && (
                              <div className="absolute -bottom-20 right-0 bg-purple-100 p-2 sm:p-3 rounded-md shadow-sm w-40 sm:w-48 z-10">
                                <p className="text-xs sm:text-sm text-purple-800 font-medium">
                                  {accommodationColumnMessages[column.id]}
                                </p>
                                <p className="text-xs sm:text-sm text-purple-800 mt-1 truncate">
                                  Assigned: {enquiry.assignedStaff || "Unassigned"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex justify-center items-center">
                <div className="p-4">Loading accommodation enquiries...</div>
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      {/* Add Accommodation Enquiry Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Add Accommodation Enquiry</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Lead source */}
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium">Lead source</label>
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="Direct"
                        checked={newAccommodationEnquiry.leadSource === "Direct"}
                        onChange={(e) => handleInputChange("leadSource", e.target.value)}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm">Direct</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="Sub agent"
                        checked={newAccommodationEnquiry.leadSource === "Sub agent"}
                        onChange={(e) => handleInputChange("leadSource", e.target.value)}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm">Sub agent</span>
                    </label>
                  </div>
                </div>
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <input
                    type="text"
                    value={newAccommodationEnquiry.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Guest name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone No. *</label>
                  <div className="flex">
                    <div className="flex items-center border border-r-0 border-gray-300 rounded-l-md px-2 bg-gray-50">
                      🇮🇳
                      <span className="text-sm ml-1">+91</span>
                      <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={newAccommodationEnquiry.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={newAccommodationEnquiry.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                {/* Choose locations */}
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium">Choose locations</label>
                  <div className="relative">
                    <div
                      className="w-full min-h-12 p-3 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center"
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    >
                      {newAccommodationEnquiry.locations.map((location) => (
                        <div
                          key={location}
                          className="bg-orange-500 text-white px-3 py-1 text-xs flex items-center gap-1 rounded-full"
                        >
                          {location}
                          <X
                            className="h-3 w-3 cursor-pointer hover:bg-orange-600 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeLocation(location)
                            }}
                          />
                        </div>
                      ))}
                      {newAccommodationEnquiry.locations.length === 0 && (
                        <span className="text-gray-400">Select locations...</span>
                      )}
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {showLocationDropdown && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {availableLocations.map((location) => (
                          <div
                            key={location}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                            onClick={() => toggleLocation(location)}
                          >
                            {location}
                            {newAccommodationEnquiry.locations.includes(location) && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={newAccommodationEnquiry.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={newAccommodationEnquiry.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div></div> {/* Empty div for spacing */}
                {/* Adults */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adults (13+)</label>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateCounter("adults", false)}
                      className="px-3 py-2 border-r hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={newAccommodationEnquiry.adults}
                      onChange={(e) => handleInputChange("adults", Number.parseInt(e.target.value) || 0)}
                      className="text-center border-0 flex-1 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => updateCounter("adults", true)}
                      className="px-3 py-2 border-l hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Children */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Children</label>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateCounter("children", false)}
                      className="px-3 py-2 border-r hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={newAccommodationEnquiry.children}
                      onChange={(e) => handleInputChange("children", Number.parseInt(e.target.value) || 0)}
                      className="text-center border-0 flex-1 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => updateCounter("children", true)}
                      className="px-3 py-2 border-l hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Under 6 years */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Under 6 years</label>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateCounter("under5", false)}
                      className="px-3 py-2 border-r hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={newAccommodationEnquiry.under5}
                      onChange={(e) => handleInputChange("under5", Number.parseInt(e.target.value) || 0)}
                      className="text-center border-0 flex-1 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => updateCounter("under5", true)}
                      className="px-3 py-2 border-l hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* From 6-12 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From 6 - 12</label>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateCounter("from6to12", false)}
                      className="px-3 py-2 border-r hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={newAccommodationEnquiry.from6to12}
                      onChange={(e) => handleInputChange("from6to12", Number.parseInt(e.target.value) || 0)}
                      className="text-center border-0 flex-1 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => updateCounter("from6to12", true)}
                      className="px-3 py-2 border-l hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="col-span-3 text-xs text-gray-500 mt-2">*Please specify age for accurate pricing</div>
                {/* Budget */}
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium">Budget</label>
                  <div className="pt-2 px-2">
                    <input
                      type="range"
                      min="10"
                      max="50000"
                      step="10"
                      value={newAccommodationEnquiry.budget}
                      onChange={(e) => handleInputChange("budget", Number.parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>$10</span>
                      <div className="bg-green-100 px-2 py-1 rounded text-green-800">
                        ${newAccommodationEnquiry.budget}
                      </div>
                      <span>$50,000</span>
                    </div>
                  </div>
                </div>
                {/* Accommodation Type */}
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium">Accommodation Type</label>
                  <div className="relative">
                    <div
                      className="w-full min-h-12 p-3 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center"
                      onClick={() => setShowAccommodationDropdown(!showAccommodationDropdown)}
                    >
                      {newAccommodationEnquiry.accommodationType.map((type) => (
                        <div
                          key={type}
                          className="bg-orange-500 text-white px-3 py-1 text-xs flex items-center gap-1 rounded-full"
                        >
                          {accommodationTypes.find((t) => t.value === type)?.label || type}
                          <X
                            className="h-3 w-3 cursor-pointer hover:bg-orange-600 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeAccommodationType(type)
                            }}
                          />
                        </div>
                      ))}
                      {newAccommodationEnquiry.accommodationType.length === 0 && (
                        <span className="text-gray-400">Select types...</span>
                      )}
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {showAccommodationDropdown && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {accommodationTypes.map((type) => (
                          <div
                            key={type.value}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                            onClick={() => toggleAccommodationType(type.value)}
                          >
                            {type.label}
                            {newAccommodationEnquiry.accommodationType.includes(type.value) && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Hotel preference */}
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium">Hotel preference</label>
                  <div className="relative">
                    <div
                      className="w-full min-h-12 p-3 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center"
                      onClick={() => setShowHotelDropdown(!showHotelDropdown)}
                    >
                      {newAccommodationEnquiry.hotelPreference.map((preference) => (
                        <div
                          key={preference}
                          className="bg-orange-500 text-white px-3 py-1 text-xs flex items-center gap-1 rounded-full"
                        >
                          {hotelOptions.find((opt) => opt.value === preference)?.label || preference}
                          <X
                            className="h-3 w-3 cursor-pointer hover:bg-orange-600 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeHotelPreference(preference)
                            }}
                          />
                        </div>
                      ))}
                      {newAccommodationEnquiry.hotelPreference.length === 0 && (
                        <span className="text-gray-400">Select preferences...</span>
                      )}
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {showHotelDropdown && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {hotelOptions.map((option) => (
                          <div
                            key={option.value}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                            onClick={() => toggleHotelPreference(option.value)}
                          >
                            {option.label}
                            {newAccommodationEnquiry.hotelPreference.includes(option.value) && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Point of Contact */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Point of contact</label>
                  <select
                    value={newAccommodationEnquiry.pointOfContact}
                    onChange={(e) => handleInputChange("pointOfContact", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select point of contact</option>
                    <option value="Direct">Direct</option>
                    <option value="Agent">Agent</option>
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                  </select>
                </div>
                {/* Assign Staff */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign staff</label>
                  <select
                    value={newAccommodationEnquiry.assignedStaff}
                    onChange={(e) => handleInputChange("assignedStaff", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select staff member</option>
                    <option value="Kevin Blake">Kevin Blake</option>
                    <option value="Maria Rodriguez">Maria Rodriguez</option>
                    <option value="Priya Sharma">Priya Sharma</option>
                    <option value="Ahmed Khan">Ahmed Khan</option>
                    <option value="Emily Johnson">Emily Johnson</option>
                  </select>
                </div>
                {/* Notes */}
                <div className="col-span-3 space-y-2">
                  <label className="text-sm font-medium">Additional notes</label>
                  <textarea
                    value={newAccommodationEnquiry.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px]"
                    placeholder="Any special requirements or preferences"
                  />
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-between">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccommodationEnquiry}
                className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md"
                disabled={
                  !newAccommodationEnquiry.name || !newAccommodationEnquiry.phone || !newAccommodationEnquiry.email
                }
              >
                Add Accommodation Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
