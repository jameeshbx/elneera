"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Define types for your enquiries
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
  assignedStaff: string | null
  pointOfContact: string | null
  notes: string | null
  leadSource: string
  status: string
  enquiryDate: string
  createdAt: string
  updatedAt: string
}

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
  assignedStaff: string | null
  pointOfContact: string | null
  notes: string | null
  leadSource: string
  status: string
  enquiryDate: string
  createdAt: string
  updatedAt: string
}

type Enquiry = AccommodationEnquiry | FlightEnquiry

export default function ItineraryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const enquiryId = searchParams.get("id")
  const enquiryType = searchParams.get("type") // 'accommodation' or 'flight'
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enquiryId || !enquiryType) {
      setError("Enquiry ID or type is missing.")
      setLoading(false)
      return
    }

    const fetchEnquiryDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const apiUrl = enquiryType === "accommodation" 
          ? `/api/accommodation-enquiries?id=${enquiryId}`
          : `/api/flight-enquiries?id=${enquiryId}`

        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch ${enquiryType} enquiry.`)
        }
        
        const data = await response.json()
        setEnquiry(data)
      } catch (err) {
        console.error("Error fetching enquiry:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred.")
        toast.error("Failed to load itinerary", {
          description: err instanceof Error ? err.message : "Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEnquiryDetails()
  }, [enquiryId, enquiryType])

  // Helper function to check if enquiry is accommodation type
  const isAccommodationEnquiry = (enquiry: Enquiry): enquiry is AccommodationEnquiry => {
    return enquiryType === "accommodation" && "locations" in enquiry
  }

  // Helper function to check if enquiry is flight type
  const isFlightEnquiry = (enquiry: Enquiry): enquiry is FlightEnquiry => {
    return enquiryType === "flight" && "departureCity" in enquiry
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading itinerary details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!enquiry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>No Enquiry Found</CardTitle>
            <CardDescription>The requested enquiry could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Generated Itinerary</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold text-green-700">
              Enquiry for {enquiry.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Enquiry ID: {enquiry.id} | Type: {enquiryType === "accommodation" ? "Accommodation" : "Flight"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="font-medium">Phone:</p>
                <p>{enquiry.phone}</p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p>{enquiry.email}</p>
              </div>
              <div>
                <p className="font-medium">Enquiry Date:</p>
                <p>{enquiry.enquiryDate}</p>
              </div>
              <div>
                <p className="font-medium">Lead Source:</p>
                <p>{enquiry.leadSource}</p>
              </div>
              <div>
                <p className="font-medium">Assigned Staff:</p>
                <p>{enquiry.assignedStaff || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium">Point of Contact:</p>
                <p>{enquiry.pointOfContact || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium">Status:</p>
                <p className="capitalize">{enquiry.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="font-medium">Created:</p>
                <p>{new Date(enquiry.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {enquiry.notes && (
              <>
                <Separator className="my-2" />
                <div>
                  <p className="font-medium">Notes:</p>
                  <p className="text-sm italic">{enquiry.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isAccommodationEnquiry(enquiry) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-purple-700">Accommodation Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="font-medium">Locations:</p>
                  <p>{enquiry.locations.join(", ")}</p>
                </div>
                <div>
                  <p className="font-medium">Dates:</p>
                  <p>{enquiry.startDate} - {enquiry.endDate}</p>
                </div>
                <div>
                  <p className="font-medium">Guests:</p>
                  <p>
                    {enquiry.adults} Adults, {enquiry.children} Children (Under 6: {enquiry.under5}, 6-12: {enquiry.from6to12})
                  </p>
                </div>
                <div>
                  <p className="font-medium">Budget:</p>
                  <p>${enquiry.budget}</p>
                </div>
                <div>
                  <p className="font-medium">Accommodation Type:</p>
                  <p>
                    {enquiry.accommodationType
                      .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
                      .join(", ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Hotel Preference:</p>
                  <p>
                    {enquiry.hotelPreference
                      .map((pref) =>
                        pref
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")
                      )
                      .join(", ") || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isFlightEnquiry(enquiry) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-blue-700">Flight Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="font-medium">Route:</p>
                  <p>{enquiry.departureCity} → {enquiry.returnCity}</p>
                </div>
                <div>
                  <p className="font-medium">Dates:</p>
                  <p>{enquiry.departureDate} - {enquiry.returnDate}</p>
                </div>
                <div>
                  <p className="font-medium">Preferred Class:</p>
                  <p>
                    {enquiry.preferredAirlineClass
                      .split("-")
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Passengers:</p>
                  <p>
                    {enquiry.numberOfTravellers} Adults
                    {enquiry.numberOfKids ? `, ${enquiry.numberOfKids} Children` : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-lg font-semibold text-gray-800">Your itinerary is ready!</p>
          <p className="text-sm text-gray-600 mt-2">
            You can now use these details to further process the booking or share with the customer.
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <Button 
              onClick={() => window.print()}
              variant="outline"
            >
              Print Itinerary
            </Button>
            <Button 
              onClick={() => {
                // Add functionality to generate PDF or share
                toast.success("Feature coming soon!", {
                  description: "PDF generation and sharing will be available soon."
                })
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Share Itinerary
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}