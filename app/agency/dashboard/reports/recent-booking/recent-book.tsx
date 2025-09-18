"use client";

import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Search, ChevronDown, MoreHorizontal, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

const BookingManagementSystem = () => {
    const [activeTab,] = useState('bookings');
    const [searchTerm, setSearchTerm] = useState('');
    const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('booking_id');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showBookingStatusDropdown, setShowBookingStatusDropdown] = useState(false);
    const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Sample booking data
    const bookingsData = [
        {
            id: 'B001',
            enquiry_id: 'E0012',
            customer: 'John Smith',
            type: 'Family',
            destination: 'Paris, Rome',
            departure: '15-04-2025',
            pax: 4,
            amount: '$5000',
            payment_status: 'PAID',
            revenue: '$1000',
            due: '$0',
            booking_status: 'Confirmed',
            dmc: 'Lotus Path Tours'
        },
        {
            id: 'B002',
            enquiry_id: 'E0011',
            customer: 'Emily Johnson',
            type: 'Solo',
            destination: 'Tokyo',
            departure: '11-04-2025',
            pax: 1,
            amount: '$5000',
            payment_status: 'UNPAID',
            revenue: '$300',
            due: '$1800',
            booking_status: 'Pending',
            dmc: 'Himalayan Connect'
        },
        {
            id: 'B003',
            enquiry_id: 'E0010',
            customer: 'Rahul Verma',
            type: 'Partner',
            destination: 'Bali',
            departure: '03-05-2025',
            pax: 2,
            amount: '$5000',
            payment_status: 'REFUNDED',
            revenue: '$0',
            due: '$0',
            booking_status: 'Cancelled',
            dmc: 'South Escape Travel'
        },
        {
            id: 'B004',
            enquiry_id: 'E0012',
            customer: 'John Smith',
            type: 'Family',
            destination: 'Paris, Rome',
            departure: '15-04-2025',
            pax: 4,
            amount: '$5000',
            payment_status: 'PAID',
            revenue: '$1000',
            due: '$0',
            booking_status: 'Confirmed',
            dmc: 'Lotus Path Tours'
        },
        {
            id: 'B005',
            enquiry_id: 'E0011',
            customer: 'Emily Johnson',
            type: 'Solo',
            destination: 'Tokyo',
            departure: '11-04-2025',
            pax: 1,
            amount: '$5000',
            payment_status: 'UNPAID',
            revenue: '$300',
            due: '$1800',
            booking_status: 'Pending',
            dmc: 'Himalayan Connect'
        },
        {
            id: 'B006',
            enquiry_id: 'E0010',
            customer: 'Rahul Verma',
            type: 'Partner',
            destination: 'Bali',
            departure: '04-05-2025',
            pax: 2,
            amount: '$5000',
            payment_status: 'PARTIALLY PAID',
            revenue: '$0',
            due: '$0',
            booking_status: 'Cancelled',
            dmc: 'South Escape Travel'
        }
    ];

    // Revenue by destination data
    const revenueByDestination = [
        { destination: 'Kashmir', bookings: 18, revenue: '$45,200', dmc_cost: '$35,000', commission: '$10,200' },
        { destination: 'Kerala', bookings: 12, revenue: '$36,000', dmc_cost: '$27,500', commission: '$8,500' },
        { destination: 'Rajasthan', bookings: 10, revenue: '$25,800', dmc_cost: '$19,300', commission: '$6,500' },
        { destination: 'Himachal', bookings: 9, revenue: '$24,000', dmc_cost: '$18,000', commission: '$6,000' }
    ];

    // Revenue by DMC data
    const revenueByDMC = [
        { dmc: 'Lotus Path Tours', itineraries: 18, revenue: '$52,000', payment: '$41,000', commission: '$11,000' },
        { dmc: 'Himalayan Connect', itineraries: 14, revenue: '$38,600', payment: '$30,400', commission: '$8,200' },
        { dmc: 'South Escape Travel', itineraries: 11, revenue: '$31,900', payment: '$25,500', commission: '$6,400' }
    ];

    // Filter bookings
    const filteredBookings = useMemo(() => {
        return bookingsData.filter(booking => {
            const matchesSearch = booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesBookingStatus = bookingStatusFilter === 'all' ||
                booking.booking_status.toLowerCase() === bookingStatusFilter.toLowerCase();

            const matchesPaymentStatus = paymentStatusFilter === 'all' ||
                booking.payment_status.toLowerCase() === paymentStatusFilter.toLowerCase();

            return matchesSearch && matchesBookingStatus && matchesPaymentStatus;
        });
    }, [searchTerm, bookingStatusFilter, paymentStatusFilter]);

    // Sort bookings
    const sortedBookings = useMemo(() => {
        return [...filteredBookings].sort((a, b) => {
            switch (sortBy) {
                case 'customer':
                    return a.customer.localeCompare(b.customer);
                case 'departure':
                    return new Date(a.departure).getTime() - new Date(b.departure).getTime();
                case 'amount':
                    return parseFloat(a.amount.replace('$', '')) - parseFloat(b.amount.replace('$', ''));
                default:
                    return a.id.localeCompare(b.id);
            }
        });
    }, [filteredBookings, sortBy]);

    // Pagination
    const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
    const paginatedBookings = sortedBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string, type: string) => {
        if (type === 'booking') {
            switch (status.toLowerCase()) {
                case 'confirmed': return 'bg-green-500 text-green-800';
                case 'pending': return 'bg-orange-100 text-orange-800';
                case 'cancelled': return 'bg-red-100 text-red-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        } else {
            switch (status.toLowerCase()) {
                case 'paid': return 'bg-green-500 text-white';
                case 'unpaid': return 'bg-orange-500 text-white';
                case 'refunded': return 'bg-red-500 text-white';
                case 'partially paid': return 'bg-yellow-500 text-white';
                default: return 'bg-gray-500 text-white';
            }
        }
    };

    const formatDateRange = () => {
        if (!dateRange?.from) return 'Select date range';
        if (!dateRange.to) {
            return dateRange.from.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
            });
        }

        return `${dateRange.from.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        })} - ${dateRange.to.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        })}`;
    };



    return (
        <div className="min-h-screen bg-gray-50 p-0">
            <div>
                {/* Recent Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-lg shadow">
                        {/* Search and Filters */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center">
                                {/* Search */}
                                <div className="relative w-full md:flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search for..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Booking Status Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBookingStatusDropdown(!showBookingStatusDropdown)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-600 w-full sm:w-auto"
                                    >
                                        Booking Status
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    {showBookingStatusDropdown && (
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                            <div className="p-2">
                                                <div className="text-sm font-medium text-gray-700 mb-2">Filter Status</div>
                                                {['all', 'confirmed', 'pending', 'cancelled'].map((status) => (
                                                    <label key={status} className="flex items-center gap-2 py-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={bookingStatusFilter === status}
                                                            onChange={() => setBookingStatusFilter(status)}
                                                            className="w-4 h-4 text-green-800 bg-green-800"
                                                        />
                                                        <span className="text-sm capitalize">{status === 'all' ? 'All' : status}</span>
                                                    </label>
                                                ))}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => setShowBookingStatusDropdown(false)}
                                                        className="px-3 py-1 bg-green-800 text-white text-sm rounded"
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setBookingStatusFilter('all');
                                                            setShowBookingStatusDropdown(false);
                                                        }}
                                                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Status Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowPaymentStatusDropdown(!showPaymentStatusDropdown)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-800 w-full sm:w-auto"
                                    >
                                        Payment Status
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    {showPaymentStatusDropdown && (
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                            <div className="p-2">
                                                <div className="text-sm font-medium text-gray-700 mb-2">Filter Status</div>
                                                {['all', 'paid', 'unpaid', 'refunded', 'partially paid'].map((status) => (
                                                    <label key={status} className="flex items-center gap-2 py-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={paymentStatusFilter === status}
                                                            onChange={() => setPaymentStatusFilter(status)}
                                                            className="w-4 h-4 text-green-800"
                                                        />
                                                        <span className="text-sm capitalize">{status === 'all' ? 'All' : status}</span>
                                                    </label>
                                                ))}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => setShowPaymentStatusDropdown(false)}
                                                        className="px-3 py-1 bg-green-800 text-white text-sm rounded"
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPaymentStatusFilter('all');
                                                            setShowPaymentStatusDropdown(false);
                                                        }}
                                                        className="px-3 py-1 bg-gray-800 text-white text-sm rounded"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Date Range */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-auto"
                                    >
                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm whitespace-nowrap">{formatDateRange()}</span>
                                    </button>
                                    {showCalendar && (
                                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                            <Calendar
                                                mode="range"
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                                className="p-2"
                                            />
                                            <div className="flex justify-end p-2 border-t">
                                                <button
                                                    onClick={() => setShowCalendar(false)}
                                                    className="px-3 py-1 bg-green-800 text-white rounded text-sm"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>


                                {/* Sort */}
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto md:ml-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 whitespace-nowrap">Sort by</span>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-800 w-full sm:w-auto"
                                        >
                                            <option value="booking_id">Booking ID</option>
                                            <option value="customer">Customer</option>
                                            <option value="departure">Departure Date</option>
                                            <option value="amount">Amount</option>
                                        </select>
                                    </div>

                                    {/* Download */}
                                    <button className="p-2 text-gray-400 hover:text-gray-600 ml-auto sm:ml-0">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-[1000px] md:min-w-0">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input type="checkbox" className="w-4 h-4 text-green-800" />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquiry ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAX</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DMC details</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedBookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <input type="checkbox" className="w-4 h-4 text-green-800" />
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.enquiry_id}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.customer}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.type}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.destination}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.departure}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.pax}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.amount}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.payment_status, 'payment')}`}>
                                                        {booking.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.revenue}</td>
                                                <td className="px-4 py-4 text-sm text-gray-900">{booking.due}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.booking_status, 'booking')}`}>
                                                        <span className="w-2 h-2 rounded-full bg-current mr-1"></span>
                                                        {booking.booking_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button className="bg-green-800 hover:bg-green-800 text-white px-3 py-1 rounded text-sm">
                                                        View
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>


                            {/* Pagination */}
                            <div className="px-4 py-3 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            «
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            ‹
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-1 rounded ${currentPage === pageNum
                                                            ? 'bg-green-800 text-white'
                                                            : 'text-gray-600 hover:text-gray-800'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        {totalPages > 5 && currentPage < totalPages - 2 && (
                                            <span className="px-1">...</span>
                                        )}

                                        {totalPages > 5 && currentPage < totalPages - 2 && (
                                            <button
                                                onClick={() => setCurrentPage(totalPages)}
                                                className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                            >
                                                {totalPages}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            ›
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            »
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600 order-2 sm:order-1">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}-
                                        {Math.min(currentPage * itemsPerPage, sortedBookings.length)} of {sortedBookings.length} bookings
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {/* Revenue by Destination Tab */}
                {activeTab === 'destination' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <h3 className="text-lg font-medium text-gray-900">Revenue by Destination</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search for..."
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-800">Sort by</span>
                                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-800">
                                            <option>Revenue</option>
                                            <option>Destination</option>
                                            <option>Bookings</option>
                                        </select>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input type="checkbox" className="w-4 h-4 text-green-800" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total revenue</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total DMC Cost</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency Commission (Profit)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {revenueByDestination.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <input type="checkbox" className="w-4 h-4 text-green-800" />
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.destination}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.bookings}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.revenue}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.dmc_cost}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.commission}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600">«</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">‹</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">1</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">...</button>
                                    <button className="px-3 py-1 bg-green-500 text-white rounded">5</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">6</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">...</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">10</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">›</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">»</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue by DMC Tab */}
                {activeTab === 'dmc' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Revenue by DMC</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search for..."
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Sort by</span>
                                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-800">
                                            <option>Revenue</option>
                                            <option>DMC Name</option>
                                            <option>Itineraries</option>
                                        </select>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input type="checkbox" className="w-4 h-4 text-green-600" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DMC Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of itineraries</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total revenue</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment to DMC</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {revenueByDMC.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <input type="checkbox" className="w-4 h-4 text-green-600" />
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.dmc}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.itineraries}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.revenue}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.payment}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{item.commission}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600">«</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">‹</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">1</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">...</button>
                                    <button className="px-3 py-1 bg-green-500 text-white rounded">5</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">6</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">...</button>
                                    <button className="px-3 py-1 text-gray-600 hover:text-gray-800">10</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">›</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">»</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingManagementSystem;