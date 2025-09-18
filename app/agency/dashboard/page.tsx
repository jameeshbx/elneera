"use client";

import { useEffect, useState } from "react" 
import {
  CheckCircle,
  Loader,
  XCircle,
  Network,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  DollarSign,
  Check,
  X,
  Utensils,
  Bike,
  Wine,
  Heart,
  Bed,
  Car,
  Camera,
  Waves
} from "lucide-react"



const Dashboard = () => {

    // Add state for bookings
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    interface Booking {
  bookingId: string;
  enquiryId: string;
  poc: string;
  tourType: string;
  location: string;
  departureDate: string;
  pax: number;
  amount: string;
  paymentStatus: 'PMD' | 'PARTIAL' | 'REFUNDED' | string;
  revenueGenerated: string;
  amountDue: string;
  bookingStatus: string;
  bookingStatusColor: 'green' | 'red' | 'yellow' | string;
}



const [bookingsData, setBookingsData] = useState<Booking[]>([]);
    
    // Helper function to generate booking ID from enquiry ID
    const generateBookingId = (enquiryId: string): string => {
      const suffix = enquiryId.slice(-3);
      return `BK${suffix}`;
    };

    // Helper function to determine payment status based on enquiry status
    const getPaymentStatus = (status: string): string => {
      switch (status) {
        case "completed":
          return "PMD";
        case "cancelled":
          return "REFUNDED";
        case "payment_forex":
        case "trip_in_progress":
          return "PMD";
        case "booking_progress":
        case "booking_request":
          return "PARTIAL";
        default:
          return "UNPAID";
      }
    };

    // Helper function to determine booking status based on enquiry status
    const getBookingStatus = (status: string): { status: string; color: string } => {
      switch (status) {
        case "completed":
          return { status: "Completed", color: "green" };
        case "cancelled":
          return { status: "Cancelled", color: "red" };
        case "trip_in_progress":
        case "payment_forex":
          return { status: "Confirmed", color: "green" };
        case "booking_progress":
        case "booking_request":
          return { status: "In Progress", color: "yellow" };
        default:
          return { status: "Pending", color: "yellow" };
      }
    };

    // Helper function to generate financial data based on budget and status
    const generateFinancialData = (budget: number, status: string, currency: string = "USD") => {
      const baseBudget = budget || 5000;
      const currencySymbol = getCurrencySymbol(currency);
      
      switch (status) {
        case "completed":
        case "trip_in_progress":
          return {
            amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
            revenueGenerated: `${currencySymbol}${Math.floor(baseBudget * 0.2).toLocaleString()}`, // 20% revenue
            amountDue: `${currencySymbol}0`
          };
        case "cancelled":
          return {
            amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
            revenueGenerated: `${currencySymbol}0`,
            amountDue: `${currencySymbol}0`
          };
        case "payment_forex":
        case "booking_progress":
          return {
            amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
            revenueGenerated: `${currencySymbol}${Math.floor(baseBudget * 0.06).toLocaleString()}`, // 6% revenue
            amountDue: `${currencySymbol}${Math.floor(baseBudget * 0.36).toLocaleString()}` // 36% remaining
          };
        default:
          return {
            amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
            revenueGenerated: `${currencySymbol}${Math.floor(baseBudget * 0.06).toLocaleString()}`,
            amountDue: `${currencySymbol}${Math.floor(baseBudget * 0.36).toLocaleString()}`
          };
      }
    };

    // Helper function to get currency symbol
    const getCurrencySymbol = (code: string) => {
      switch (code) {
        case "USD":
          return "$";
        case "EUR":
          return "€";
        case "GBP":
          return "£";
        case "INR":
          return "₹";
        default:
          return "$";
      }
    };

    // Helper function to format departure date
    const formatDepartureDate = (estimatedDates: string) => {
      if (!estimatedDates) return "TBD";
      
      // Handle different date formats
      if (estimatedDates.includes(' - ')) {
        return estimatedDates.split(' - ')[0];
      }
      return estimatedDates;
    };

    // Fetch real enquiry data
    // Fetch real enquiry data
const fetchEnquiries = async () => {
  try {
    setIsLoadingBookings(true);
    const response = await fetch("/api/enquiries");
    
    if (!response.ok) {
      throw new Error("Failed to fetch enquiries");
    }
    
    const enquiries = await response.json();
    
    // Define interface for enquiry data
    interface Enquiry {
      id: string;
      status: string;
      budget?: number;
      currency?: string;
      name: string;
      tourType?: string;
      locations?: string;
      estimatedDates?: string;
      numberOfTravellers?: string;
    }

    // Transform enquiries into booking table format (limit to 10 most recent)
    const bookings = Array.isArray(enquiries) 
      ? enquiries.slice(0, 10).map((enquiry: Enquiry) => {
          const bookingId = generateBookingId(enquiry.id);
          const paymentStatus = getPaymentStatus(enquiry.status);
          const bookingStatus = getBookingStatus(enquiry.status);
          const financialData = generateFinancialData(
            enquiry.budget || 5000, 
            enquiry.status,
            enquiry.currency
          );
          
          return {
            bookingId,
            enquiryId: enquiry.id.slice(-5).toUpperCase(), // Show last 5 chars as enquiry ID
            poc: enquiry.name,
            tourType: enquiry.tourType || "Family",
            location: enquiry.locations || "TBD",
            departureDate: enquiry.estimatedDates ? formatDepartureDate(enquiry.estimatedDates) : "TBD",
            pax: enquiry.numberOfTravellers ? parseInt(enquiry.numberOfTravellers) : 1,
            amount: financialData.amount,
            paymentStatus: paymentStatus,
            revenueGenerated: financialData.revenueGenerated,
            amountDue: financialData.amountDue,
            bookingStatus: bookingStatus.status,
            bookingStatusColor: bookingStatus.color
          };
        })
      : [];
    
    setBookingsData(bookings);
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    setBookingsData([]); // Set empty array on error
  } finally {
    setIsLoadingBookings(false);
  }
};
  
    // Fetch data on component mount
    useEffect(() => {
      fetchEnquiries();
    }, []);


  return (
    <div className="h-screen bg-gray-100 overflow-hidden"> 
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="text-xs sm:text-sm text-gray-600">
            <span>Pages</span> <span className="text-gray-400">/</span>
            <span className="text-green-800 font-semibold">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Type here..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent w-full sm:w-auto"
            />
          </div>
          <Bell className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="h-[calc(100vh-73px)] bg-gray-100 px-4 py-4 overflow-y-auto overflow-x-hidden">
        {/* Container with max width to prevent horizontal scrolling */}
        <div className="max-w-[calc(100vw-32px)] mx-auto">

          {/* First Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Left Section - Signature Escapes */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Signature Escapes</h2>

                  <div className="flex justify-between items-center">
                    <div className="relative">
                      <select className="appearance-none bg-white border-2 border-blue-500 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Filter by destination</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    </div>

                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200">
                      See more
                    </button>
                  </div>
                </div>

                 
                    

                {/* Travel Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

                  {/* Card 1: Kaptai Serenity Escape */}
                  <div className="relative h-[340px] rounded-2xl overflow-hidden shadow-lg">
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/card1.png')"
                      }}
                    ></div>
                    
                    {/* Save icon */}
                    <div className="absolute top-4 right-4 z-10 p-2 rounded-md bg-emerald-600">
                      <Heart className="w-3 h-3 text-white fill-white" />
                    </div>

                    {/* Title + subtitle */}
                    <div className="absolute left-6 top-[46%] -translate-y-1/2 z-10">
                      <h3 className="text-white text-2xl font-semibold mb-1">Kaptai Serenity Escape</h3>
                      <p className="text-white text-base opacity-90">By Maple Trails DMC</p>
                    </div>

                    {/* Features row */}
                    <div className="absolute left-6 right-6 top-[62%] z-10 flex items-center justify-between">
                      {/* Left pill (green) */}
                      <div className="flex items-center bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
                        <div className="w-7 h-7 rounded-md bg-emerald-600/15 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Car className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Waves className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Bed className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>

                      {/* Right pill (grey) */}
                      <div className="flex items-center bg-white/75 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Wine className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom gradient + date/price */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between">
                      <div className="flex items-center text-white text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        23, Mar - 31, Mar (9D)
                      </div>
                      <div className="flex items-center text-white text-lg font-bold">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹51,120
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Bali Tropical Escape */}
                  <div className="relative h-[340px] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600">
                  {/* Background Image */}
                  <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/card2.png')"
                      }}
                    ></div>
                    
                    <div className="absolute top-4 right-4 z-10 p-2 rounded-md bg-emerald-600">
                      <Heart className="w-3 h-3 text-white fill-white" />
                    </div>

                    <div className="absolute left-6 top-[46%] -translate-y-1/2 z-10">
                      <h3 className="text-white text-2xl font-semibold mb-1">Bali Tropical Escape</h3>
                      <p className="text-white text-base opacity-90">By Island Adventures</p>
                    </div>

                    <div className="absolute left-6 right-6 top-[62%] z-10 flex items-center justify-between">
                      <div className="flex items-center bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
                        <div className="w-7 h-7 rounded-md bg-emerald-600/15 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Car className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Waves className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Bed className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>

                      <div className="flex items-center bg-white/75 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Wine className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between">
                      <div className="flex items-center text-white text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        15, Apr - 22, Apr (8D)
                      </div>
                      <div className="flex items-center text-white text-lg font-bold">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹63,890
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Switzerland Alpine Adventure */}
                  <div className="relative h-[340px] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600">
                    {/* Background Image */}
                  <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: "url('/card3.png')"
                      }}
                    ></div>
                    
                    <div className="absolute top-4 right-4 z-10 p-2 rounded-md bg-emerald-600">
                      <Heart className="w-3 h-3 text-white fill-white" />
                    </div>

                    <div className="absolute left-6 top-[46%] -translate-y-1/2 z-10">
                      <h3 className="text-white text-2xl font-semibold mb-1">Swiss Alpine Adventure</h3>
                      <p className="text-white text-base opacity-90">By Mountain Escapes</p>
                    </div>

                    <div className="absolute left-6 right-6 top-[62%] z-10 flex items-center justify-between">
                      <div className="flex items-center bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
                        <div className="w-7 h-7 rounded-md bg-emerald-600/15 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Car className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Waves className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="h-5 w-px bg-emerald-600/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-emerald-600/10 flex items-center justify-center">
                          <Bed className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>

                      <div className="flex items-center bg-white/75 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md">
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Wine className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="h-5 w-px bg-gray-500/50 mx-1.5"></span>
                        <div className="w-7 h-7 rounded-md bg-gray-600/10 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between">
                      <div className="flex items-center text-white text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        05, May - 14, May (10D)
                      </div>
                      <div className="flex items-center text-white text-lg font-bold">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹89,750
                      </div>
                    </div>
                  </div>

                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Section - Dashboard Metrics */}
            <div className="w-full lg:w-[300px] space-y-4">
              {/* Total Itineraries Card */}
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Itineraries</p>
                    <p className="text-xl font-bold text-gray-900">247</p>
                  </div>
                  <button className="bg-gray-700 text-white text-xs px-3 py-1 rounded-lg hover:bg-gray-800">View</button>
                </div>
                <p className="text-green-600 text-sm">+0.5%</p> 
              </div>

              {/* Total Leads Card */}
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total leads</p>
                    <p className="text-xl font-bold text-gray-900">47</p>
                  </div>
                  <button className="bg-gray-700 text-white text-xs px-3 py-1 rounded-lg hover:bg-gray-800">View</button>
                </div>
                <p className="text-green-600 text-sm">+0.5%</p>
              </div>

              {/* Generate Itineraries Button */}
              <div className="bg-gradient-to-b from-cyan-400 to-green-500 text-white rounded-lg p-4 cursor-pointer hover:from-cyan-500 hover:to-green-600 transition-all">
                <div className="flex flex-col items-center gap-3">
                  <Network className="w-8 h-8" />
                  <span className="text-sm font-semibold text-center leading-tight">Generate<br />Itineraries</span>
                </div>
              </div>

              {/* Bookings Section */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Bookings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Complete</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">In progress</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-700">Cancelled</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

                      
          {/* Second Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Total Revenue Chart */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Total Revenue</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span className="text-xs text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span className="text-xs text-gray-600">Expenses</span>
                  </div>
                </div>
              </div>

              <div className="text-xl font-bold text-gray-900 mb-3">$190,090.36</div>

              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-900 mb-2">Income & Expenses</h4>
                <div className="grid grid-cols-12 gap-1 text-[10px] text-gray-500 mb-1">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                    <span key={month} className="text-center">{month}</span>
                  ))}
                </div>

                {/* Chart Container */}
                <div className="h-[120px] bg-gray-50 rounded border border-gray-200 relative overflow-hidden">
                  {/* Chart Background Grid */}
                  <div className="absolute inset-0 flex flex-col">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="flex-1 border-b border-gray-200 last:border-b-0"></div>
                    ))}
                  </div>

                  {/* Chart Data Visualization */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120">
                    {/* Revenue Area (Green) */}
                    <path
                      d="M 0 100 L 25 90 L 50 85 L 75 80 L 100 70 L 125 60 L 150 50 L 175 45 L 200 40 L 225 35 L 250 30 L 275 25 L 300 20 L 300 120 L 0 120 Z"
                      fill="rgba(34, 197, 94, 0.3)"
                      stroke="rgb(34, 197, 94)"
                      strokeWidth="2"
                    />
                    {/* Expenses Area (Blue) */}
                    <path
                      d="M 0 110 L 25 105 L 50 100 L 75 95 L 100 85 L 125 80 L 150 75 L 175 70 L 200 65 L 225 60 L 250 55 L 275 50 L 300 45 L 300 120 L 0 120 Z"
                      fill="rgba(59, 130, 246, 0.3)"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div className="text-[10px] text-gray-500 mt-1 text-right">Time</div>
              </div>
            </div>


            {/* Booking Status Pie Chart */}
            <div className="w-full lg:w-[280px] bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Status Overview</h3>
              <p className="text-xs text-gray-600 mb-4">Pie chart representing the booking status distribution</p>

              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="20"
                    />
                    {/* Completed (Green) - 63% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray="157 251"
                      strokeDashoffset="0"
                    />
                    {/* In Progress (Blue) - 26% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray="65 251"
                      strokeDashoffset="-157"
                    />
                    {/* Cancelled (Red) - 11% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray="28 251"
                      strokeDashoffset="-222"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">Bookings</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">APR12598</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">In Progress</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">APR12399</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Cancelled</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">APR12344</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Pending</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">APR12344</span>
                </div>
              </div>
            </div>
          </div>


       {/* Recent Bookings Table */}
       <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <button className="text-blue-600 text-sm font-medium hover:underline">See more</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                <thead className="bg-gray-50">
                  <tr className="h-[50px]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">BOOKING ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">ENQUIRY ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">POC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">TOUR TYPE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">LOCATION</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">DEPARTURE DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">PAX</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">PAYMENT STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">REVENUE GENERATED</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">AMOUNT DUE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">BOOKING STATUS</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingBookings ? (
                    <tr className="h-[62px]">
                      <td colSpan={12} className="px-4 py-3 text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center">
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Loading bookings...
                        </div>
                      </td>
                    </tr>
                  ) : bookingsData.length === 0 ? (
                    <tr className="h-[62px]">
                      <td colSpan={12} className="px-4 py-3 text-center text-sm text-gray-500">
                        No recent bookings found
                      </td>
                    </tr>
                  ) : (
                    bookingsData.map((booking) => (
                      <tr key={booking.bookingId} className="h-[62px] hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.bookingId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.enquiryId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.poc}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.tourType}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.location}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.departureDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.pax}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.paymentStatus === 'PMD' ? 'bg-green-100 text-green-800' :
                            booking.paymentStatus === 'REFUNDED' ? 'bg-red-100 text-red-800' :
                            booking.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.revenueGenerated}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{booking.amountDue}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              booking.bookingStatusColor === 'green' ? 'bg-green-500' :
                              booking.bookingStatusColor === 'red' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></span>
                            <span className={`text-sm ${
                              booking.bookingStatusColor === 'green' ? 'text-green-600' :
                              booking.bookingStatusColor === 'red' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {booking.bookingStatus}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-[10px] text-gray-500 mt-3">
            © 2025, Made by <span className="text-emerald-500">Trekking Miles</span>.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard