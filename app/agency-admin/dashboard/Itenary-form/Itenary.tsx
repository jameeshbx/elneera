"use client"

import type React from "react"

import { useState, useEffect , useRef} from "react"
import Image from "next/image"
import { ChevronDown, Minus, Plus, Calendar, Check, Edit, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import LoadingComponent from "@/app/agency-admin/dashboard/Itenary-form/loading"

// Define types for the itinerary data (matching ItineraryView)
interface Activity {
  time: string
  title: string
  type: string
  description: string
  image?: string
}

interface DayItinerary {
  day: number
  date: string
  title: string
  activities: Activity[]
}

interface Accommodation {
  name: string
  rating: number
  nights: number
  image: string
}

interface AgencyCancellationPolicy {
  id: string
  policy_name: string
  cancellation_deadline_days: number
  cancellation_terms: string
  refund_percentage?: number
}

interface TravelFormData {
  destinations: string[]
  startDate: string
  endDate: string
  travelType: string
  adults: number
  children: number
  under6: number
  from7to12: number
  flightsRequired: string
  pickupLocation: string
  dropLocation: string
  currency: string
  budget: number
  activityPreferences: string[]
  hotelPreferences: string[]
  mealPreference: string[]
  dietaryPreference: string[]
  transportPreferences: string[]
  travelingWithPets: string
  additionalRequests: string
  moreDetails: string
  mustSeeSpots: string
  dailyItinerary: DayItinerary[]
  accommodation: Accommodation[]
  cancellationPolicyType: string
  customCancellationDeadline: string
  customCancellationTerms: string
  agencyCancellationPolicyId: string
}

interface EnquiryData {
  id: string
  name: string
  phone: string
  email: string
  locations: string
  tourType: string
  estimatedDates: string
  currency: string
  budget: number
  assignedStaff: string
  pointOfContact: string
  enquiryDate: string
  flightsRequired?: string
  pickupLocation?: string
  dropLocation?: string
  numberOfTravellers?: string
  numberOfKids?: string
  travelingWithPets?: string
  notes?: string
  tags?: string
  mustSeeSpots?: string
  
  customerId?: string
}

interface ItineraryData {
  id: string
  enquiryId: string
  location: string
  numberOfDays: string
  travelStyle: string
  budgetEstimation: {
    amount: number
    currency: string
    costTourist: number
  }
  accommodation: Accommodation[]
  dailyItinerary: DayItinerary[]
  enquiryDetails: string
  destinations: string
  startDate: string
  endDate: string
  travelType: string
  adults: number
  children: number
  under6: number
  from7to12: number
  flightsRequired: string
  pickupLocation: string | null
  dropLocation: string | null
  currency: string
  budget: number
  activityPreferences: string
  hotelPreferences: string
  mealPreference: string
  dietaryPreference: string
  transportPreferences: string
  travelingWithPets: string
  additionalRequests: string | null
  moreDetails: string | null
  mustSeeSpots: string | null
 
  status: string
  createdAt: string
  updatedAt: string
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
    assignedStaff: string | null
    pointOfContact: string | null
    notes: string | null
    tags: string | null
    mustSeeSpots: string | null
  
    flightsRequired: string | null
  }
}

const activityOptions = [
  {
    id: "sightseeing",
    label: "Sightseeing & Culture",
    icon: <Image src="/Icon1.png" alt="Culture" width={16} height={16} />,
  },
  { id: "nature", label: "Nature & Outdoor", icon: <Image src="/Icon2.png" alt="Nature" width={16} height={16} /> },
  {
    id: "adventure",
    label: "Adventure & Thrill",
    icon: <Image src="/Icon3.png" alt="Adventure" width={16} height={16} />,
  },
  { id: "food", label: "Food & Culinary", icon: <Image src="/Icon1.png" alt="Food" width={16} height={16} /> },
  {
    id: "shopping",
    label: "Shopping & Leisure",
    icon: <Image src="/Icon4.png" alt="Shopping" width={16} height={16} />,
  },
  {
    id: "entertainment",
    label: "Entertainment & Nightlife",
    icon: <Image src="/Icon1.png" alt="Entertainment" width={16} height={16} />,
  },
  {
    id: "wellness",
    label: "Wellness & Relaxation",
    icon: <Image src="/Icon5.png" alt="Wellness" width={16} height={16} />,
  },
  { id: "sports", label: "Sports & Recreation", icon: <Image src="/Icon6.png" alt="Sports" width={16} height={16} /> },
  { id: "honeymoon", label: "Honeymooning", icon: <Image src="/Icon7.png" alt="Honeymoon" width={16} height={16} /> },
]

