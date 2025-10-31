"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Plus, CalendarIcon, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
}

interface Column {
  id: string
  title: string
  icon: string
  enquiries: Enquiry[]
}
interface UserData {
  id: string;
  name: string;
  status: string;
}


const generateUniqueId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const initialColumns: Column[] = [
  { id: "enquiry", title: "Enquiry", icon: "/Vectors.png?height=32&width=32", enquiries: [] },
  { id: "itinerary_creation", title: "Itinerary Creation", icon: "/Vectors1.png?height=32&width=32", enquiries: [] },
  { id: "customer_feedback", title: "Customer Feedback", icon: "/Vectors2.png?height=32&width=32", enquiries: [] },
  { id: "itinerary_confirmed", title: "Itinerary Confirmed", icon: "/Vectors3.png?height=32&width=32", enquiries: [] },
  { id: "dmc_quotation", title: "DMC Quotation", icon: "//Vectors4.png?height=32&width=32", enquiries: [] },
  { id: "price_finalization", title: "Price Finalization", icon: "//Vectors5.png?height=32&width=32", enquiries: [] },
  { id: "booking_request", title: "Booking Request", icon: "//Vectors1.png?height=32&width=32", enquiries: [] },
  { id: "cancelled", title: "Cancelled", icon: "/Vectors4.png?height=32&width=32", enquiries: [] },
  { id: "booking_progress", title: "Booking Progress", icon: "/Vectors3.png?height=32&width=32", enquiries: [] },
  { id: "payment_forex", title: "Payment & Forex", icon: "/Vectors4.png?height=32&width=32", enquiries: [] },
  { id: "trip_in_progress", title: "Trip In Progress", icon: "/Vectors5.png?height=32&width=32", enquiries: [] },
  { id: "completed", title: "Completed", icon: "/Vectors2.png?height=32&width=32", enquiries: [] },
]

const columnMessages: Record<string, string> = {
  enquiry: "Awaiting Agency response",
  itinerary_creation: "Draft itinerary in review",
  customer_feedback: "Awaiting customer feedback",
  itinerary_confirmed: "Itinerary confirmed",
  dmc_quotation: "Awaiting DMC quotes",
  price_finalization: "Adding margin and confirming",
  booking_request: "Booking Sent to DMC",
  cancelled: "Cancelled by customer",
  booking_progress: "Awaiting DMC confirmation",
  payment_forex: "Processing Forex payments",
  trip_in_progress: "Successfully completed",
  completed: "Trip completed",
}

