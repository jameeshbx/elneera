"use client";

import { useState, useEffect, Suspense } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Download,
  Edit,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import MapComponent from "@/components/MapComponent";

// Define types for the CSV itinerary data
interface CsvActivity {
  time: string;
  title: string;
  type: string;
  description: string;
  image?: string;
}

interface CsvDayItinerary {
  day: number;
  date: string;
  title: string;
  activities: CsvActivity[];
}

interface CsvItineraryData {
  quoteId: string;
  name: string;
  days: number;
  nights: number;
  startDate: string;
  costINR: number;
  costUSD: number;
  guests: number;
  adults: number;
  kids: number;
  dailyItinerary: CsvDayItinerary[];
  locationMatched?: string;
}

// Keep existing interfaces for database data
interface Activity {
  time: string;
  title: string;
  type: string;
  description: string;
  image?: string;
}

interface DayItinerary {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
}

interface Accommodation {
  name: string;
  rating: number;
  nights: number;
  image: string;
}

interface BudgetEstimation {
  amount: number;
  currency: string;
  costTourist: number;
}

interface EnquiryDetails {
  description: string;
}

interface ItineraryData {
  id: string;
  enquiryId: string;
  location: string;
  numberOfDays: string;
  travelStyle: string;
  budgetEstimation: BudgetEstimation;
  accommodation: Accommodation[];
  dailyItinerary: DayItinerary[];
  enquiryDetails: EnquiryDetails;
  destinations: string;
  startDate: string;
  endDate: string;
  travelType: string;
  adults: number;
  children: number;
  under6: number;
  from7to12: number;
  flightsRequired: string;
  pickupLocation: string | null;
  dropLocation: string | null;
  currency: string;
  budget: number;
  activityPreferences: string;
  hotelPreferences: string;
  mealPreference: string;
  dietaryPreference: string;
  transportPreferences: string;
  travelingWithPets: string;
  additionalRequests: string | null;
  moreDetails: string | null;
  mustSeeSpots: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  enquiry: {
    id: string;
    name: string;
    phone: string;
    email: string;
    locations: string;
    tourType: string;
    estimatedDates: string;
    currency: string;
    budget: number;
    enquiryDate: string;
    assignedStaff: string | null;
    pointOfContact: string | null;
    notes: string | null;
  };
}

const staffMembers = [
  "Kevin Blake",
  "Maria Rodriguez",
  "Priya Sharma",
  "Ahmed Khan",
  "Emily Johnson",
];

