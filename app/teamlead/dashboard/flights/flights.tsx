"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, ChevronDown, Plus, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

// Types for Flight Enquiry
interface FlightEnquiry {
  id: string
  name: string
  phone: string
  email: string
  departureCity: string
  returnCity: string
  departureDate: string
  returnDate: string
  preferredAirlineClass: string
  numberOfTravellers: string
  numberOfKids: string
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
  enquiries: FlightEnquiry[]
}

const generateUniqueId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const flightColumns: Column[] = [
  { id: "enquiry", title: "Enquiry", icon: "📝", enquiries: [] },
  { id: "quote_generation", title: "Quote Generation", icon: "💰", enquiries: [] },
  { id: "customer_review", title: "Customer Review", icon: "👀", enquiries: [] },
  { id: "booking_confirmed", title: "Booking Confirmed", icon: "✅", enquiries: [] },
  { id: "payment_processing", title: "Payment Processing", icon: "💳", enquiries: [] },
  { id: "ticket_issued", title: "Ticket Issued", icon: "🎫", enquiries: [] },
  { id: "completed", title: "Completed", icon: "🏆", enquiries: [] },
  { id: "cancelled", title: "Cancelled", icon: "❌", enquiries: [] },
]

const flightColumnMessages: Record<string, string> = {
  enquiry: "Awaiting flight quote request",
  quote_generation: "Generating flight quotes",
  customer_review: "Awaiting customer decision",
  booking_confirmed: "Flight booking confirmed",
  payment_processing: "Processing payment",
  ticket_issued: "Tickets issued successfully",
  completed: "Flight booking completed",
  cancelled: "Flight booking cancelled",
}

