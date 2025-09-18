"use client";

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  ChevronDown,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CalendarIcon,
  Eye,
  Edit,
  Trash2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchSubscriptions,
  downloadSubscriptions,
} from "./subscription-service";
import type { SubscriptionData } from "@/actions/manage-subscription";
import { toast } from "@/components/ui/use-toast";

interface SubscriptionTableProps {
  subscriptions: SubscriptionData[];
}

export function SubscriptionTable({ subscriptions: initialSubscriptions }: SubscriptionTableProps) {
  const router = useRouter()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [, setSubscriptions] = useState<SubscriptionData[]>(initialSubscriptions)
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionData[]>(initialSubscriptions)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialSubscriptions.length / itemsPerPage))
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<Record<string, boolean>>({
    Paid: true,
    Pending: true,
    Failed: true,
    "Not Required": true,
  });
  const [showPaymentStatusFilter, setShowPaymentStatusFilter] = useState(false);
  const [showPlanFilter, setShowPlanFilter] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, boolean>>({
    Business: true,
    Basic: true,
    "Business (Free Trial)": true,
  });
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date("2025-03-28"),
    to: new Date("2025-04-10"),
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [expandedPhoneNumber, setExpandedPhoneNumber] = useState<string | null>(
    null
  );

  // Calculate current items for display
  const currentItems = filteredSubscriptions.slice(0, itemsPerPage);

  // Fetch subscriptions with filters
  const fetchFilteredSubscriptions = useCallback(async () => {
    try {
      setLoading(true);

      // Convert selected payment statuses to array
      const paymentStatusArray = Object.entries(selectedPaymentStatuses)
        .filter(([, selected]) => selected)
        .map(([status]) => status)

      // Convert selected plans to array
      const plansArray = Object.entries(selectedPlans)
        .filter(([, selected]) => selected)
        .map(([plan]) => plan)

      const result = await fetchSubscriptions({
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortDirection,
        paymentStatus: paymentStatusArray,
        plans: plansArray,
        fromDate: dateRange.from || null,
        toDate: dateRange.to || null,
      });

      setSubscriptions(result.subscriptions);
      setFilteredSubscriptions(result.subscriptions);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching filtered subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    dateRange.from,
    dateRange.to,
    itemsPerPage,
    searchTerm,
    selectedPaymentStatuses,
    selectedPlans,
    sortBy,
    sortDirection,
  ])

  // Apply filters when filter parameters change
  useEffect(() => {
    fetchFilteredSubscriptions();
  }, [
    currentPage,
    searchTerm,
    sortBy,
    sortDirection,
    fetchFilteredSubscriptions
    // We don't include the following as they are applied via buttons:
    // selectedPaymentStatuses, selectedPlans, dateRange
  ]);

  // Handle pagination
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(
        2,
        currentPage - Math.floor((maxVisiblePages - 2) / 2)
      );
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);

      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
      }

      if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - (maxVisiblePages - 1));
      }

      if (startPage > 2) {
        pages.push("ellipsis-start");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("ellipsis-end");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const newSelectedItems: Record<string, boolean> = {};
    currentItems.forEach((item) => {
      newSelectedItems[item.id] = checked;
    });
    setSelectedItems(newSelectedItems);
  };

  // Handle individual item selection
  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: checked,
    }));
    const allSelected = currentItems.every(
      (item) => selectedItems[item.id] === true || (item.id === id && checked)
    );
    setSelectAll(allSelected);
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchFilteredSubscriptions();
    setShowPaymentStatusFilter(false);
    setShowPlanFilter(false);
  };

  // Reset filters
  const resetPaymentStatusFilters = () => {
    setSelectedPaymentStatuses({
      Paid: true,
      Pending: true,
      Failed: true,
      "Not Required": true,
    });
  };

  const resetPlanFilters = () => {
    setSelectedPlans({
      Business: true,
      Basic: true,
      "Business (Free Trial)": true,
    });
  };

  // Format date range for display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      try {
        return `${format(dateRange.from, "dd MMM")} - ${format(
          dateRange.to,
          "dd MMM"
        )}`;
      } catch {
        return "Select dates";
      }
    }
    return "Select dates";
  };

  // Apply date range filter
  const applyDateRange = () => {
    setCalendarOpen(false);
    fetchFilteredSubscriptions();
  };

  // Reset date range
  const resetDateRange = () => {
    setDateRange({
      from: new Date("2025-03-28"),
      to: new Date("2025-04-10"),
    });
  };

  // Navigate to detail page
  const navigateToDetail = (id: string) => {
    router.push(`/admin/dashboard/subscription/${id}`);
  };

  // Toggle phone number expansion
  const togglePhoneNumber = (phoneNumber: string) => {
    if (expandedPhoneNumber === phoneNumber) {
      setExpandedPhoneNumber(null);
    } else {
      setExpandedPhoneNumber(phoneNumber);
    }
  };

  // Handle download
  const handleDownload = async (format: "csv" | "excel" | "pdf") => {
    try {
      await downloadSubscriptions(format);
      toast({
        title: "Success",
        description: `Downloaded subscriptions as ${format.toUpperCase()}`,
      });
      setShowDownloadOptions(false);
    } catch (error) {
      console.error(`Error downloading as ${format}:`, error);
      toast({
        title: "Error",
        description: `Failed to download as ${format}`,
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (subscriptionId: string) => {
    try {
      // Call the API to delete the subscription
      const response = await fetch(`/api/auth/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }

      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
      fetchFilteredSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters - Fixed */}
      <div className="bg-white z-30 border-b border-gray-200">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Search for..."
                className="pl-8 w-full h-10 border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Payment Status Filter */}
            <div className="relative inline-block w-full sm:w-auto">
              <Button
                variant="outline"
                className="bg-greenlight text-white hover:bg-green-700 border-0 h-10 flex sm:w-auto items-center gap-1 w-full justify-between"
                onClick={() =>
                  setShowPaymentStatusFilter(!showPaymentStatusFilter)
                }
              >
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 font-Nunito" />
                  <span>Payment Status</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showPaymentStatusFilter && (
                <div className="absolute z-50 mt-1 w-full sm:w-[200px] bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-sm text-gray-500">Filter Status</div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="paid"
                        checked={selectedPaymentStatuses.Paid}
                        onCheckedChange={(checked) =>
                          setSelectedPaymentStatuses((prev) => ({
                            ...prev,
                            Paid: checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="paid" className="text-sm">
                        Paid
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="pending"
                        checked={selectedPaymentStatuses.Pending}
                        onCheckedChange={(checked) =>
                          setSelectedPaymentStatuses((prev) => ({
                            ...prev,
                            Pending: checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="pending" className="text-sm">
                        Pending
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="failed"
                        checked={selectedPaymentStatuses.Failed}
                        onCheckedChange={(checked) =>
                          setSelectedPaymentStatuses((prev) => ({
                            ...prev,
                            Failed: checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="failed" className="text-sm">
                        Failed
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="not-required"
                        checked={selectedPaymentStatuses["Not Required"]}
                        onCheckedChange={(checked) =>
                          setSelectedPaymentStatuses((prev) => ({
                            ...prev,
                            "Not Required": checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="not-required" className="text-sm">
                        Not Required
                      </label>
                    </div>
                  </div>
                  <div className="p-2 border-t border-gray-200 flex justify-between">
                    <Button
                      variant="default"
                      className="bg-gradient-to-b from-custom-green to-light-green hover:bg-gradient-to-b from-light-green to-custom-green text-xs h-8"
                      onClick={applyFilters}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={resetPaymentStatusFilters}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Plan Filter */}
            <div className="relative inline-block w-full sm:w-auto">
              <Button
                variant="outline"
                className="border-gray-300 h-10 flex sm:w-auto items-center gap-1 w-full justify-between"
                onClick={() => setShowPlanFilter(!showPlanFilter)}
              >
                <span>Plan</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showPlanFilter && (
                <div className="absolute z-50 mt-1 w-full sm:w-52 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-sm text-gray-500">Filter Plan</div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="business"
                        checked={selectedPlans.Business}
                        onCheckedChange={(checked) =>
                          setSelectedPlans((prev) => ({
                            ...prev,
                            Business: checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="business" className="text-sm">
                        Business
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="basic"
                        checked={selectedPlans.Basic}
                        onCheckedChange={(checked) =>
                          setSelectedPlans((prev) => ({
                            ...prev,
                            Basic: checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="basic" className="text-sm">
                        Basic
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="business-trial"
                        checked={selectedPlans["Business (Free Trial)"]}
                        onCheckedChange={(checked) =>
                          setSelectedPlans((prev) => ({
                            ...prev,
                            "Business (Free Trial)": checked as boolean,
                          }))
                        }
                      />
                      <label htmlFor="business-trial" className="text-sm">
                        Business (Free Trial)
                      </label>
                    </div>
                  </div>
                  <div className="p-2 border-t border-gray-200 flex justify-between">
                    <Button
                      variant="default"
                      className="bg-gradient-to-b from-custom-green to-light-green hover:bg-gradient-to-b from-light-green to-custom-green text-xs h-8"
                      onClick={applyFilters}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={resetPlanFilters}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 flex items-center gap-1 border-gray-300 w-full sm:w-auto justify-between sm:justify-start"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">{formatDateRange()}</span>
                  <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-gray-200 shadow-lg z-50"
                align="start"
              >
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-medium">Select Date Range</h3>
                </div>
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to || range.from,
                      });
                    }
                  }}
                  numberOfMonths={1}
                  className="p-3"
                />
                <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
                  <Button variant="outline" size="sm" onClick={resetDateRange}>
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={applyDateRange}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort and Download */}
            <div className="flex sm:ml-auto gap-2 justify-center sm:justify-start">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex items-center gap-1 border-gray-300 w-30 sm:w-auto"
                  >
                    <span className="text-sm">Sort by</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-50">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Sort Options</p>
                  </div>
                  {[
                    { id: "createdAt", label: "Date" },
                    { id: "agency.name", label: "Agency Name" },
                  ].map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => handleSortChange(option.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{option.label}</span>
                      {sortBy === option.id && (
                        <span className="text-green-600 font-bold">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog
                open={showDownloadOptions}
                onOpenChange={setShowDownloadOptions}
              >
                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 flex items-center justify-center"
                  aria-label="Download"
                  onClick={() => setShowDownloadOptions(true)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <DialogContent className="sm:max-w-md z-50">
                  <DialogHeader>
                    <DialogTitle>Download Options</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleDownload("csv")}
                    >
                      Download as CSV
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleDownload("excel")}
                    >
                      Download as Excel
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleDownload("pdf")}
                    >
                      Download as PDF
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Table Container - Scrollable */}
      {!loading && (
        <div
          ref={tableContainerRef}
          className="w-full rounded-lg border border-gray-200 overflow-auto flex-1"
          style={{ maxHeight: "calc(100% - 130px)" }}
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block min-w-[1200px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-20">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    className="p-3 text-left sticky left-0 bg-gray-50 z-20"
                    style={{ width: "40px" }}
                  >
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th
                    className="p-3 text-left sticky left-[40px] bg-gray-50 z-20 font-medium text-sm font-Poppins"
                    style={{ width: "120px" }}
                  >
                    Subscription ID
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "150px" }}
                  >
                    Agency/DMC
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "150px" }}
                  >
                    Contact Name
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm hidden md:table-cell font-Poppins"
                    style={{ width: "120px" }}
                  >
                    Phone no.
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "180px" }}
                  >
                    Email
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "120px" }}
                  >
                    Plan
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "150px" }}
                  >
                    Payment Status
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "180px" }}
                  >
                    Subscription status
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "120px" }}
                  >
                    Trial Status
                  </th>
                  <th
                    className="p-3 text-left font-medium text-sm font-Poppins"
                    style={{ width: "120px" }}
                  >
                    Trial Start date
                  </th>
                  <th className="p-3 text-left" style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="border-b border-gray-200 hover:bg-gray-50 font-Poppins"
                  >
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <Checkbox
                        checked={selectedItems[subscription.id] || false}
                        onCheckedChange={(checked) =>
                          handleSelectItem(subscription.id, checked as boolean)
                        }
                      />
                    </td>
                    <td className="p-3 text-sm font-Poppins sticky left-[40px] bg-white z-10">
                      {subscription.id}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="truncate" title={subscription.agencyName}>
                        {subscription.agencyName}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-Poppins">
                      <div className="truncate" title={subscription.name}>
                        {subscription.name}
                      </div>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell font-Poppins">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="truncate cursor-pointer hover:text-blue-600"
                              onClick={() =>
                                togglePhoneNumber(subscription.phoneNumber)
                              }
                            >
                              {expandedPhoneNumber === subscription.phoneNumber
                                ? subscription.phoneNumber
                                : subscription.phoneNumber.length > 10
                                ? `${subscription.phoneNumber.substring(
                                    0,
                                    10
                                  )}...`
                                : subscription.phoneNumber}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{subscription.phoneNumber}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-sm">
                      <div
                        className="truncate font-Poppins"
                        title={subscription.email}
                      >
                        {subscription.email}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-Poppins">
                      <div className="truncate" title={subscription.plan}>
                        {subscription.plan}
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <span
                        className={`${getPaymentStatusColor(
                          subscription.paymentStatus
                        )} px-3 py-1 rounded-md text-xs`}
                      >
                        {subscription.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Circle
                          className={`h-2 w-2 ${
                            subscription.subscriptionStatus === "Active"
                              ? "text-green-500"
                              : subscription.subscriptionStatus === "Inactive"
                              ? "text-red-500"
                              : "text-blue-500"
                          }`}
                          fill="currentColor"
                        />
                        <span
                          className={`text-sm px-2 py-1 rounded-md ${getSubscriptionStatusColor(
                            subscription.subscriptionStatus
                          )}`}
                        >
                          {subscription.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{subscription.trialStatus}</td>
                    <td className="p-3 text-sm">
                      {subscription.trialStartDate || "-"}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50">
                          <DropdownMenuItem
                            onClick={() => navigateToDetail(subscription.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(subscription.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          {subscription.dateCaptured && (
                            <DropdownMenuItem className="cursor-default">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              <span>
                                Data captured on: {subscription.dateCaptured}
                              </span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tablet and Mobile views remain the same as your original code */}
          {/* ... */}
        </div>
      )}

      {/* Pagination - Fixed at bottom */}
      <div className="bg-white z-30 border-t border-gray-200 pt-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((page, index) =>
              typeof page === "string" ? (
                <Button
                  key={`ellipsis-${index}`}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 hidden sm:flex"
                  disabled
                >
                  ...
                </Button>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${
                    currentPage === page
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }`}
                  onClick={() => paginate(page)}
                  aria-label={
                    currentPage === page ? "Current page" : `Go to page ${page}`
                  }
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get the color for payment status
function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-custom-green text-white";
    case "Pending":
      return "bg-yellow-500 text-white";
    case "Failed":
      return "bg-red-500 text-white";
    case "Not Required":
      return "bg-white text-gray-700";
    default:
      return "bg-gray-500 text-white";
  }
}

// Helper function to get the background color for subscription status
function getSubscriptionStatusColor(status: string): string {
  switch (status) {
    case "Active":
      return "bg-custom-green text-white";
    case "Inactive":
      return "bg-gray-300 text-black";
    case "Trial Active":
      return "bg-custom-green text-white";
    default:
      return "";
  }
}