export default function Enquiry() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffUsers, setStaffUsers] = useState<{ id: string; name: string; status?: string }[]>([])
  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "GBP":
        return "£"
      case "INR":
        return "₹"
      default:
        return code || "$"
    }
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredEnquiry, setHoveredEnquiry] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const [newEnquiry, setNewEnquiry] = useState<Omit<Enquiry, "id" | "status" | "enquiryDate">>({
    name: "",
    phone: "",
    email: "",
    locations: "",
    tourType: "",
    estimatedDates: "",
    currency: "USD",
    budget: 1000,
    notes: "",
    assignedStaff: "",
    pointOfContact: "",
    pickupLocation: "",
    dropLocation: "",
    numberOfTravellers: "",
    numberOfKids: "",
    travelingWithPets: "no",
    flightsRequired: "no",
    leadSource: "Direct",
    tags: "sightseeing",
    mustSeeSpots: "",
    
  })

  useEffect(() => {
    setIsClient(true)
    fetchEnquiries()
    fetchStaffUsers()
  }, [])

  const fetchStaffUsers = async () => {
  try {
    const response = await fetch("/api/auth/agency-add-user", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (data?.success && Array.isArray(data.data)) {
      const mapped = data.data
        .map((u: UserData) => ({ id: u.id, name: u.name, status: u.status }))
        .filter((u: { status?: string }) => (u.status ? u.status === "ACTIVE" : true));
      setStaffUsers(mapped);
    } else {
      console.warn("Unexpected response format from /api/auth/agency-add-user", data);
      setStaffUsers([]);
    }
  } catch (e) {
    console.error("Failed to fetch staff users", e);
    setStaffUsers([]);
  }
};

  const fetchEnquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/enquiries")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch enquiries")
      }

      const enquiries = Array.isArray(result) ? result : []

      const cols = initialColumns.map((col) => ({
        ...col,
        enquiries: enquiries.filter((e: Enquiry) => e.status === col.id),
      }))

      setColumns(cols)
    } catch (error) {
      console.error("Error fetching enquiries:", error)
      toast.error("Failed to fetch enquiries")
      setColumns(initialColumns.map((col) => ({ ...col, enquiries: [] })))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setNewEnquiry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddEnquiry = async () => {
    try {
      if (!newEnquiry.name || !newEnquiry.phone || !newEnquiry.email) {
        toast.error("Please fill in all required fields")
        return
      }

      const today = new Date()
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${today.getFullYear()}`

      const newEnquiryWithId: Enquiry = {
        ...newEnquiry,
        id: generateUniqueId(),
        status: "enquiry",
        enquiryDate: formattedDate,
      }

      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEnquiryWithId),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create enquiry")
      }

      toast.success("Enquiry Added", {
        description: `New enquiry for ${newEnquiry.name} has been added successfully.`,
      })

      setIsDialogOpen(false)
      resetForm()
      await fetchEnquiries() // Refresh the data
    } catch (error) {
      console.error("Error adding enquiry:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to add enquiry. Please try again.",
      })
    }
  }

  const resetForm = () => {
    setNewEnquiry({
      name: "",
      phone: "",
      email: "",
      locations: "",
      tourType: "",
      estimatedDates: "",
      currency: "USD",
      budget: 1000,
      notes: "",
      assignedStaff: "",
      pointOfContact: "",
      pickupLocation: "",
      dropLocation: "",
      numberOfTravellers: "",
      numberOfKids: "",
      travelingWithPets: "no",
      flightsRequired: "no",
      leadSource: "Direct",
      tags: "sightseeing",
      mustSeeSpots: "",
      
    })
    setDateRange({
      from: undefined,
      to: undefined,
    })
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    // Find the moved enquiry
    const sourceColumn = columns.find((col) => col.id === source.droppableId)
    const movedEnquiry = sourceColumn?.enquiries[source.index]

    if (!movedEnquiry) return

    // Update local state immediately for smooth UX
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
        status: destination.droppableId as Enquiry["status"],
      }

      newColumns[destColIndex].enquiries.splice(destination.index, 0, updatedItem)

      return newColumns
    })

    // Update in backend
    try {
      const response = await fetch("/api/enquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: movedEnquiry.id,
          status: destination.droppableId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update enquiry status")
      }

      const destColumn = initialColumns.find((col) => col.id === destination.droppableId)
      toast.success("Enquiry Updated", {
        description: `${movedEnquiry.name}'s enquiry moved to ${destColumn?.title}`,
      })
    } catch (error) {
      console.error("Error updating enquiry:", error)
      toast.error("Failed to update enquiry status")
      // Revert the change by refetching data
      await fetchEnquiries()
    }
  }



  const handleViewLeads = () => {
    router.push("/telecaller/dashboard/enquiry/view-leads")
  }

  const renderTagSpecificFields = () => {
    if (newEnquiry.tags === "sightseeing") {
      return (
        <>
          <div className="col-span-3 space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium font-poppins text-gray-600">
              Must-see spots <span className="text-gray-400">(Optional)</span>
            </label>
            <Textarea
              value={newEnquiry.mustSeeSpots || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("mustSeeSpots", e.target.value)
              }
              placeholder="List the must-see spots or attractions"
              className="min-h-[80px] text-sm sm:text-base"
            />
          </div>
         
        </>
      )
    } else if (newEnquiry.tags === "full-package") {
      return (
        <div className="space-y-1 sm:space-y-2">
          <label className="text-xs sm:text-sm font-medium font-poppins">
            Flights required? <span className="text-gray-400">(optional)</span>
          </label>
          <RadioGroup
            value={newEnquiry.flightsRequired}
            onValueChange={(value: string) => handleInputChange("flightsRequired", value)}
          >
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="yes"
                  id="flights-yes"
                  className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-600"
                />
                <Label htmlFor="flights-yes" className="text-sm">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="no"
                  id="flights-no"
                  className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-600"
                />
                <Label htmlFor="flights-no" className="text-sm">
                  No
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      )
    }
    return null
  }

  // Filter enquiries based on search term
  const filteredColumns = columns.map((column) => ({
    ...column,
    enquiries: column.enquiries.filter(
      (enquiry) =>
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.phone.includes(searchTerm) ||
        enquiry.locations.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enquiries...</p>
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
            <Search className="absolute left-2 top-2.5 h-4 w-4 font-poppins" />
            <Input
              placeholder="Search for..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 bg-white border-emerald-500 focus:border-emerald-500 hover:border-emerald-500 transition-colors font-poppins w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-1 font-poppins text-sm sm:text-base bg-transparent"
            >
              Sort by
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-white hover:bg-white text-green-800 border-2 border-green-600 text-sm sm:text-base flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add enquiry</span>
            </Button>
            <Button
              onClick={handleViewLeads}
              className="bg-green-800 hover:bg-green-800 text-white border-2 border-green-600 text-sm sm:text-base flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              <span>View Leads</span>
            </Button>
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
            <DragDropContext onDragEnd={onDragEnd}>
              {filteredColumns.map((column) => (
                <Droppable droppableId={column.id} key={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[240px] w-[240px] sm:w-[260px] flex-shrink-0 h-[calc(100vh-180px)] sm:h-[calc(100vh-140px)]"
                    >
                      {/* Column header */}
                      <div className="p-3 sm:p-4 shadow-sm rounded-t-lg bg-white">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 p-2 sm:p-3 rounded-md">
                            <Image
                              src={
                                column.icon?.startsWith("//")
                                  ? column.icon.replace("//", "/")
                                  : column.icon || "/Vectors.png"
                              }
                              alt={column.title}
                              width={32}
                              height={32}
                              className="w-6 h-6 sm:w-8 sm:h-8"
                            />
                          </div>
                          <h3 className="font-semibold text-sm sm:text-base font-poppins">{column.title}</h3>
                        </div>
                      </div>

                      {/* Enquiries list */}
                      <div className="p-2 sm:p-3 overflow-y-auto h-[calc(100%-76px)] font-poppins">
                        {column.enquiries.map((enquiry, index) => (
                          <Draggable key={enquiry.id} draggableId={enquiry.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white rounded-lg p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-shadow relative"
                                onMouseEnter={() => setHoveredEnquiry(enquiry.id)}
                                onMouseLeave={() => setHoveredEnquiry(null)}
                              >
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-sm sm:text-base font-poppins">{enquiry.name}</h4>
                                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white rounded-full h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center"></div>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-600 font-poppins">{enquiry.phone}</p>
                                  <p className="text-xs sm:text-sm text-gray-600 font-poppins truncate">
                                    {enquiry.email}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs sm:text-sm text-green-500 font-poppins">
                                      Enquiry on: {enquiry.enquiryDate}
                                    </p>
                                    <div className="relative group">
                                    
                                     
                                    </div>
                                  </div>
                                  {hoveredEnquiry === enquiry.id && (
                                    <div className="absolute -bottom-20 right-0 bg-green-100 p-2 sm:p-3 rounded-md shadow-sm w-40 sm:w-48 z-10">
                                      <p className="text-xs sm:text-sm text-green-800 font-medium font-poppins">
                                        {columnMessages[column.id]}
                                      </p>
                                      <p className="text-xs sm:text-sm text-green-800 mt-1 font-poppins truncate">
                                        Assigned: {enquiry.assignedStaff || "Unassigned"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </DragDropContext>
          ) : (
            <div className="w-full flex justify-center items-center">
              <div className="p-4">Loading enquiries...</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Enquiry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden w-[calc(100vw-20px)] max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <DialogTitle className="text-lg sm:text-xl font-semibold font-poppins">Add Enquiry</DialogTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
              {/* Lead source */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Lead source</label>
                <RadioGroup
                  value={newEnquiry.leadSource}
                  onValueChange={(value: string) => handleInputChange("leadSource", value)}
                >
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Direct"
                        id="lead-direct"
                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-600"
                      />
                      <Label htmlFor="lead-direct" className="text-sm">
                        Direct
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Sub agent"
                        id="lead-agent"
                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-600"
                      />
                      <Label htmlFor="lead-agent" className="text-sm">
                        Sub agent
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Tags */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Tags</label>
                <Select value={newEnquiry.tags} onValueChange={(value: string) => handleInputChange("tags", value)}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sightseeing" className="text-sm sm:text-base">
                      Sightseeing
                    </SelectItem>
                    <SelectItem value="full-package" className="text-sm sm:text-base">
                      Full package
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Name *</label>
                <Input
                  value={newEnquiry.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}
                  placeholder="Client name"
                  className="text-sm sm:text-base"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Phone No. *</label>
                <div className="flex">
                  <div className="flex items-center border rounded-l-md px-2 bg-gray-50">
                    <Image
                      src="https://flagcdn.com/w20/in.png"
                      width={20}
                      height={20}
                      alt="India flag"
                      className="mr-1"
                    />
                    <span className="text-xs sm:text-sm">+91</span>
                    <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                  </div>
                  <Input
                    value={newEnquiry.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("phone", e.target.value)}
                    placeholder="Phone number"
                    className="rounded-l-none text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Email *</label>
                <Input
                  type="email"
                  value={newEnquiry.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("email", e.target.value)}
                  placeholder="Email address"
                  className="text-sm sm:text-base"
                  required
                />
              </div>

              {/* Locations */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Location(s)</label>
                <Input
                  value={newEnquiry.locations}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("locations", e.target.value)}
                  placeholder="Desired destinations"
                  className="text-sm sm:text-base"
                />
              </div>

              {/* From Date */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm sm:text-base",
                        !dateRange.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "dd MMM yy") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date: Date | undefined) => {
                        setDateRange((prev) => ({ ...prev, from: date }))
                        if (date) {
                          const formatted = format(date, "dd MMM yy")
                          const currentEnd = dateRange.to ? ` - ${format(dateRange.to, "dd MMM yy")}` : ""
                          handleInputChange("estimatedDates", `${formatted}${currentEnd}`)
                        }
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To Date */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm sm:text-base",
                        !dateRange.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "dd MMM yy") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date: Date | undefined) => {
                        setDateRange((prev) => ({ ...prev, to: date }))
                        if (date && dateRange.from) {
                          const startFormatted = format(dateRange.from, "dd MMM yy")
                          const endFormatted = format(date, "dd MMM yy")
                          handleInputChange("estimatedDates", `${startFormatted} - ${endFormatted}`)
                        }
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Currency */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Currency</label>
                <Select
                  value={newEnquiry.currency}
                  onValueChange={(value: string) => handleInputChange("currency", value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD" className="text-sm sm:text-base">
                      USD
                    </SelectItem>
                    <SelectItem value="EUR" className="text-sm sm:text-base">
                      EUR
                    </SelectItem>
                    <SelectItem value="GBP" className="text-sm sm:text-base">
                      GBP
                    </SelectItem>
                    <SelectItem value="INR" className="text-sm sm:text-base">
                      INR
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="col-span-3 space-y-1 sm:space-y-2 font-poppins">
                <label className="text-xs sm:text-sm font-medium">Budget</label>
                <div className="pt-2 px-2">
                  <Slider
                    defaultValue={[newEnquiry.budget || 1000]}
                    max={newEnquiry.currency === 'INR' ? 200000 : 50000}
                    min={100}
                    step={100}
                    onValueChange={(value: number[]) => handleInputChange("budget", value[0])}
                  />
                  <div className="flex justify-between mt-2 text-xs sm:text-sm text-gray-500">
                    <span>{getCurrencySymbol(newEnquiry.currency)}100</span>
                    <div className="bg-green-100 px-2 py-1 rounded text-green-800">
                      {getCurrencySymbol(newEnquiry.currency)}{newEnquiry.budget || 1000}
                    </div>
                    <span>{getCurrencySymbol(newEnquiry.currency)}{newEnquiry.currency === 'INR' ? '200000' : '50000'}</span>
                  </div>
                </div>
              </div>

              {/* Traveling with pets */}
              <div className="col-span-3 space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">
                  Are you traveling with pets? <span className="text-gray-400">(optional)</span>
                </label>
                <RadioGroup
                  value={newEnquiry.travelingWithPets}
                  onValueChange={(value: string) => handleInputChange("travelingWithPets", value)}
                >
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="yes"
                        id="pets-yes-full"
                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-600"
                      />
                      <Label htmlFor="pets-yes-full" className="text-sm">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="no"
                        id="pets-no-full"
                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-600"
                      />
                      <Label htmlFor="pets-no-full" className="text-sm">
                        No
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Tour type */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Tour type</label>
                <Select
                  value={newEnquiry.tourType}
                  onValueChange={(value: string) => handleInputChange("tourType", value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select tour type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo" className="text-sm sm:text-base">
                      Solo
                    </SelectItem>
                    <SelectItem value="family" className="text-sm sm:text-base">
                      Family
                    </SelectItem>
                    <SelectItem value="group" className="text-sm sm:text-base">
                      Group
                    </SelectItem>
                    <SelectItem value="friends" className="text-sm sm:text-base">
                      Friends
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tag-specific fields */}
              {renderTagSpecificFields()}

              {/* Pickup and Drop locations */}
              <div className="col-span-3 space-y-3 font-poppins">
                <label className="text-xs sm:text-sm font-medium">Pickup and drop locations</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium">Pickup</span>
                    </div>
                    <Input
                      value={newEnquiry.pickupLocation || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("pickupLocation", e.target.value)
                      }
                      placeholder="Ernakulam, KSRTC"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium">Drop off</span>
                    </div>
                    <Input
                      value={newEnquiry.dropLocation || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("dropLocation", e.target.value)
                      }
                      placeholder="Ernakulam, KSRTC"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Other details */}
              <div className="col-span-3 space-y-1 sm:space-y-2 font-poppins">
                <label className="text-xs sm:text-sm font-medium">Other details</label>
                <Textarea
                  value={newEnquiry.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("notes", e.target.value)}
                  className="min-h-[100px] text-sm sm:text-base"
                  placeholder="Additional details about the enquiry"
                />
              </div>

              {/* No. of travellers */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">No. of travellers</label>
                <Input
                  type="number"
                  value={newEnquiry.numberOfTravellers || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("numberOfTravellers", e.target.value)
                  }
                  placeholder="4"
                  className="text-sm sm:text-base"
                />
              </div>

              {/* No. of kids */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">No. of kids</label>
                <Input
                  type="number"
                  value={newEnquiry.numberOfKids || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("numberOfKids", e.target.value)
                  }
                  placeholder="2"
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Source of Lead */}
              <div className="space-y-1 sm:space-y-2 col-span-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Source of Lead</label>
                <Select
                  value={newEnquiry.pointOfContact || ""}
                  onValueChange={(value: string) => handleInputChange("pointOfContact", value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct" className="text-sm sm:text-base">
                      Direct
                    </SelectItem>
                    <SelectItem value="Agent" className="text-sm sm:text-base">
                      Agent
                    </SelectItem>
                    <SelectItem value="Referral" className="text-sm sm:text-base">
                      Referral
                    </SelectItem>
                    <SelectItem value="Website" className="text-sm sm:text-base">
                      Website
                    </SelectItem>
                    <SelectItem value="Facebook" className="text-sm sm:text-base">
                      Facebook
                    </SelectItem>
                    <SelectItem value="Instagram" className="text-sm sm:text-base">
                      Instagram
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assign staff */}
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium font-poppins">Assign staff</label>
                <Select
                  value={newEnquiry.assignedStaff}
                  onValueChange={(value: string) => handleInputChange("assignedStaff", value)}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.length > 0 ? (
                      // Remove duplicates by creating a Map with name as key
                      Array.from(
                        new Map(staffUsers.map(user => [user.name, user])).values()
                      ).map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-sm sm:text-base">
                          {user.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-staff" disabled className="text-sm sm:text-base">
                        No staff available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t p-3 sm:p-4 flex justify-end font-poppins">
            <Button
              onClick={handleAddEnquiry}
              className="bg-green-700 hover:bg-green-800 text-white w-full text-sm sm:text-base"
              disabled={!newEnquiry.name || !newEnquiry.phone || !newEnquiry.email}
            >
              Add Enquiry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