export default function FlightsDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [columns, setColumns] = useState<Column[]>(flightColumns)
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addingEnquiry, setAddingEnquiry] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredEnquiry, setHoveredEnquiry] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [newFlightEnquiry, setNewFlightEnquiry] = useState<Omit<FlightEnquiry, "id" | "status" | "enquiryDate">>({
    name: "",
    phone: "",
    email: "",
    departureCity: "",
    returnCity: "",
    departureDate: "",
    returnDate: "",
    preferredAirlineClass: "economy",
    numberOfTravellers: "",
    numberOfKids: "",
    assignedStaff: "",
    pointOfContact: "",
    notes: "",
    leadSource: "Direct",
  })

  const fetchFlightEnquiries = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Fetching flight enquiries...")
      const response = await axios.get("/api/flight-enquiries")
      console.log("Fetched flight enquiries:", response.data)

      const enquiries = Array.isArray(response.data) ? response.data : []

      const cols = flightColumns.map((col) => ({
        ...col,
        enquiries: enquiries.filter((e: FlightEnquiry) => e.status === col.id),
      }))

      setColumns(cols)
    } catch (error) {
      console.error("Error fetching flight enquiries:", error)
      toast.error("Failed to fetch flight enquiries")
      setColumns(flightColumns.map((col) => ({ ...col, enquiries: [] })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
    fetchFlightEnquiries()
  }, [fetchFlightEnquiries])

  const handleInputChange = (field: string, value: string | number) => {
    setNewFlightEnquiry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddFlightEnquiry = async () => {
    if (!newFlightEnquiry.name || !newFlightEnquiry.phone || !newFlightEnquiry.email) {
      toast.error("Please fill in all required fields")
      return
    }

    setAddingEnquiry(true)

    try {
      const enquiryData = {
        ...newFlightEnquiry,
        id: generateUniqueId(),
        status: "enquiry",
        enquiryDate: new Date().toISOString().split("T")[0],
      }

      console.log("Adding flight enquiry:", enquiryData)

      const response = await axios.post("/api/flight-enquiries", enquiryData)
      console.log("Flight enquiry added successfully:", response.data)

      toast.success("Flight enquiry added successfully!")

      await fetchFlightEnquiries()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding flight enquiry:", error)

      let errorMessage = "Failed to add flight enquiry"

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.response?.data?.details) {
          errorMessage = error.response.data.details
        } else if (error.message) {
          errorMessage = error.message
        }

        console.error("Detailed Axios error:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        })
      }

      toast.error("Error", {
        description: errorMessage,
      })
    } finally {
      setAddingEnquiry(false)
    }
  }

  const resetForm = () => {
    setNewFlightEnquiry({
      name: "",
      phone: "",
      email: "",
      departureCity: "",
      returnCity: "",
      departureDate: "",
      returnDate: "",
      preferredAirlineClass: "economy",
      numberOfTravellers: "",
      numberOfKids: "",
      assignedStaff: "",
      pointOfContact: "",
      notes: "",
      leadSource: "Direct",
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"))
      const { enquiryId, sourceColumnId } = dragData

      if (sourceColumnId === targetColumnId) return

      const sourceColumn = columns.find((col) => col.id === sourceColumnId)
      const movedEnquiry = sourceColumn?.enquiries.find((e) => e.id === enquiryId)

      if (!movedEnquiry) return

      // Update local state immediately for better UX
      setColumns((prevColumns) => {
        const newColumns = prevColumns.map((col) => ({
          ...col,
          enquiries: col.enquiries.filter((e) => e.id !== enquiryId),
        }))

        const targetColIndex = newColumns.findIndex((col) => col.id === targetColumnId)
        if (targetColIndex !== -1) {
          newColumns[targetColIndex].enquiries.push({
            ...movedEnquiry,
            status: targetColumnId,
          })
        }

        return newColumns
      })

      // Update database
      await axios.put("/api/flight-enquiries", {
        id: enquiryId,
        status: targetColumnId,
      })

      const destColumn = flightColumns.find((col) => col.id === targetColumnId)
      toast.success("Flight Enquiry Updated", {
        description: `${movedEnquiry.name}'s flight enquiry moved to ${destColumn?.title}`,
      })
    } catch (error) {
      console.error("Error updating flight enquiry:", error)
      toast.error("Failed to update flight enquiry status")
      // Refresh data on error
      await fetchFlightEnquiries()
    }
  }

  const filteredColumns = columns.map((column) => ({
    ...column,
    enquiries: column.enquiries.filter(
      (enquiry) =>
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.phone.includes(searchTerm) ||
        enquiry.departureCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.returnCity.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading flight enquiries...</p>
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
              placeholder="Search flights..."
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
              disabled={addingEnquiry}
            >
              <Plus className="h-4 w-4" />
              <span>Add Flight Enquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Columns area */}
      <div className="relative flex-1 p-2 sm:p-4">
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
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column header */}
                  <div className="p-3 sm:p-4 shadow-sm rounded-t-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 sm:p-3 rounded-md text-2xl">{column.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">{column.title}</h3>
                        <p className="text-xs text-gray-500">{column.enquiries.length} enquiries</p>
                      </div>
                    </div>
                  </div>

                  {/* Enquiries list */}
                  <div className="p-2 sm:p-3 overflow-y-auto h-[calc(100%-90px)]">
                    {column.enquiries.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-8">No enquiries in this stage</div>
                    ) : (
                      column.enquiries.map((enquiry, index) => (
                        <div
                          key={enquiry.id}
                          className="bg-white rounded-lg p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-shadow relative cursor-move border border-gray-200"
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
                            {enquiry.departureCity && enquiry.returnCity && (
                              <p className="text-xs sm:text-sm text-blue-600">
                                {enquiry.departureCity} → {enquiry.returnCity}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs sm:text-sm text-green-500">
                                Enquiry: {enquiry.enquiryDate || "N/A"}
                              </p>
                              <div className="relative group">
                                <button
                                  className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-black hover:bg-gray-100 transition-colors"
                                  onClick={() => console.log("Process flight for:", enquiry.id)}
                                >
                                  <ArrowUpRight className="w-4 h-4 text-gray-600" />
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  Process Flight
                                </div>
                              </div>
                            </div>
                            {hoveredEnquiry === enquiry.id && (
                              <div className="absolute -bottom-20 right-0 bg-blue-100 p-2 sm:p-3 rounded-md shadow-sm w-40 sm:w-48 z-10">
                                <p className="text-xs sm:text-sm text-blue-800 font-medium">
                                  {flightColumnMessages[column.id]}
                                </p>
                                <p className="text-xs sm:text-sm text-blue-800 mt-1 truncate">
                                  Assigned: {enquiry.assignedStaff || "Unassigned"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex justify-center items-center">
              <div className="p-4">Loading flight enquiries...</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Flight Enquiry Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Add Flight Enquiry</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Lead source */}
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Lead source</label>
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="Direct"
                        checked={newFlightEnquiry.leadSource === "Direct"}
                        onChange={(e) => handleInputChange("leadSource", e.target.value)}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm">Direct</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="Sub agent"
                        checked={newFlightEnquiry.leadSource === "Sub agent"}
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
                    value={newFlightEnquiry.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Passenger name"
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
                      value={newFlightEnquiry.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={newFlightEnquiry.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Departure and Return Cities */}
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Departure and return city</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Departure</label>
                        <input
                          type="text"
                          value={newFlightEnquiry.departureCity}
                          onChange={(e) => handleInputChange("departureCity", e.target.value)}
                          placeholder="From city"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Return</label>
                        <input
                          type="text"
                          value={newFlightEnquiry.returnCity}
                          onChange={(e) => handleInputChange("returnCity", e.target.value)}
                          placeholder="To city"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferred Airline Class */}
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Preferred airline class</label>
                  <select
                    value={newFlightEnquiry.preferredAirlineClass}
                    onChange={(e) => handleInputChange("preferredAirlineClass", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium-economy">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First Class</option>
                  </select>
                </div>

                {/* Departure Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure Date</label>
                  <input
                    type="date"
                    value={newFlightEnquiry.departureDate}
                    onChange={(e) => handleInputChange("departureDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Return Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Date</label>
                  <input
                    type="date"
                    value={newFlightEnquiry.returnDate}
                    onChange={(e) => handleInputChange("returnDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Number of Travellers */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">No. of travellers</label>
                  <input
                    type="number"
                    value={newFlightEnquiry.numberOfTravellers}
                    onChange={(e) => handleInputChange("numberOfTravellers", e.target.value)}
                    placeholder="4"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Number of Kids */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">No. of kids</label>
                  <input
                    type="number"
                    value={newFlightEnquiry.numberOfKids}
                    onChange={(e) => handleInputChange("numberOfKids", e.target.value)}
                    placeholder="2"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Point of Contact */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Point of contact</label>
                  <select
                    value={newFlightEnquiry.pointOfContact}
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
                    value={newFlightEnquiry.assignedStaff}
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

                {/* Other Details */}
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Other details</label>
                  <textarea
                    value={newFlightEnquiry.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px]"
                    placeholder="Additional flight requirements or preferences"
                  />
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-between">
              <button
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={addingEnquiry}
              >
                Cancel
              </button>
              <button
                onClick={handleAddFlightEnquiry}
                className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newFlightEnquiry.name || !newFlightEnquiry.phone || !newFlightEnquiry.email || addingEnquiry}
              >
                {addingEnquiry ? "Adding..." : "Add Flight Enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