function ItineraryViewContent() {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(
    null
  );
  const [csvItineraryData, setCsvItineraryData] =
    useState<CsvItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({
    1: true,
  });
  const [showReassignStaffDialog, setShowReassignStaffDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [useCSVData, setUseCSVData] = useState(false);
  const [, setLocationBasedData] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchItineraryData = async () => {
      setLoading(true);
      try {
        const enquiryId = searchParams.get("enquiryId");
        const itineraryId = searchParams.get("itineraryId");

        let enquiryLocation = "";

        // First, fetch enquiry data to get location information
        if (enquiryId) {
          try {
            const enquiryResponse = await fetch(
              `/api/enquiries?id=${enquiryId}`
            );
            if (enquiryResponse.ok) {
              const enquiryData = await enquiryResponse.json();
              if (enquiryData && enquiryData.locations) {
                enquiryLocation = enquiryData.locations;
                setLocationBasedData(enquiryLocation);
              }
            }
          } catch {
            console.log("Could not fetch enquiry location data");
          }

          // Try to fetch CSV itinerary data based on enquiry location
          try {
            let csvApiUrl = `/api/itinerary-csv?enquiryId=${enquiryId}`;
            if (enquiryLocation) {
              csvApiUrl += `&location=${encodeURIComponent(enquiryLocation)}`;
            }

            const csvResponse = await fetch(csvApiUrl);
            if (csvResponse.ok) {
              const csvData = await csvResponse.json();
              setCsvItineraryData(csvData);
              setUseCSVData(true);
              console.log(
                `Location-based itinerary loaded for: ${enquiryLocation} -> ${csvData.quoteId}`
              );
            }
          } catch {
            console.log(
              "CSV data not available, falling back to database data"
            );
            setUseCSVData(false);
          }
        }

        // Then fetch database itinerary data as fallback
        let apiUrl = "";
        if (itineraryId) {
          apiUrl = `/api/itineraries?id=${itineraryId}`;
        } else if (enquiryId) {
          apiUrl = `/api/itineraries?enquiryId=${enquiryId}`;
        } else {
          console.error("No enquiryId or itineraryId provided in URL.");
          setLoading(false);
          return;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch itinerary: ${response.statusText}`);
        }

        const data = await response.json();
        const fetchedItinerary = Array.isArray(data) ? data[0] : data;

        if (fetchedItinerary) {
          const mappedData: ItineraryData = {
            ...fetchedItinerary,
            location:
              fetchedItinerary.enquiry?.locations || enquiryLocation || "N/A",
            numberOfDays: fetchedItinerary.enquiry?.estimatedDates || "N/A",
            travelStyle: fetchedItinerary.enquiry?.tourType || "N/A",
            budgetEstimation: {
              amount: fetchedItinerary.enquiry?.budget || 0,
              currency: fetchedItinerary.enquiry?.currency || "USD",
              costTourist: 32.3,
            },
            enquiryDetails: {
              description:
                fetchedItinerary.moreDetails ||
                fetchedItinerary.enquiry?.notes ||
                "No additional details provided.",
            },
            dailyItinerary: fetchedItinerary.dailyItinerary || [],
            accommodation: fetchedItinerary.accommodation || [],
          };

          setItineraryData(mappedData);
          setSelectedStaff(fetchedItinerary.enquiry?.assignedStaff || "");

          // If we don't have CSV data yet, try to get it based on the enquiry location
          if (
            !csvItineraryData &&
            mappedData.location &&
            mappedData.location !== "N/A"
          ) {
            try {
              const csvResponse = await fetch(
                `/api/itinerary-csv?location=${encodeURIComponent(
                  mappedData.location
                )}`
              );
              if (csvResponse.ok) {
                const csvData = await csvResponse.json();
                setCsvItineraryData(csvData);
                console.log(
                  `Location-based CSV data loaded for: ${mappedData.location} -> ${csvData.quoteId}`
                );
              }
            } catch {
              console.log("Could not load location-based CSV data");
            }
          }
        } else {
          setItineraryData(null);
        }
      } catch (error) {
        console.error("Error fetching itinerary:", error);
        setItineraryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryData();
  }, [searchParams]);

  const toggleDayExpansion = (day: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const handleEditPlan = () => {
    if (!itineraryData) return;

    const queryParams = new URLSearchParams({
      enquiryId: itineraryData.enquiryId,
      edit: "true",
    });

    if (typeof window !== "undefined") {
      window.location.href = `/agency/dashboard/Itenary-form?${queryParams.toString()}`;
    }
  };

  const handleExportPDF = () => {
    if (typeof window === "undefined") return;

    const printContent = document.getElementById("itinerary-content");
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printArea = printContent.cloneNode(true) as HTMLElement;

    document.body.innerHTML = "";
    document.body.appendChild(printArea);
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleShareToCustomer = () => {
    if (!itineraryData) {
      console.error("No enquiry data available to generate itinerary.");
      alert("Please select an enquiry first.");
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const enquiryId = searchParams.get("enquiryId") || itineraryData?.enquiryId || "";
    const itineraryId = searchParams.get("itineraryId") || itineraryData?.id || "";
    const customerId = searchParams.get("customerId") || "";

    const queryParams = new URLSearchParams({
      enquiryId,
      itineraryId,
      customerId,
    });

    if (typeof window !== "undefined") {
      window.location.href = `/agency/dashboard/share-customer?${queryParams.toString()}`;
    }
  };

  const handleGenerateOtherPlan = async () => {
    if (!itineraryData) return;

    try {
      // Try to load a different template based on similar locations
      //const currentLocationLower = itineraryData.location.toLowerCase()
      const alternativeQuotes = [
        "KASH001",
        "KER001",
        "GOA001",
        "RAJ001",
        "EVER001",
        "THAI001",
      ];
      const currentQuoteId = csvItineraryData?.quoteId;

      // Filter out current quote and get alternatives
      const alternatives = alternativeQuotes.filter(
        (id) => id !== currentQuoteId
      );
      const randomAlternative =
        alternatives[Math.floor(Math.random() * alternatives.length)];

      const csvResponse = await fetch(
        `/api/itinerary-csv?quoteId=${randomAlternative}`
      );
      if (csvResponse.ok) {
        const csvData = await csvResponse.json();
        setCsvItineraryData(csvData);
        setUseCSVData(true);
        alert(`Generated alternative plan: ${csvData.name}`);
      }
    } catch (error) {
      console.error("Error generating alternative plan:", error);
      alert("Failed to generate alternative plan");
    }
  };

  const handleReassignStaff = async () => {
    if (!itineraryData || !selectedStaff) return;

    try {
      const response = await fetch("/api/enquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itineraryData.enquiryId,
          assignedStaff: selectedStaff,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reassign staff");
      }

      setItineraryData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          enquiry: {
            ...prev.enquiry,
            assignedStaff: selectedStaff,
          },
        };
      });

      setShowReassignStaffDialog(false);
      alert(`Staff reassigned to ${selectedStaff} successfully!`);
    } catch (error) {
      console.error("Error reassigning staff:", error);
      alert(
        `Failed to reassign staff: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      "airport-arrival": "✈️",
      "airport-departure": "🛫",
      transfer: "🚗",
      "hotel-checkin": "🏨",
      "hotel-checkout": "🏨",
      meal: "🍽️",
      activity: "🎯",
      sightseeing: "📸",
      adventure: "🏔️",
      nature: "🌿",
      shopping: "🛍️",
    };
    return icons[type] || "📍";
  };

  const getLocationSpecificContent = (location: string) => {
    const locationLower = location.toLowerCase();

    if (
      locationLower.includes("kashmir") ||
      locationLower.includes("srinagar")
    ) {
      return {
        mapImage: "/kashmir-map.png",
        bgImage: "/bg-pic.png",
        locations: ["Srinagar", "Gulmarg", "Pahalgam"],
        description:
          "Experience the paradise on earth with breathtaking valleys, pristine lakes, and snow-capped mountains.",
      };
    } else if (
      locationLower.includes("kerala") ||
      locationLower.includes("kochi") ||
      locationLower.includes("munnar")
    ) {
      return {
        mapImage: "/kerala-map.png",
        bgImage: "/kerala-bg.png",
        locations: ["Kochi", "Munnar", "Alleppey"],
        description:
          "Discover God's Own Country with its enchanting backwaters, lush hills, and rich cultural heritage.",
      };
    } else if (locationLower.includes("goa")) {
      return {
        mapImage: "/goa-map.png",
        bgImage: "/goa-bg.png",
        locations: ["Panaji", "Calangute", "Anjuna"],
        description:
          "Enjoy the sun, sand, and surf in this tropical paradise with vibrant nightlife and Portuguese heritage.",
      };
    } else if (
      locationLower.includes("rajasthan") ||
      locationLower.includes("jaipur")
    ) {
      return {
        mapImage: "/rajasthan-map.png",
        bgImage: "/rajasthan-bg.png",
        locations: ["Jaipur", "Jodhpur", "Udaipur"],
        description:
          "Explore the land of kings with magnificent palaces, colorful culture, and desert adventures.",
      };
    } else if (
      locationLower.includes("thailand") ||
      locationLower.includes("bangkok")
    ) {
      return {
        mapImage: "/thailand-map.png",
        bgImage: "/thailand-bg.png",
        locations: ["Bangkok", "Phuket", "Chiang Mai"],
        description:
          "Experience exotic Thailand with its golden temples, pristine beaches, and delicious cuisine.",
      };
    }

    // Default fallback
    return {
      mapImage: "/kashmir-map.png",
      bgImage: "/bg-pic.png",
      locations: ["Destination 1", "Destination 2", "Destination 3"],
      description:
        "Discover amazing destinations with carefully curated experiences and unforgettable memories.",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center h-screen w-full ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location-based itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itineraryData && !csvItineraryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Itinerary not found</p>
        </div>
      </div>
    );
  }

  // Use CSV data if available, otherwise fall back to database data
  const displayData = useCSVData && csvItineraryData ? csvItineraryData : null;
  const fallbackData = itineraryData;

  // Get location-specific content
  const currentLocation =
    displayData?.locationMatched ||
    fallbackData?.location ||
    fallbackData?.enquiry?.locations ||
    "";

  // Generate dynamic addresses based on the current location
  const getDynamicAddresses = (location: string) => {
    const locationLower = location.toLowerCase();

    if (
      locationLower.includes("kashmir") ||
      locationLower.includes("srinagar")
    ) {
      return [
        "Srinagar, Jammu and Kashmir, India",
        "Gulmarg, Jammu and Kashmir, India",
        "Pahalgam, Jammu and Kashmir, India",
      ];
    } else if (
      locationLower.includes("kerala") ||
      locationLower.includes("kochi")
    ) {
      return [
        "Kochi, Kerala, India",
        "Munnar, Kerala, India",
        "Alleppey, Kerala, India",
      ];
    } else if (locationLower.includes("goa")) {
      return [
        "Panaji, Goa, India",
        "Calangute, Goa, India",
        "Anjuna, Goa, India",
      ];
    } else if (
      locationLower.includes("rajasthan") ||
      locationLower.includes("jaipur")
    ) {
      return [
        "Jaipur, Rajasthan, India",
        "Jodhpur, Rajasthan, India",
        "Udaipur, Rajasthan, India",
      ];
    } else if (
      locationLower.includes("thailand") ||
      locationLower.includes("bangkok")
    ) {
      return ["Bangkok, Thailand", "Phuket, Thailand", "Chiang Mai, Thailand"];
    }

    // Default fallback
    return ["New Delhi, India", "Mumbai, India", "Bangalore, India"];
  };

  const locationContent = getLocationSpecificContent(currentLocation);
  const dynamicAddresses = getDynamicAddresses(currentLocation);

  return (
    <div id="itineraries" className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Itinerary Details
              </h1>
              {displayData && (
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    CSV Data: {displayData.name}
                  </span>
                  <button
                    onClick={() => setUseCSVData(!useCSVData)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {useCSVData ? "Switch to DB Data" : "Switch to CSV Data"}
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 border font-semibold border-gray-300 rounded-full hover:bg-gray-100 text-green-500"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={handleEditPlan}
                className="flex items-center gap-2 px-4 py-2 bg-light-orange hover:bg-yellow-500 text-white font-semibold rounded-full"
              >
                <Edit className="h-4 w-4" />
                Edit plan
              </button>
              <button
                onClick={() => setShowReassignStaffDialog(true)}
                className="px-4 py-2 border border-green-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Reassign Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Enquiry Details Only */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-lg relative overflow-hidden">
              <Image
                src={locationContent.bgImage || "/placeholder.svg"}
                alt="Enquiry background"
                width={600}
                height={400}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
              <div className="p-6 relative z-10 pb-[327px]">
                <div className="flex items-center mb-4">
                  <span className="bg-gray-600/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="text-lg">🤖</span> Enquiry
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-white leading-relaxed">
                    {fallbackData?.enquiryDetails.description ||
                      locationContent.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="p-4">
                <h4 className="font-semibold mb-3 text-sm">Map</h4>
                <div className="relative">
                  <MapComponent
                    addresses={dynamicAddresses}
                    height="400px"
                    showRoute={true}
                    onLocationClick={(location) => {
                      console.log("Clicked location:", location);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3" id="itinerary-content">
            {/* Top Info Cards - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Location */}
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-xs text-gray-500 uppercase mb-1">
                  LOCATION
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {displayData?.name || fallbackData?.location || "N/A"}
                  </span>
                </div>
              </div>

              {/* Number of Days */}
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-xs text-gray-500 uppercase mb-1">
                  NUMBER OF DAY
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {displayData?.days || fallbackData?.numberOfDays || "N/A"}{" "}
                    Days / {displayData?.nights || "N/A"} Nights
                  </span>
                </div>
              </div>

              {/* Travel Style */}
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-xs text-gray-500 uppercase mb-1">
                  GUESTS
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {displayData
                      ? `${displayData.adults} Adults, ${displayData.kids} Kids`
                      : fallbackData?.travelStyle || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Budget and Accommodation Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Budget Estimation */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold">Budget Estimation</h3>
                    <span className="text-gray-400">ℹ️</span>
                  </div>
                  <div className="flex items-baseline text-3xl font-bold text-violet-600 mb-2">
                    <span>₹</span>
                    <span className="text-black ml-1">
                      {displayData?.costINR.toLocaleString() ||
                        fallbackData?.budgetEstimation.amount.toLocaleString() ||
                        "0"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    USD: ${" "}
                    {displayData?.costUSD ||
                      fallbackData?.budgetEstimation.amount ||
                      0}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Cost/Tourist: ${" "}
                    {fallbackData?.budgetEstimation.costTourist || 32.3}
                  </p>

                  {/* AI Assistant Section */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🤖</span>
                      </div>
                      <span className="font-medium text-sm">AI Assistant</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {displayData
                        ? "Powered by CSV template data"
                        : "Powered by intelligent budget estimation"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Accommodation */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold">Accommodation</h3>
                    <span className="text-gray-400">ℹ️</span>
                  </div>
                  <div className="space-y-3">
                    {fallbackData?.accommodation &&
                    fallbackData.accommodation.length > 0 ? (
                      fallbackData.accommodation.map((hotel, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Image
                            src={
                              hotel.image ||
                              "/placeholder.svg?height=60&width=80&query=hotel building"
                            }
                            alt={hotel.name}
                            width={48}
                            height={36}
                            className="w-12 h-9 rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{hotel.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(hotel.rating)].map((_, i) => (
                                <span
                                  key={i}
                                  className="text-yellow-400 text-xs"
                                >
                                  ⭐
                                </span>
                              ))}
                              <span className="text-xs text-gray-500">
                                {hotel.rating} star
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium">
                            {hotel.nights} nights
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">
                          Accommodation details will be provided based on your
                          preferences
                        </p>
                      </div>
                    )}
                  </div>
                  {fallbackData?.accommodation &&
                    fallbackData.accommodation.length > 0 && (
                      <button className="text-blue-600 text-sm mt-3 hover:underline">
                        See all
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Daily Itinerary */}
            <div className="bg-white rounded-lg shadow overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Daily Itinerary</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateOtherPlan}
                      className="text-green-600 bg-white hover:bg-white border-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Image
                        src="/Magic.png"
                        alt="Magic wand icon"
                        width={16}
                        height={16}
                        className="w-4 h-4 text-green-600"
                      />
                      Generate other plan
                    </Button>
                    <Button
                      onClick={handleShareToCustomer}
                      className="bg-gradient-to-r from-[#183F30] to-[#5BC17F] hover:from-[#183F30] hover:to-[#4CAF50] text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Share2 className="h-4 w-4" />
                      Share to customer
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(
                    displayData?.dailyItinerary ||
                    fallbackData?.dailyItinerary ||
                    []
                  ).map((day) => (
                    <div key={day.day} className="rounded-lg">
                      <div
                        className="p-4 bg-gray-100 cursor-pointer flex justify-between items-center hover:bg-gray-200"
                        onClick={() => toggleDayExpansion(day.day)}
                      >
                        <div>
                          <h4 className="font-semibold">DAY {day.day}</h4>
                          <p className="text-sm text-gray-600">
                            {day.date} - {day.title}
                          </p>
                        </div>
                        {expandedDays[day.day] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      {expandedDays[day.day] && (
                        <div className="p-4 space-y-4 bg-white">
                          {day.activities.map((activity, index) => (
                            <div key={index} className="flex gap-4 items-start">
                              <div className="text-sm font-medium text-gray-600 w-16 flex-shrink-0">
                                {activity.time}
                              </div>
                              <div className="flex-1 flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <span className="text-lg">
                                    {getActivityIcon(activity.type)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">
                                    {activity.title}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {activity.description}
                                  </p>
                                </div>
                                {activity.image && (
                                  <Image
                                    src={
                                      activity.image ||
                                      "/placeholder.svg?height=64&width=80&query=activity image"
                                    }
                                    alt={activity.title}
                                    width={80}
                                    height={64}
                                    className="w-20 h-16 rounded object-cover flex-shrink-0"
                                  />
                                )}
                              </div>
                              <button className="mb-3 text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 flex-shrink-0">
                                Details
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Staff Dialog */}
      <Dialog
        open={showReassignStaffDialog}
        onOpenChange={setShowReassignStaffDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="staff" className="text-right">
                Staff
              </label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff} value={staff}>
                      {staff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReassignStaffDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleReassignStaff}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ItineraryView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading itinerary...</p>
          </div>
        </div>
      }
    >
      <ItineraryViewContent />
    </Suspense>
  );
}