const transportOptions = [
  {
    id: "ac",
    label: "AC",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    id: "non-ac",
    label: "Non - AC",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    id: "premium",
    label: "Premium",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
]

function ItineraryFormContent() {
  const [enquiryData, setEnquiryData] = useState<EnquiryData | null>(null)
  const [assignedStaffName, setAssignedStaffName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [itineraryId, setItineraryId] = useState<string | null>(null)
  const [, setAgencyCancellationPolicies] = useState<AgencyCancellationPolicy[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<TravelFormData>({
    destinations: [],
    startDate: "",
    endDate: "",
    travelType: "",
    adults: 2,
    children: 0,
    under6: 0,
    from7to12: 0,
    flightsRequired: "no",
    pickupLocation: "",
    dropLocation: "",
    currency: "USD",
    budget: 1000,
    activityPreferences: [],
    hotelPreferences: [],
    mealPreference: [],
    dietaryPreference: [],
    transportPreferences: [],
    travelingWithPets: "no",
    additionalRequests: "",
    moreDetails: "",
    mustSeeSpots: "",
    
    dailyItinerary: [],
    accommodation: [],
    cancellationPolicyType: "DEFAULT",
    customCancellationDeadline: "",
    customCancellationTerms: "",
    agencyCancellationPolicyId: "",
  })
  const [, setShowEnquiryForm] = useState(false)
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false)
  const [showHotelDropdown, setShowHotelDropdown] = useState(false)
  const [showCalendar, setShowCalendar] = useState({ start: false, end: false })
  const [calendarView, setCalendarView] = useState<{ start: Date; end: Date }>({ start: new Date(), end: new Date() })
  const formatDisplayDate = (date: Date) => {
    const d = date.getDate()
    const m = date.toLocaleString("en-US", { month: "short" })
    const y = String(date.getFullYear()).slice(-2)
    return `${d} ${m} ${y}`
  }
  const formatMonthLabel = (date: Date) => date.toLocaleString("en-US", { month: "long", year: "numeric" })
  const changeMonth = (which: "start" | "end", delta: number) => {
    setCalendarView((prev) => {
      const base = prev[which]
      const next = new Date(base.getFullYear(), base.getMonth() + delta, 1)
      return { ...prev, [which]: next }
    })
  }
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load agency cancellation policies
        try {
          const policiesResponse = await fetch("/api/agency-cancellation-policies")
          if (policiesResponse.ok) {
            const policies = await policiesResponse.json()
            setAgencyCancellationPolicies(policies)
          }
        } catch (error) {
          console.error("Error fetching cancellation policies:", error)
        }

        // Use useSearchParams instead of window.location.search
        const enquiryIdParam = searchParams.get("enquiryId")
        const editMode = searchParams.get("edit") === "true"
        let enquiry: EnquiryData | null = null
        let existingItinerary: ItineraryData | null = null
        let staffId: string | null | undefined = null

        if (enquiryIdParam) {
          // Fetch enquiry data
          try {
            const enquiryResponse = await fetch(`/api/enquiries?id=${enquiryIdParam}`)
            if (enquiryResponse.ok) {
              enquiry = await enquiryResponse.json()
              setEnquiryData(enquiry)
            }
          } catch (error) {
            console.error("Error fetching enquiry:", error)
          }

          // If in edit mode, try to fetch existing itinerary for this enquiry
          if (editMode) {
            try {
              const itineraryResponse = await fetch(`/api/itineraries?enquiryId=${enquiryIdParam}`)
              if (itineraryResponse.ok) {
                const itineraries = await itineraryResponse.json()
                if (itineraries && itineraries.length > 0) {
                  existingItinerary = itineraries[0]
                  if (existingItinerary) {
                    setItineraryId(existingItinerary.id)
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching itinerary:", error)
            }
          }
        } else {
          // Fallback to localStorage if no enquiryId in URL (only on client side)
          if (typeof window !== "undefined") {
            const storedEnquiry = localStorage.getItem("currentEnquiry")
            if (storedEnquiry) {
              try {
                enquiry = JSON.parse(storedEnquiry)
                setEnquiryData(enquiry)
                if (enquiry) {
                  const itineraryResponse = await fetch(`/api/itineraries?enquiryId=${enquiry.id}`)
                  if (itineraryResponse.ok) {
                    const itineraries = await itineraryResponse.json()
                    if (itineraries && itineraries.length > 0) {
                      existingItinerary = itineraries[0]
                    }
                  }
                }
              } catch (error) {
                console.error("Error parsing stored enquiry:", error)
              }
            }
          }
        }

        // Determine staffId from itinerary (preferred) or enquiry
        if (existingItinerary?.enquiry?.assignedStaff) {
          staffId = existingItinerary.enquiry.assignedStaff
        } else if (enquiry?.assignedStaff) {
          staffId = enquiry.assignedStaff
        }

        // Fetch staff name from userform if staffId exists
        if (staffId) {
          try {
            const staffRes = await fetch(`/api/auth/agency-add-user/${staffId}`)
            if (staffRes.ok) {
              const staffData = await staffRes.json()
              setAssignedStaffName(staffData.name || staffId)
            } else {
              setAssignedStaffName(staffId)
            }
          } catch {
            setAssignedStaffName(staffId)
          }
        } else {
          setAssignedStaffName("")
        }

        // Populate form data with null safety checks
        const destinations = (existingItinerary?.destinations || enquiry?.locations || "").split(", ").filter(Boolean)

        const startDate =
          existingItinerary?.startDate || (enquiry?.estimatedDates ? enquiry.estimatedDates.split(" - ")[0] : "") || ""

        const endDate =
          existingItinerary?.endDate ||
          (enquiry?.estimatedDates
            ? enquiry.estimatedDates.split(" - ")[1] || enquiry.estimatedDates.split(" - ")[0]
            : "") ||
          ""

        const travelType = (existingItinerary?.travelType || enquiry?.tourType || "").toLowerCase()
        const adults = existingItinerary?.adults ?? Number.parseInt(enquiry?.numberOfTravellers ?? "2")
        const children = existingItinerary?.children || Number.parseInt(enquiry?.numberOfKids || "0")
        const under6 = existingItinerary?.under6 || 0
        const from7to12 = existingItinerary?.from7to12 || 0
        const flightsRequired = existingItinerary?.flightsRequired || enquiry?.flightsRequired || "no"
        const pickupLocation = existingItinerary?.pickupLocation || enquiry?.pickupLocation || ""
        const dropLocation = existingItinerary?.dropLocation || enquiry?.dropLocation || ""
        const currency = existingItinerary?.currency || enquiry?.currency || "USD"
        const budget = existingItinerary?.budget || enquiry?.budget || 1000
        const activityPreferences = (existingItinerary?.activityPreferences || "").split(", ").filter(Boolean) || []
        const hotelPreferences = (existingItinerary?.hotelPreferences || "").split(", ").filter(Boolean) || []
        const mealPreference = (existingItinerary?.mealPreference || "").split(", ").filter(Boolean) || []
        const dietaryPreference = (existingItinerary?.dietaryPreference || "").split(", ").filter(Boolean) || []
        const transportPreferences = (existingItinerary?.transportPreferences || "").split(", ").filter(Boolean) || []
        const travelingWithPets = existingItinerary?.travelingWithPets || enquiry?.travelingWithPets || "no"
        const additionalRequests = existingItinerary?.additionalRequests || ""
        let moreDetails = existingItinerary?.moreDetails || enquiry?.notes || ""
        const mustSeeSpots = existingItinerary?.mustSeeSpots || enquiry?.mustSeeSpots || ""
        
        const dailyItinerary = existingItinerary?.dailyItinerary || []
        const accommodation = existingItinerary?.accommodation || []

        // Handle cancellation policy from existing itinerary's enquiryDetails
        let cancellationPolicyType = "DEFAULT"
        let customCancellationDeadline = ""
        let customCancellationTerms = ""
        let agencyCancellationPolicyId = ""

        if (existingItinerary?.enquiryDetails) {
          let enquiryDetails

          if (typeof existingItinerary.enquiryDetails === "string") {
            try {
              enquiryDetails = JSON.parse(existingItinerary.enquiryDetails)
            } catch {
              enquiryDetails = {}
            }
          } else {
            enquiryDetails = existingItinerary.enquiryDetails
          }

          cancellationPolicyType = enquiryDetails.cancellationPolicyType || "DEFAULT"
          customCancellationDeadline = enquiryDetails.customCancellationDeadline || ""
          customCancellationTerms = enquiryDetails.customCancellationTerms || ""
          agencyCancellationPolicyId = enquiryDetails.agencyCancellationPolicyId || ""
        }

        // Handle moreDetails text concatenation for sightseeing tags
        if (enquiry?.tags === "sightseeing") {
          if (enquiry.mustSeeSpots && !moreDetails.includes("Must-see spots:")) {
            moreDetails += `\n\nMust-see spots: ${enquiry.mustSeeSpots}`
          }
          
        }

        const baseFormData: TravelFormData = {
          destinations,
          startDate,
          endDate,
          travelType,
          adults,
          children,
          under6,
          from7to12,
          flightsRequired,
          pickupLocation,
          dropLocation,
          currency,
          budget,
          activityPreferences,
          hotelPreferences,
          mealPreference,
          dietaryPreference,
          transportPreferences,
          travelingWithPets,
          additionalRequests,
          moreDetails,
          mustSeeSpots,
         
          dailyItinerary,
          accommodation,
          cancellationPolicyType,
          customCancellationDeadline,
          customCancellationTerms,
          agencyCancellationPolicyId,
        }

        setFormData(baseFormData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [searchParams])

  const updateFormData = <Field extends keyof TravelFormData>(field: Field, value: TravelFormData[Field]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateCounter = (field: "adults" | "children" | "under6" | "from7to12", increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1)),
    }))
  }

  const toggleActivityPreference = (activity: string) => {
    setFormData((prev) => ({
      ...prev,
      activityPreferences: prev.activityPreferences.includes(activity)
        ? prev.activityPreferences.filter((item) => item !== activity)
        : [...prev.activityPreferences, activity],
    }))
  }

  const toggleTransportPreference = (transportId: string) => {
    setFormData((prev) => ({
      ...prev,
      transportPreferences: prev.transportPreferences.includes(transportId)
        ? prev.transportPreferences.filter((id) => id !== transportId)
        : [...prev.transportPreferences, transportId],
    }))
  }

  const handleGenerateItinerary = async () => {
    if (!enquiryData) {
      console.error("No enquiry data available to generate itinerary.")
      alert("Please select an enquiry first.")
      return
    }
  
    setIsGenerating(true)
  
    try {
      const dataToSend = {
        ...formData,
        enquiryId: enquiryData.id,
        destinations: formData.destinations.join(", "),
        activityPreferences: formData.activityPreferences.join(", "),
        hotelPreferences: formData.hotelPreferences.join(", "),
        mealPreference: formData.mealPreference.join(", "),
        dietaryPreference: formData.dietaryPreference.join(", "),
        transportPreferences: formData.transportPreferences.join(", "),
      }
  
      let response
  
      if (itineraryId) {
        console.log("Updating itinerary with ID:", itineraryId, "Data:", dataToSend)
        response = await fetch("/api/itineraries", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            id: itineraryId, 
            ...dataToSend,
            // Reset edit flags when regenerating from form
            isEdited: false,
            editedAt: null,
            editedPdfUrl: null
          }),
        })
      } else {
        console.log("Creating new itinerary with Data:", dataToSend)
        response = await fetch("/api/itineraries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        })
      }
  
      if (!response.ok) {
        let errorMessage = "Failed to process itinerary"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error("API Error Details:", errorData)
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError)
          errorMessage = response.statusText || errorMessage
        }
        alert(`Error: ${errorMessage}`)
        return
      }
  
      const processedItinerary = await response.json()
  console.log(processedItinerary)
      // Generate PDF after successfully creating/updating itinerary
      // This is the ORIGINAL PDF generation (not edited)
      try {
        console.log("[v0] Generating original PDF...")
        const pdfResponse = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enquiryId: enquiryData.id,
            itineraryId: processedItinerary.id,
            formData: dataToSend,
            isEditedVersion: false, // This is the original version
          }),
        })
  
        console.log("[v0] PDF response status:", pdfResponse.status)
  
        if (pdfResponse.ok) {
          const pdfResult = await pdfResponse.json()
          console.log("[v0] Original PDF generated successfully:", pdfResult)
  
          alert("Itinerary and PDF generated successfully!")
          setIsGenerated(true)
  
          // Redirect to itinerary view
          router.push(
            `/agency-admin/dashboard/Itenary-view?enquiryId=${enquiryData.id}&itineraryId=${processedItinerary.id}&customerId=${enquiryData.customerId || ""}`,
          )
        } else {
          // Handle PDF generation error but still redirect
          let pdfErrorMessage = "PDF generation failed"
          try {
            const contentType = pdfResponse.headers.get("content-type")
            
            if (contentType && contentType.includes("application/json")) {
              const pdfError = await pdfResponse.json()
              pdfErrorMessage = pdfError.error || pdfError.message || pdfErrorMessage
              if (pdfError.details) {
                pdfErrorMessage += `: ${pdfError.details}`
              }
            } else {
              const errorText = await pdfResponse.text()
              pdfErrorMessage = errorText || `HTTP ${pdfResponse.status}: ${pdfResponse.statusText}`
            }
          } catch  {
            pdfErrorMessage = `HTTP ${pdfResponse.status}: ${pdfResponse.statusText}`
          }
  
          console.error("[v0] PDF generation failed:", pdfErrorMessage)
          alert(`PDF generation failed: ${pdfErrorMessage}`)
  
          // Still redirect to share customer page
          router.push(
            `/agency-admin/dashboard/share-customer?enquiryId=${enquiryData.id}&itineraryId=${processedItinerary.id}&customerId=${enquiryData.customerId || ""}`,
          )
        }
      } catch (pdfError) {
        console.error("[v0] Error generating PDF:", pdfError)
        alert("Itinerary saved, but PDF generation failed. You can regenerate it later.")
  
        // Still redirect
        router.push(
          `/agency-admin/dashboard/share-customer?enquiryId=${enquiryData.id}&itineraryId=${processedItinerary.id}&customerId=${enquiryData.customerId || ""}`,
        )
      }
    } catch (error) {
      console.error("Error processing itinerary:", error)
      alert(`Failed to process itinerary: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleMealPreference = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      mealPreference: prev.mealPreference.includes(value)
        ? prev.mealPreference.filter((item: string) => item !== value)
        : [...prev.mealPreference, value],
    }))
  }

  const toggleDietaryPreference = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      dietaryPreference: prev.dietaryPreference.includes(value)
        ? prev.dietaryPreference.filter((item: string) => item !== value)
        : [...prev.dietaryPreference, value],
    }))
  }


  const toggleHotelPreference = (preference: string) => {
    setFormData((prev) => ({
      ...prev,
      hotelPreferences: prev.hotelPreferences.includes(preference)
        ? prev.hotelPreferences.filter((item) => item !== preference)
        : [...prev.hotelPreferences, preference],
    }))
  }

  const removeDestination = (destination: string) => {
    setFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.filter((item) => item !== destination),
    }))
  }

  const removeHotelPreference = (preference: string) => {
    setFormData((prev) => ({
      ...prev,
      hotelPreferences: prev.hotelPreferences.filter((item) => item !== preference),
    }))
  }


  const hotelOptions = [
    { value: "no-preference", label: "No Preference" },
    { value: "budget", label: "Budget (1-2 Star)" },
    { value: "standard", label: "Standard (3 Star)" },
    { value: "premium", label: "Premium (4 Star)" },
    { value: "luxury", label: "Luxury (5 Star)" },
    { value: "boutique", label: "Boutique / Heritage stay" },
  ]

  const renderConditionalFields = () => {
    if (enquiryData?.tags === "sightseeing") {
      return (
        <>
          {/* Must-see spots */}
          <div>
            <Label className="text-sm font-medium text-black mb-2 block text-lg font-semibold font-poppins">
              Must-see spots <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              value={formData.mustSeeSpots}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData("mustSeeSpots", e.target.value)}
              placeholder="List the must-see spots or attractions"
              className="min-h-[80px] text-xs text-gray-500 font-Lato"
              rows={3}
            />
          </div>
         
         
        </>
      )
    } else if (enquiryData?.tags === "full-package") {
      return (
        <>
          {/* Flights required */}
          <div>
            <Label className="text-sm font-medium text-black font-bold mb-3 block text-lg font-semibold font-poppins">
              Flights required?
            </Label>
            <RadioGroup
              value={formData.flightsRequired}
              onValueChange={(value: string) => updateFormData("flightsRequired", value)}
            >
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="yes"
                    id="flights-yes-itinerary"
                    className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
                  />
                  <Label htmlFor="flights-yes-itinerary" className="text-xs">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="no"
                    id="flights-no-itinerary"
                    className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
                  />
                  <Label htmlFor="flights-no-itinerary" className="text-xs">
                    No
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          {/* Traveling with Pets */}
          <div>
            <Label className="text-sm font-medium text-black font-bold mb-3 block text-lg font-semibold font-poppins">
              Are you traveling with pets?
            </Label>
            <RadioGroup
              value={formData.travelingWithPets}
              onValueChange={(value: string) => updateFormData("travelingWithPets", value)}
            >
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="yes"
                    id="pets-yes-itinerary"
                    className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
                  />
                  <Label htmlFor="pets-yes-itinerary" className="text-xs">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="no"
                    id="pets-no-itinerary"
                    className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
                  />
                  <Label htmlFor="pets-no-itinerary" className="text-xs">
                    No
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </>
      )
    }
    return null
  }

  const renderCancellationPolicy = () => {
    return (
      <div>
        <Label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
          Cancellation Policy & Terms
        </Label>
        <div className="text-xs text-blue-600 mb-3">
          ✓ Customers will see this in their itinerary and booking confirmation
        </div>
        <RadioGroup
          value={formData.cancellationPolicyType}
          onValueChange={(value: string) => updateFormData("cancellationPolicyType", value)}
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="DEFAULT"
                id="policy-default"
                className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
              />
              <Label htmlFor="policy-default" className="text-xs">
                Use Default Agency Policy
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="CUSTOM"
                id="policy-custom"
                className="h-4 w-4 text-emerald-700 border-gray-300 focus:ring-emerald-700"
              />
              <Label htmlFor="policy-custom" className="text-xs">
                Custom Policy for This Trip
              </Label>
            </div>
          </div>
        </RadioGroup>

        {/* Custom Policy Fields */}
        {formData.cancellationPolicyType === "CUSTOM" && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Cancellation Deadline: <span className="text-xs text-gray-500">15 days before start date</span>
              </Label>
              <Input
                type="text"
                value={formData.customCancellationDeadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("customCancellationDeadline", e.target.value)
                }
                placeholder="15 days before start date"
                className="text-xs text-gray-500 font-Lato"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Charges: <span className="text-xs text-gray-500">50% after deadline, 100% for no-shows</span>
              </Label>
              <div className="text-xs text-gray-600 mb-2">
                Additional Conditions: Weather disruptions subject to rescheduling
              </div>
              <Textarea
                value={formData.customCancellationTerms}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateFormData("customCancellationTerms", e.target.value)
                }
                placeholder="Cancellation Deadline: 15 days before start date&#10;Charges: 50% after deadline, 100% for no-shows&#10;Additional Conditions: Weather disruptions subject to rescheduling"
                className="min-h-[100px] text-xs text-gray-500 font-Lato"
                rows={4}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-poppins flex items-center justify-center">
        <div className="text-center">Loading enquiry data...</div>
      </div>
    )
  }

  return (
    <div id="generate" className="min-h-screen bg-gray-50 p-6 font-poppins">
      <div className="max-w-7xl mx-auto h-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Main Form - 3/4 width */}
          <div className="lg:col-span-3 h-full">
            <div className="bg-white rounded-lg shadow-sm p-6 max-h-screen overflow-y-auto">
              <div className="space-y-6 h-full">
                <h1 className="text-lg font-semibold text-gray-900 font-poppins">Choose travel destination</h1>

                {/* Destination Selection */}
                <div className="relative">
                  <div
                    className="w-full min-h-12 p-3 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center"
                    onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
                  >
                    {formData.destinations.map((dest) => (
                      <Badge key={dest} className="bg-orange-500 text-white px-3 py-1 text-xs flex items-center gap-1">
                        {dest}
                        <X
                          className="h-3 w-3 cursor-pointer hover:bg-orange-600 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeDestination(dest)
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-black mb-2 block text-lg font-semibold font-poppins">
                      Start date
                    </Label>
                    <div className="relative">
                      <div
                        className="h-12 px-3 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          setShowCalendar((prev) => ({ ...prev, start: !prev.start }))
                          setCalendarView((prev) => {
                            const base = formData.startDate ? new Date(formData.startDate) : new Date()
                            return { ...prev, start: new Date(base.getFullYear(), base.getMonth(), 1) }
                          })
                        }}
                      >
                        <span className={formData.startDate ? "text-gray-900" : "text-gray-400"}>
                          {formData.startDate || "Select start date"}
                        </span>
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      {showCalendar.start && (
                        <div className="absolute z-10 mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={() => changeMonth("start", -1)} className="p-1 hover:bg-gray-100 rounded">
                              <ChevronLeft className="h-4 w-4 text-gray-600" />
                            </button>
                            <div className="text-sm text-gray-600">{formatMonthLabel(calendarView.start)}</div>
                            <button type="button" onClick={() => changeMonth("start", 1)} className="p-1 hover:bg-gray-100 rounded">
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                              <div key={`${d}-${i}`} className="p-2 text-center font-medium text-gray-400">{d}</div>
                            ))}
                            {Array.from({ length: new Date(calendarView.start.getFullYear(), calendarView.start.getMonth(), 1).getDay() }).map((_, i) => (
                              <div key={`blank-${i}`} className="p-2" />
                            ))}
                            {Array.from({ length: new Date(calendarView.start.getFullYear(), calendarView.start.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                              <div
                                key={day}
                                className="p-2 text-center cursor-pointer hover:bg-green-100 rounded"
                                onClick={() => {
                                  const y = calendarView.start.getFullYear()
                                  const m = calendarView.start.getMonth()
                                  const selected = new Date(y, m, day)
                                  updateFormData("startDate", formatDisplayDate(selected) as any)
                                  setShowCalendar((prev) => ({ ...prev, start: false }))
                                }}
                              >
                                {day}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-black mb-2 block text-lg font-semibold font-poppins">
                      End date
                    </Label>
                    <div className="relative">
                      <div
                        className="h-12 px-3 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          setShowCalendar((prev) => ({ ...prev, end: !prev.end }))
                          setCalendarView((prev) => {
                            const base = formData.endDate ? new Date(formData.endDate) : new Date()
                            return { ...prev, end: new Date(base.getFullYear(), base.getMonth(), 1) }
                          })
                        }}
                      >
                        <span className={formData.endDate ? "text-gray-900" : "text-gray-400"}>
                          {formData.endDate || "Select end date"}
                        </span>
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      {showCalendar.end && (
                        <div className="absolute z-10 mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={() => changeMonth("end", -1)} className="p-1 hover:bg-gray-100 rounded">
                              <ChevronLeft className="h-4 w-4 text-gray-600" />
                            </button>
                            <div className="text-sm text-gray-600">{formatMonthLabel(calendarView.end)}</div>
                            <button type="button" onClick={() => changeMonth("end", 1)} className="p-1 hover:bg-gray-100 rounded">
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                              <div key={`${d}-${i}`} className="p-2 text-center font-medium text-gray-400">{d}</div>
                            ))}
                            {Array.from({ length: new Date(calendarView.end.getFullYear(), calendarView.end.getMonth(), 1).getDay() }).map((_, i) => (
                              <div key={`blank-e-${i}`} className="p-2" />
                            ))}
                            {Array.from({ length: new Date(calendarView.end.getFullYear(), calendarView.end.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                              <div
                                key={day}
                                className="p-2 text-center cursor-pointer hover:bg-green-100 rounded"
                                onClick={() => {
                                  const y = calendarView.end.getFullYear()
                                  const m = calendarView.end.getMonth()
                                  const selected = new Date(y, m, day)
                                  updateFormData("endDate", formatDisplayDate(selected) as any)
                                  setShowCalendar((prev) => ({ ...prev, end: false }))
                                }}
                              >
                                {day}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Travel Type */}
                <div>
                  <label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
                    Travel type
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: "solo", label: "Solo", icon: <Image src="/solo.png" alt="Solo" width={16} height={16} /> },
                      {
                        id: "family",
                        label: "Family",
                        icon: <Image src="/family.png" alt="Family" width={16} height={16} />,
                      },
                      {
                        id: "group",
                        label: "Group",
                        icon: <Image src="/group.png" alt="Group" width={16} height={16} />,
                      },
                      {
                        id: "friends",
                        label: "Friends",
                        icon: <Image src="/frnd.png" alt="Friends" width={16} height={16} />,
                      },
                    ].map((type) => (
                      <div
                        key={type.id}
                        className={`h-16 flex items-center justify-between px-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.travelType.toLowerCase() === type.id
                            ? "border-gray-200 bg-gray-200 bg-orange-200"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => updateFormData("travelType", type.id)}
                      >
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        <div
                          className={`p-5 mr-[-12px] rounded-lg transition-colors ${
                            formData.travelType.toLowerCase() === type.id
                              ? "bg-light-orange text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {type.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traveler Counts */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { key: "adults", label: "Adults (13+)", value: formData.adults },
                      { key: "children", label: "Children", value: formData.children },
                      { key: "under6", label: "Under 6 years", value: formData.under6 },
                      { key: "from7to12", label: "From 7 - 12", value: formData.from7to12 },
                    ].map((item) => (
                      <div key={item.key} className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">{item.label}</Label>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white"
                            onClick={() =>
                              updateCounter(item.key as "adults" | "children" | "under6" | "from7to12", false)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.value}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white"
                            onClick={() =>
                              updateCounter(item.key as "adults" | "children" | "under6" | "from7to12", true)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3 font-poppins">
                    *Please specify age for accurate pricing
                  </p>
                </div>

                {/* Pickup and Drop Locations */}
                <div>
                  <Label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
                    Pickup and drop locations
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Pickup</Label>
                      <Input
                        type="text"
                        value={formData.pickupLocation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateFormData("pickupLocation", e.target.value)
                        }
                        className="h-12"
                        placeholder="Enter pickup location"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Drop off</Label>
                      <Input
                        type="text"
                        value={formData.dropLocation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateFormData("dropLocation", e.target.value)
                        }
                        className="h-12"
                        placeholder="Enter drop location"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency and Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-black font-bold mb-2 block text-lg font-semibold font-poppins">
                      Currency
                    </Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: string) => updateFormData("currency", value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-black font-bold mb-3 block text-lg font-semibold font-poppins">
                      Budget
                    </Label>
                    <div className="px-2">
                      <Slider
                        defaultValue={[formData.budget]}
                        onValueChange={(value: number[]) => updateFormData("budget", value[0])}
                        max={50000}
                        min={100}
                        step={100}
                        className="mb-3"
                      />
                      <div className="flex justify-between text-xs text-gray-500 font-poppins">
                        <span>{getCurrencySymbol(formData.currency)}100</span>
                        <div className="bg-green-100 px-2 py-1 rounded text-green-800 font-medium text-xs">
                          {getCurrencySymbol(formData.currency)}{formData.budget}
                        </div>
                        <span>{getCurrencySymbol(formData.currency)}50000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional fields based on tags */}
                {renderConditionalFields()}

                {/* Activity Preferences */}
                <div>
                  <Label className="text-sm text-black mb-3 block font-bold text-lg font-semibold font-poppins">
                    Activity preferences
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {activityOptions.map((activity) => (
                      <Button
                        key={activity.id}
                        variant="outline"
                        className={cn(
                          "h-10 justify-start gap-2 text-xs",
                          formData.activityPreferences.includes(activity.id)
                            ? "bg-gray-400 text-gray-600 border-gray-300 font-bold"
                            : "border-gray-400 hover:border-gray-400 text-gray-600 font-bold",
                        )}
                        onClick={() => toggleActivityPreference(activity.id)}
                      >
                        {activity.icon}
                        {activity.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Hotel Preference */}
               <div>
  <Label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
    Hotel preference
  </Label>
  <div className="relative">
    <div
      className="w-full min-h-12 p-3 border border-gray-300 rounded-md bg-white cursor-pointer flex flex-wrap gap-2 items-center"
      onClick={() => setShowHotelDropdown(!showHotelDropdown)}
    >
      {formData.hotelPreferences.map((pref) => {
        const option = hotelOptions.find((opt) => opt.value === pref)
        return (
          <Badge
            key={pref}
            className="bg-orange-500 text-white px-3 py-1 text-xs flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {option?.label}
            <X
              className="h-3 w-3 cursor-pointer hover:bg-orange-600 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                removeHotelPreference(pref)
              }}
            />
          </Badge>
        )
      })}
      <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />
    </div>
    {showHotelDropdown && (
      <div 
        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
        ref={dropdownRef}
      >
        {hotelOptions.map((option) => (
          <div
            key={option.value}
            className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
              formData.hotelPreferences.includes(option.value) ? "bg-green-50" : ""
            }`}
            onClick={() => {
              toggleHotelPreference(option.value);
              setShowHotelDropdown(false);
            }}
          >
            <span>{option.label}</span>
            {formData.hotelPreferences.includes(option.value) && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
  <p className="text-xs text-gray-500 font-poppins mt-2">
    *This helps us match your comfort expectations and budget
  </p>
</div>

                {/* Meal and Dietary Preferences */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
                      Meal / Food preference
                    </Label>
                    <div className="space-y-2">
                      {[
                        { value: "breakfast", label: "Continental Plan ( CP ) " },
                        { value: "breakfast-dinner", label: "Modified American Plan ( MAP )" },
                        { value: "all-meals", label: "American Plan ( AP )" },
                        { value: "European", label: "European Plan ( EP )" },
                        { value: "no-meals", label: "No meals required" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center",
                              formData.mealPreference.includes(option.value)
                                ? "bg-green-600 border-green-600"
                                : "border-gray-300 hover:border-gray-400",
                            )}
                            onClick={() => toggleMealPreference(option.value)}
                          >
                            {formData.mealPreference.includes(option.value) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <Label className="text-xs cursor-pointer" onClick={() => toggleMealPreference(option.value)}>
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
                      Dietary preference
                    </Label>
                    <div className="space-y-2">
                      {[
                        { value: "no-preference", label: "No preference" },
                        { value: "non-vegetarian", label: "Non - vegetarian" },
                        { value: "vegetarian", label: "Vegetarian" },
                        { value: "jain", label: "Jain" },
                        { value: "vegan", label: "Vegan" },
                        { value: "eggetarian", label: "Eggetarian" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center",
                              formData.dietaryPreference.includes(option.value)
                                ? "bg-green-600 border-green-600"
                                : "border-gray-300 hover:border-gray-400",
                            )}
                            onClick={() => toggleDietaryPreference(option.value)}
                          >
                            {formData.dietaryPreference.includes(option.value) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <Label
                            className="text-xs cursor-pointer"
                            onClick={() => toggleDietaryPreference(option.value)}
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Textarea
                        placeholder="*Any food allergies or additional requests ?"
                        className="text-xs"
                        rows={2}
                        value={formData.additionalRequests}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateFormData("additionalRequests", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Transport */}
                <div>
                  <Label className="text-sm font-medium text-black mb-3 block text-lg font-semibold font-poppins">
                    Preferred transport
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {transportOptions.map((transport) => (
                      <Button
                        key={transport.id}
                        variant="outline"
                        className={cn(
                          "h-10 justify-center text-xs border-2 ",
                          formData.transportPreferences.includes(transport.id)
                          ? `${transport.color} bg-gray-600 text-white`
 : "bg-white border-white hover:border-gray-900",
                        )}
                        onClick={() => toggleTransportPreference(transport.id)}
                        
                      >
                        {transport.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cancellation Policy */}
                {renderCancellationPolicy()}

                {/* More Details */}
                <div>
                  <Label className="text-sm font-medium text-black mb-2 block text-lg font-semibold font-poppins">
                    More details
                  </Label>
                  <Textarea
                    value={formData.moreDetails}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateFormData("moreDetails", e.target.value)
                    }
                    className="min-h-[100px] text-xs text-gray-500 font-Lato"
                    rows={5}
                  />
                </div>

                {/* Generate Button */}
                <div className="pt-2">
                  <Button 
                    className="bg-dark-green hover:bg-dark-green text-white py-2 px-6 rounded-lg font-medium transition-colors"
                    onClick={handleGenerateItinerary}
                    disabled={isGenerating || isGenerated}
                  >
                    {isGenerating ? 'Generating...' : isGenerated ? 'Itinerary Generated' : 'Generate Itinerary'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details Sidebar - 1/4 width */}
          <div className="lg:col-span-1">
            <Card
              className="border-5 border-white shadow-lg bg-gray-200 shadow-lg relative"
              style={{
                width: "283px",
                height: "332px",
                background: "linear-gradient(to bottom, rgba(79, 142, 101, 0.07), rgba(91, 193, 127, 0.38))",
              }}
            >
              <CardContent className="p-4 ml-[24px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 font-poppins">Customer Details</h3>
                  <Edit
                    className="h-4 w-4 text-gray-600 cursor-pointer hover:text-gray-800"
                    onClick={() => setShowEnquiryForm(true)}
                  />
                </div>
                <div className="mb-3">
                  <div className="bg-green-800 text-white px-3 py-1 rounded text-xs font-medium text-center font-poppins">
                    Enquiry on : {enquiryData?.enquiryDate || "23-03-2025"}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20 font-poppins">Phone :</span>
                    <span className="text-gray-900">{enquiryData?.phone || "+91 9123456789"}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20">Email :</span>
                    <span className="text-gray-900 font-poppins">{enquiryData?.email || "abc@gmail.com"}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20">Location(s) :</span>
                    <span className="text-gray-900 font-poppins">{enquiryData?.locations || "Kashmir, Goa"}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20">Tour Type :</span>
                    <span className="text-gray-900">{enquiryData?.tourType || "Group"}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20">Budget :</span>
                    <span className="text-gray-900">
                      {getCurrencySymbol(enquiryData?.currency || "USD")}
                      {enquiryData?.budget || "1000"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20 font-poppins ">Date Range :</span>
                    <span className="text-gray-900 font-poppins">
                      {enquiryData?.estimatedDates || "15 Mar 25 - 20 Mar 25"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20 font-poppins">Point of Contact :</span>
                    <span className="text-gray-900 font-poppins">{enquiryData?.pointOfContact || "AStaff2"}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-700 font-medium w-20 font-poppins">Assigned Staff:</span>
                    <span className="text-gray-900 font-poppins">{assignedStaffName || enquiryData?.assignedStaff || "AStaff2"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component that wraps ItineraryFormContent in Suspense
export default function ItineraryFormPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ItineraryFormContent />
    </Suspense>
  )
}
