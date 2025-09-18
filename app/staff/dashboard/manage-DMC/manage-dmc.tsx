"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

// import { dmcRequests, getStatusColor, type DMCRequest } from "@/data/dmc"

// Define the DMCRequest type based on your Prisma schema
type DMCRequest = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dmcName: string;
  status: "ACTIVE" | "DEACTIVE";
  requestStatus: "Approved" | "Pending" | "Rejected";
  requestDate: string;
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "DEACTIVE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Dmcsignup() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filteredRequests, setFilteredRequests] = useState<DMCRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses] = useState<Record<string, boolean>>({
    Active: true,
    Inactive: true,
  });
  const [selectedRequestStatuses, setSelectedRequestStatuses] = useState<
    Record<string, boolean>
  >({
    Approved: true,
    Pending: true,
    Rejected: true,
  });
  const [showRequestStatusFilter, setShowRequestStatusFilter] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [totalCount, setTotalCount] = useState(0);
  const [, setIsLoading] = useState(false);
  const [, setIsUpdating] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch DMC requests from API
  const fetchDmcRequests = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());
      if (searchTerm) params.append("search", searchTerm);

      // Convert status filters to match Prisma enum
      const statusFilters = Object.entries(selectedStatuses)
        .filter(([, selected]) => selected)
        .map(([status]) => (status === "Active" ? "ACTIVE" : "DEACTIVE"));

      if (statusFilters.length > 0)
        params.append("status", statusFilters.join(","));

      const requestStatusFilters = Object.entries(selectedRequestStatuses)
        .filter(([, selected]) => selected)
        .map(([status]) => status);

      if (requestStatusFilters.length > 0)
        params.append("requestStatus", requestStatusFilters.join(","));

      if (dateRange.from)
        params.append("dateFrom", dateRange.from.toISOString());
      if (dateRange.to) params.append("dateTo", dateRange.to.toISOString());

      params.append("sortBy", sortBy === "date" ? "createdAt" : "status");
      params.append("sortOrder", sortDirection);

      const response = await fetch(`/api/auth/manage-DMC?${params.toString()}`, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Failed to fetch DMC requests");

      const data = await response.json();
      setFilteredRequests(data.data);
      setTotalCount(data.pagination.total);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching DMC requests:", error);
          setError(error.message);
        }
      } else {
        console.error("Unknown error:", error);
        setError("An unknown error occurred");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedStatuses, selectedRequestStatuses, dateRange, sortBy, sortDirection, setIsLoading, setError]);

  // Update DMC status
  const updateDmcStatus = async (id: string, status?: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch("/api/auth/manage-DMC", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id,
          status: status === "Active" ? "ACTIVE" : "DEACTIVE",
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      await fetchDmcRequests();
    } catch (err) {
      console.error("Error updating DMC status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchDmcRequests();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [
    currentPage,
    searchTerm,
    JSON.stringify(selectedStatuses),
    JSON.stringify(selectedRequestStatuses),
    dateRange.from,
    dateRange.to,
    sortBy,
    sortDirection
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
    const maxVisiblePages =
      typeof window !== "undefined" && window.innerWidth < 640
        ? 2
        : typeof window !== "undefined" && window.innerWidth < 768
          ? 3
          : 5;

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

  // Format date range for display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      try {
        return typeof window !== "undefined" && window.innerWidth < 640
          ? `${format(dateRange.from, "dd/MM")}-${format(
            dateRange.to,
            "dd/MM"
          )}`
          : `${format(dateRange.from, "dd MMM yy")} - ${format(
            dateRange.to,
            "dd MMM yy"
          )}`;
      } catch {
        return "Select dates";
      }
    }
    return "Select dates";
  };

  // Navigate to detail page
  const navigateToDetail = (id: string) => {
    router.push(`/request-dashboard/${id}`);
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 bg-white rounded-lg border border-gray-200">
      {/* Search and Filters */}
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

          <div className="relative inline-block w-full sm:w-auto">
            <Button
              variant="outline"
              className="bg-green-600 text-white hover:bg-green-700 border-0 h-10 flex sm:w-auto items-center gap-1 w-full justify-between"
              onClick={() =>
                setShowRequestStatusFilter(!showRequestStatusFilter)
              }
            >
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Request Status</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showRequestStatusFilter && (
              <div className="absolute z-10 mt-1 w-full sm:w-[200px] bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="p-2 border-b border-gray-200">
                  <div className="text-sm text-gray-500">Filter Status</div>
                </div>
                <div className="p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="approved"
                      checked={selectedRequestStatuses.Approved}
                      onChange={(e) =>
                        setSelectedRequestStatuses((prev) => ({
                          ...prev,
                          Approved: (e.target as HTMLInputElement).checked,
                        }))
                      }
                    />
                    <label htmlFor="approved" className="text-sm">
                      Approved
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="pending"
                      checked={selectedRequestStatuses.Pending}
                      onChange={(e) =>
                        setSelectedRequestStatuses((prev) => ({
                          ...prev,
                          Pending: (e.target as HTMLInputElement).checked,
                        }))
                      }
                    />
                    <label htmlFor="pending" className="text-sm">
                      Pending
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rejected"
                      checked={selectedRequestStatuses.Rejected}
                      onChange={(e) =>
                        setSelectedRequestStatuses((prev) => ({
                          ...prev,
                          Rejected: (e.target as HTMLInputElement).checked,
                        }))
                      }
                    />
                    <label htmlFor="rejected" className="text-sm">
                      Rejected
                    </label>
                  </div>
                </div>
                <div className="p-2 border-t border-gray-200 flex justify-between">
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-xs h-8"
                    onClick={() => setShowRequestStatusFilter(false)}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs h-8"
                    onClick={() => {
                      setSelectedRequestStatuses({
                        Approved: true,
                        Pending: true,
                        Rejected: true,
                      });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 flex items-center gap-1 border-gray-300 w-full sm:w-auto justify-between sm:justify-start"
              >
                <CalendarIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm">{formatDateRange()}</span>
                <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-gray-200 shadow-lg"
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
                    if (range.to) {
                      setCalendarOpen(false);
                    }
                  }
                }}
                numberOfMonths={1}
                className="p-3"
              />
              <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({
                      from: new Date("2025-03-28"),
                      to: new Date("2025-04-10"),
                    });
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setCalendarOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

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
              <DropdownMenuContent align="end" className="w-48">
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Sort Options</p>
                </div>
                {[
                  { id: "date", label: "Date" },
                  { id: "status", label: "Status" },
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

            <Button
              variant="outline"
              className="h-10 w-10 p-0 flex items-center justify-center"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table/Card View (Responsive) */}
      <div className="w-full overflow-auto rounded-lg border border-gray-200">
        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-left w-10">
                  <Checkbox
                    checked={selectAll}
                    onChange={(e) =>
                      handleSelectAll((e.target as HTMLInputElement).checked)
                    }
                  />
                </th>
                <th className="p-3 text-left font-medium text-sm">
                  Request ID
                </th>
                <th className="p-3 text-left font-medium text-sm">Name</th>
                <th className="p-3 text-left font-medium text-sm">
                  Phone no.
                </th>
                <th className="p-3 text-left font-medium text-sm">
                  Email
                </th>
                <th className="p-3 text-left font-medium text-sm">DMC Name</th>
                <th className="p-3 text-left font-medium text-sm">Status</th>
                <th className="p-3 text-left font-medium text-sm">
                  Request Status
                </th>
                <th className="p-3 text-left w-10"></th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selectedItems[request.id] || false}
                      onChange={(e) =>
                        handleSelectItem(
                          request.id,
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                  </td>
                  <td className="p-3 text-sm">{request.id}</td>
                  <td className="p-3 text-sm">{request.name}</td>
                  <td className="p-3 text-sm">
                    {request.phoneNumber}
                  </td>
                  <td className="p-3 text-sm">
                    {request.email}
                  </td>
                  <td className="p-3 text-sm">{request.dmcName}</td>
                  <td className="p-3 text-sm">
                    <span
                      className={`${getStatusColor(
                        request.status
                      )} px-3 py-1 rounded-md text-xs`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Circle
                        className={`h-2 w-2 ${request.requestStatus === "Approved"
                            ? "text-green-500"
                            : request.requestStatus === "Pending"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        fill="currentColor"
                      />
                      <span className="text-sm">{request.requestStatus}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigateToDetail(request.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        {request.requestDate && (
                          <DropdownMenuItem className="cursor-default">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>
                              Request Date:{" "}
                              {new Date(
                                request.requestDate
                              ).toLocaleDateString()}
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
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden">
          {currentItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No records found
            </div>
          ) : (
            <div className="min-w-full">
              <table className="w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-2 text-left w-10">
                      <Checkbox
                        checked={selectAll}
                        onChange={(e) =>
                          handleSelectAll(
                            (e.target as HTMLInputElement).checked
                          )
                        }
                      />
                    </th>
                    <th className="p-2 text-left font-medium text-sm">Name</th>
                    <th className="p-2 text-left font-medium text-sm">
                      DMC Name
                    </th>
                    <th className="p-2 text-left font-medium text-sm">
                      Status
                    </th>
                    <th className="p-2 text-left w-10">View</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={selectedItems[request.id] || false}
                          onChange={(e) =>
                            handleSelectItem(
                              request.id,
                              (e.target as HTMLInputElement).checked
                            )
                          }
                        />
                      </td>
                      <td className="p-2 text-sm font-medium">
                        <div>{request.name}</div>
                        <div className="text-xs text-gray-500">
                          {request.id}
                        </div>
                      </td>
                      <td className="p-2 text-sm">{request.dmcName}</td>
                      <td className="p-2 text-sm">
                        <span
                          className={`${getStatusColor(
                            request.status
                          )} px-2 py-0.5 rounded-md text-xs whitespace-nowrap`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => navigateToDetail(request.id)}
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateDmcStatus(request.id, "Active")
                              }
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateDmcStatus(request.id, "Active")
                              }
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600">
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end mt-4 gap-2">
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
                className={`h-8 w-8 ${currentPage === page ? "bg-green-600 hover:bg-green-700" : ""
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
      <div className="text-xs text-gray-500 mt-8">
        © 2023, Made by <span className="text-emerald-500">Trekking Miles</span>
        .
      </div>
    </div>
  );
}


