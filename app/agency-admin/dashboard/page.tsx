"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Loader,
  XCircle,
  Search,
  Bell,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Booking {
  bookingId: string;
  enquiryId: string;
  poc: string;
  tourType: string;
  location: string;
  departureDate: string;
  pax: number;
  amount: string;
  paymentStatus: "PMD" | "PARTIAL" | "REFUNDED" | "UNPAID";
  revenueGenerated: string;
  amountDue: string;
  bookingStatus: string;
  bookingStatusColor: "green" | "red" | "yellow";
}

interface DashboardStats {
  totalItineraries: number;
  totalLeads: number;
  completedBookings: number;
  inProgressBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [bookingsData, setBookingsData] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalItineraries: 0,
    totalLeads: 0,
    completedBookings: 0,
    inProgressBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });

  const generateBookingId = (enquiryId: string, index: number): string => {
    return `BK${String(index + 1).padStart(5, "0")}`;
  };

  const getPaymentStatus = (status: string): "PMD" | "PARTIAL" | "REFUNDED" | "UNPAID" => {
    switch (status.toLowerCase()) {
      case "completed":
      case "trip_in_progress":
      case "payment_forex":
        return "PMD";
      case "cancelled":
        return "REFUNDED";
      case "booking_progress":
      case "booking_request":
        return "PARTIAL";
      default:
        return "UNPAID";
    }
  };

  const getBookingStatus = (status: string): { status: string; color: "green" | "red" | "yellow" } => {
    switch (status.toLowerCase()) {
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

  const generateFinancialData = (budget: number, status: string, currency: string = "USD") => {
    const baseBudget = budget || 5000;
    const currencySymbol = getCurrencySymbol(currency);

    switch (status.toLowerCase()) {
      case "completed":
      case "trip_in_progress":
        return {
          amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
          revenueGenerated: `${currencySymbol}${Math.floor(baseBudget * 0.2).toLocaleString()}`,
          amountDue: `${currencySymbol}0`,
        };
      case "cancelled":
        return {
          amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
          revenueGenerated: `${currencySymbol}0`,
          amountDue: `${currencySymbol}0`,
        };
      case "payment_forex":
      case "booking_progress":
        return {
          amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
          revenueGenerated: `${currencySymbol}${Math.floor(baseBudget * 0.06).toLocaleString()}`,
          amountDue: `${currencySymbol}${Math.floor(baseBudget * 0.36).toLocaleString()}`,
        };
      default:
        return {
          amount: `${currencySymbol}${baseBudget.toLocaleString()}`,
          revenueGenerated: `${currencySymbol}${Math.floor(baseBudget * 0.06).toLocaleString()}`,
          amountDue: `${currencySymbol}${Math.floor(baseBudget * 0.36).toLocaleString()}`,
        };
    }
  };

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

  const formatDepartureDate = (estimatedDates: string) => {
    if (!estimatedDates) return "TBD";
    if (estimatedDates.includes(" - ")) {
      return estimatedDates.split(" - ")[0];
    }
    return estimatedDates;
  };

  const fetchEnquiries = async () => {
    try {
      setIsLoadingBookings(true);
      const response = await fetch("/api/enquiries");

      if (!response.ok) {
        throw new Error("Failed to fetch enquiries");
      }

      const enquiries = await response.json();

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

      const bookings = Array.isArray(enquiries)
        ? enquiries.slice(0, 10).map((enquiry: Enquiry, index: number) => {
            const bookingId = generateBookingId(enquiry.id, index);
            const paymentStatus = getPaymentStatus(enquiry.status);
            const bookingStatus = getBookingStatus(enquiry.status);
            const financialData = generateFinancialData(
              enquiry.budget || 5000,
              enquiry.status,
              enquiry.currency
            );

            return {
              bookingId,
              enquiryId: enquiry.id.slice(-5).toUpperCase(),
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
              bookingStatusColor: bookingStatus.color,
            };
          })
        : [];

      setBookingsData(bookings);

      // Calculate stats from real data
      const completed = enquiries.filter((e: Enquiry) => e.status.toLowerCase() === "completed").length;
      const inProgress = enquiries.filter(
        (e: Enquiry) =>
          e.status.toLowerCase() === "booking_progress" ||
          e.status.toLowerCase() === "booking_request" ||
          e.status.toLowerCase() === "trip_in_progress"
      ).length;
      const cancelled = enquiries.filter((e: Enquiry) => e.status.toLowerCase() === "cancelled").length;

      const totalRevenue = enquiries.reduce((sum: number, e: Enquiry) => {
        if (e.status.toLowerCase() === "completed" || e.status.toLowerCase() === "trip_in_progress") {
          return sum + (e.budget || 5000) * 0.2;
        }
        return sum;
      }, 0);

      setStats({
        totalItineraries: enquiries.length,
        totalLeads: enquiries.length,
        completedBookings: completed,
        inProgressBookings: inProgress,
        cancelledBookings: cancelled,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      setBookingsData([]);
    } finally {
      setIsLoadingBookings(false);
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const completedPercentage =
    stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings > 0
      ? Math.round(
          (stats.completedBookings /
            (stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings)) *
            100
        )
      : 0;

  const inProgressPercentage =
    stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings > 0
      ? Math.round(
          (stats.inProgressBookings /
            (stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings)) *
            100
        )
      : 0;

  const cancelledPercentage =
    stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings > 0
      ? Math.round(
          (stats.cancelledBookings /
            (stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings)) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 gap-3 sm:gap-4 bg-white">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-600">
            <span>Pages</span> <span className="text-gray-400">/</span>
            <span className="text-green-800 font-semibold">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Type here..."
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent w-full sm:w-auto"
            />
          </div>
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </div>
      </div>

      <div className="bg-gray-100 px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Total Itineraries Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Itineraries</p>
                  {isLoadingStats ? (
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-400" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalItineraries}</p>
                  )}
                </div>
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </div>

            {/* Total Leads Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Leads</p>
                  {isLoadingStats ? (
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-400" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  )}
                </div>
                <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Revenue</p>
                  {isLoadingStats ? (
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-400" />
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      ${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-emerald-600 flex-shrink-0 ml-2" />
              </div>
            </div>

            {/* Bookings Overview Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">Bookings Overview</h3>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">Complete</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{stats.completedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">In Progress</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{stats.inProgressBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700">Cancelled</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{stats.cancelledBookings}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Status Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Booking Status Distribution</h3>
            <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-8">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 flex-shrink-0">
                {isLoadingStats ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray={`${completedPercentage * 2.51} 251`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray={`${inProgressPercentage * 2.51} 251`}
                        strokeDashoffset={`-${completedPercentage * 2.51}`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray={`${cancelledPercentage * 2.51} 251`}
                        strokeDashoffset={`-${(completedPercentage + inProgressPercentage) * 2.51}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                          {stats.completedBookings + stats.inProgressBookings + stats.cancelledBookings}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 w-full space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-700 truncate">Completed</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{stats.completedBookings}</span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">({completedPercentage}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-700 truncate">In Progress</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{stats.inProgressBookings}</span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">({inProgressPercentage}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-700 truncate">Cancelled</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{stats.cancelledBookings}</span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">({cancelledPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>

            <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      BOOKING ID
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      ENQUIRY ID
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      POC
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      TOUR TYPE
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      LOCATION
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      DEPARTURE
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      PAX
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      AMOUNT
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      PAYMENT
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      REVENUE
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      DUE
                    </th>
                    <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                      STATUS
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingBookings ? (
                    <tr>
                      <td colSpan={12} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center justify-center">
                          <Loader className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Loading bookings...
                        </div>
                      </td>
                    </tr>
                  ) : bookingsData.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">
                        No recent bookings found
                      </td>
                    </tr>
                  ) : (
                    bookingsData.map((booking) => (
                      <tr key={booking.bookingId} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.bookingId}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.enquiryId}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.poc}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.tourType}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.location}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.departureDate}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.pax}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.amount}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                              booking.paymentStatus === "PMD"
                                ? "bg-green-100 text-green-800"
                                : booking.paymentStatus === "REFUNDED"
                                ? "bg-red-100 text-red-800"
                                : booking.paymentStatus === "PARTIAL"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {booking.revenueGenerated}
                        </td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">{booking.amountDue}</td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 flex-shrink-0 ${
                                booking.bookingStatusColor === "green"
                                  ? "bg-green-500"
                                  : booking.bookingStatusColor === "red"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            ></span>
                            <span
                              className={`text-xs sm:text-sm ${
                                booking.bookingStatusColor === "green"
                                  ? "text-green-600"
                                  : booking.bookingStatusColor === "red"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
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
          <div className="text-xs text-gray-500 mt-4 sm:mt-6 text-center">
            © 2025, Made by <span className="text-emerald-600 font-medium">Trekking Miles</span>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;