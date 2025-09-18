"use client";

import { useEffect, useState, useCallback } from "react" 
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
  Eye,
  Edit,
  Trash2,
  CalendarIcon,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  getEmailHighlight,
  getRequestTypeColor,
  getRequestTypeDotColor,
} from "@/data/agency"
import { utils, write } from "xlsx"
import { useToast } from "@/components/ui/use-toast"

// Define the type for agency form data
type AgencyFormData = {
  id: string
  name: string
  email: string
  phoneNumber: string
  AgencyName: string
  status: string
  requestType: string
  requestDate: string
  contactPerson: string
  designation: string
  website: string
  ownerName: string
  gstNumber: string
  panNumber: string
  headquarters: string
  logo: File | null
  businessLicense: File | null
  agencyType: string
  phoneCountryCode: string
  companyPhone: string
  companyPhoneCode: string
  landingPageColor: string
  gstRegistered: boolean
  yearOfRegistration: string
  panType: string
  country: string
  yearsOfOperation: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function ManageAgencySignup() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [filteredRequests, setFilteredRequests] = useState<AgencyFormData[]>([])
  const [allRequests, setAllRequests] = useState<AgencyFormData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, boolean>>({
    APPROVED: true,
    PENDING: true,
    REJECTED: true,
  })
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [, setIsClient] = useState(false)
  const [screenSize, setScreenSize] = useState("lg") // Default to large screen

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: "Active" | "Inactive") => {
    try {
      const response = await fetch(`/api/auth/manage-agency`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: id,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with the response data
        setAllRequests(prev => prev.map(request => 
          request.id === id ? { ...request, status: data.request.status } : request
        ));
        
        // Show success toast
        toast({
          title: "Status Updated",
          description: `Agency status has been updated to ${data.request.status}`,
          variant: "default",
        });
      } else {
        console.error('Failed to update status:', data.error);
        toast({
          title: "Error",
          description: data.error || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating status",
        variant: "destructive",
      });
    }
  };

  // Handle request type change
  const handleRequestTypeChange = async (id: string, newType: "APPROVED" | "PENDING" | "REJECTED") => {
    try {
      const response = await fetch(`/api/auth/manage-agency`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: id,
          requestType: newType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with the response data
        setAllRequests(prev => prev.map(request => 
          request.id === id ? { ...request, requestType: data.request.requestType } : request
        ));
        
        // Show success toast
        toast({
          title: "Request Status Updated",
          description: `Request status has been updated to ${data.request.requestType}`,
          variant: "default",
        });
      } else {
        console.error('Failed to update request type:', data.error);
        toast({
          title: "Error",
          description: data.error || "Failed to update request type",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating request type:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating request type",
        variant: "destructive",
      });
    }
  };

  // Handle filter status change
  const handleFilterStatusChange = (status: string, checked: boolean) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [status.toUpperCase()]: checked,
    }))
  }

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching agency data...");
        const response = await fetch("/api/auth/manage-agency");
        console.log("Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("API response data:", data);

          if (!data.requests || !Array.isArray(data.requests)) {
            console.error("Invalid data format received:", data);
            setError("Invalid data format received from server");
            return;
          }

          // Transform the data if needed to match expected format
          const transformedData = data.requests.map((request: AgencyFormData) => ({
            ...request,
            // Ensure these fields exist to prevent filtering issues
            requestType: request.requestType || "PENDING",
            status: request.status || "ACTIVE",
            // Ensure date fields are properly formatted
            requestDate: request.requestDate || request.createdAt,
            createdAt: request.createdAt || new Date().toISOString(),
            updatedAt: request.updatedAt || new Date().toISOString()
          }))
          
          console.log("Transformed data:", transformedData)
          setAllRequests(transformedData)
          setFilteredRequests(transformedData)
        } else {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          setError(`Failed to fetch agency data: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching agency data:", error);
        setError("Error fetching agency data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("sm");
      } else if (window.innerWidth < 768) {
        setScreenSize("md");
      } else if (window.innerWidth < 1024) {
        setScreenSize("lg");
      } else {
        setScreenSize("xl");
      }
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset filters when component mounts
  useEffect(() => {
    setSelectedStatuses({
      APPROVED: true,
      PENDING: true,
      REJECTED: true
    })
    
    // Reset date range to include all dates
    setDateRange({
      from: undefined,
      to: undefined,
    });
  }, []);

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDirection("asc")
    }
  }

  // Sort items - wrapped in useCallback
  const sortItems = useCallback((items: AgencyFormData[]) => {
    return [...items].sort((a, b) => {
      let compareA: string | number | undefined, compareB: string | number | undefined;
      
      switch(sortBy) {
        case 'id':
          compareA = a.id;
          compareB = b.id;
          break;
        case 'name':
          compareA = a.name?.toLowerCase();
          compareB = b.name?.toLowerCase();
          break;
        case 'date':
          compareA = new Date(a.requestDate || a.createdAt).getTime();
          compareB = new Date(b.requestDate || b.createdAt).getTime();
          break;
        case 'status':
          compareA = a.status?.toLowerCase();
          compareB = b.status?.toLowerCase();
          break;
        case 'requestType':
          compareA = a.requestType?.toLowerCase();
          compareB = b.requestType?.toLowerCase();
          break;
        case 'email':
          compareA = a.email?.toLowerCase();
          compareB = b.email?.toLowerCase();
          break;
        case 'agencyName':
          compareA = a.AgencyName?.toLowerCase();
          compareB = b.AgencyName?.toLowerCase();
          break;
        default:
          compareA = a.id;
          compareB = b.id;
      }

      // Handle undefined/null values
      if (compareA === undefined || compareA === null) compareA = '';
      if (compareB === undefined || compareB === null) compareB = '';

      if (sortDirection === 'asc') {
        return compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
      } else {
        return compareA > compareB ? -1 : compareA < compareB ? 1 : 0;
      }
    });
  }, [sortBy, sortDirection]); // Add dependencies for sortItems

  // Filter and sort requests
  useEffect(() => {
    let filtered = allRequests.filter((request: AgencyFormData) => {
      // Search term filter
      const matchesSearch =
        !searchTerm || // If no search term, include all
        request.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.AgencyName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusSelected = 
        Object.values(selectedStatuses).every(v => !v) || // If no status is selected, show all
        (request.requestType && selectedStatuses[request.requestType.toUpperCase()])

      // Date range filter
      let matchesDateRange = true
      if (dateRange.from && dateRange.to && request.requestDate) {
        const requestDate = new Date(request.requestDate);
        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999); // Include the entire end day
        matchesDateRange = requestDate >= from && requestDate <= to;
      }

      return matchesSearch && statusSelected && matchesDateRange
    })

    // Apply sorting
    filtered = sortItems(filtered)

    setFilteredRequests(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, selectedStatuses, dateRange, allRequests, sortBy, sortDirection, sortItems]) // Added sortItems to dependencies

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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
      screenSize === "sm" ? 3 : screenSize === "md" ? 3 : 5;

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

  // Apply status filters
  const applyStatusFilters = () => {
    setShowStatusFilter(false);
  };

  // Reset status filters
  const resetStatusFilters = () => {
    setSelectedStatuses({ 
      APPROVED: true,
      PENDING: true,
      REJECTED: true,
    })
  }

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
    setSelectedItems((prev) => {
      const newSelected = { ...prev, [id]: checked };

      const allSelected = currentItems.every((item) => newSelected[item.id]);
      setSelectAll(allSelected);

      return newSelected;
    });
  };

  // Format date range for display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      if (screenSize === "sm") {
        return `${format(dateRange.from, "d/M")}-${format(
          dateRange.to,
          "d/M"
        )}`;
      } else if (screenSize === "md") {
        return `${format(dateRange.from, "dd/MM")}-${format(
          dateRange.to,
          "dd/MM"
        )}`;
      } else {
        return `${format(dateRange.from, "dd MMM yy")} - ${format(
          dateRange.to,
          "dd MMM yy"
        )}`;
      }
    }
    return screenSize === "sm" ? "Date" : "Select date range";
  };

  // Reset date range
  const resetDateRange = () => {
    setDateRange({
      from: undefined,
      to: undefined
    })
  }

  // Navigate to detail page
  const navigateToDetail = (id: string) => {
    router.push(`/request-dashboard/${id}`);
  };

  // Handle Excel export
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = filteredRequests.map(request => ({
        'Request ID': request.id,
        'Name': request.name,
        'Email': request.email,
        'Phone Number': request.phoneNumber,
        'Agency Name': request.AgencyName,
        'Status': request.status,
        'Request Type': request.requestType,
        'Request Date': new Date(request.requestDate).toLocaleDateString(),
        'Contact Person': request.contactPerson,
        'Designation': request.designation,
        'Website': request.website,
        'Owner Name': request.ownerName,
        'GST Number': request.gstNumber,
        'PAN Number': request.panNumber,
        'Headquarters': request.headquarters,
        'Agency Type': request.agencyType,
        'GST Registered': request.gstRegistered ? 'Yes' : 'No',
        'Year of Registration': request.yearOfRegistration,
        'Years of Operation': request.yearsOfOperation,
        'Country': request.country,
        'Created At': new Date(request.createdAt).toLocaleDateString(),
        'Updated At': new Date(request.updatedAt).toLocaleDateString()
      }))

      // Create worksheet
      const ws = utils.json_to_sheet(exportData)

      // Set column widths
      const columnWidths: { [key: string]: { wch: number } } = {}
      Object.keys(exportData[0] || {}).forEach(key => {
        columnWidths[key] = { wch: Math.max(key.length, 15) } // minimum width of 15 characters
      })
      ws['!cols'] = Object.values(columnWidths)

      // Create workbook
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Agency Requests')

      // Generate Excel file
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' })
      
      // Create Blob and download
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `agency_requests_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting data:', error)
      // You might want to show a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="w-full p-1 sm:p-2 md:p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading agency data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-1 sm:p-2 md:p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-green-600 hover:bg-green-700"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-1 sm:p-2 md:p-4 bg-white rounded-lg border border-gray-200">
      {/* Search and Filters */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search for..."
              className="pl-8 w-full h-9 sm:h-10 border-gray-300 text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative inline-block w-full sm:w-auto">
              <Button
                variant="outline"
                className="bg-green-600 text-white hover:bg-green-700 border-0 h-9 sm:h-10 flex items-center gap-1 w-full sm:w-auto justify-between text-xs sm:text-sm"
                onClick={() => setShowStatusFilter(!showStatusFilter)}
              >
                <div className="flex items-center gap-1">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    {screenSize === "sm" ? "Filter" : "Request Status"}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              {showStatusFilter && (
                <div className="absolute z-10 mt-1 w-full sm:w-[200px] bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="p-2 border-b border-gray-200">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Filter Status
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="approved"
                        checked={selectedStatuses.APPROVED}
                        onCheckedChange={(checked) => handleFilterStatusChange("APPROVED", !!checked)}
                        className="scale-75 sm:scale-100"
                      />
                      <label htmlFor="approved" className="text-xs sm:text-sm">
                        Approved
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id="pending"
                        checked={selectedStatuses.PENDING}
                        onCheckedChange={(checked) => handleFilterStatusChange("PENDING", !!checked)}
                        className="scale-75 sm:scale-100"
                      />
                      <label htmlFor="pending" className="text-xs sm:text-sm">
                        Pending
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rejected"
                        checked={selectedStatuses.REJECTED}
                        onCheckedChange={(checked) => handleFilterStatusChange("REJECTED", !!checked)}
                        className="scale-75 sm:scale-100"
                      />
                      <label htmlFor="rejected" className="text-xs sm:text-sm">
                        Rejected
                      </label>
                    </div>
                  </div>
                  <div className="p-2 border-t border-gray-200 flex justify-between">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-xs h-7 sm:h-8"
                      onClick={applyStatusFilters}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs h-7 sm:h-8"
                      onClick={() => {
                        resetStatusFilters();
                        setShowStatusFilter(false);
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
                  className="h-9 sm:h-10 flex items-center gap-1 border-gray-300 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-xs sm:text-sm truncate">
                    {formatDateRange()}
                  </span>
                  {screenSize !== "sm" && (
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 text-gray-500" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-gray-200 shadow-lg"
                align="start"
              >
                <div className="p-2 sm:p-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-xs sm:text-sm font-medium">
                    Select Date Range
                  </h3>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from || new Date()}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to || range.from,
                      })
                    } else {
                      resetDateRange()
                    }
                  }}
                  numberOfMonths={1}
                  className="p-2 sm:p-3"
                />
                <div className="flex items-center justify-between p-2 sm:p-3 border-t border-gray-100 bg-gray-50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 sm:h-8"
                    onClick={resetDateRange}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs h-7 sm:h-8"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 sm:h-10 flex items-center gap-1 border-gray-300 text-xs sm:text-sm"
                >
                  {screenSize === "sm" ? (
                    <span>Sort</span>
                  ) : (
                    <>
                      <span>Sort by</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 sm:w-48">
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Sort Options</p>
                </div>
                {[
                  { id: "id", label: "Request ID" },
                  { id: "name", label: "Name" },
                  { id: "agencyName", label: "Agency Name" },
                  { id: "email", label: "Email" },
                  { id: "date", label: "Request Date" },
                  { id: "status", label: "Status" },
                  { id: "requestType", label: "Request Type" },
                ].map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className="flex items-center justify-between cursor-pointer text-xs sm:text-sm"
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
              className="h-9 sm:h-10 w-9 sm:w-10 p-0 flex items-center justify-center"
              onClick={handleExport}
              aria-label="Download"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <div className="min-w-full">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-1 sm:p-3 text-left w-8 sm:w-10">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
                <th className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSortChange("id")}>
                  <div className="flex items-center">
                    <span>ID</span>
                    {sortBy === "id" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange("name")}>
                  <div className="flex items-center">
                    Name
                    {sortBy === "name" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm whitespace-nowrap">
                  Phone
                </th>
                <th className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm whitespace-nowrap">
                  Email
                </th>
                <th className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm">
                  Agency
                </th>
                <th
                  className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSortChange("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === "status" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="p-1 sm:p-3 text-left font-medium text-xs sm:text-sm cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                  onClick={() => handleSortChange("requestType")}
                >
                  <div className="flex items-center">
                    Request Status
                    {sortBy === "requestType" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="p-1 sm:p-3 text-left w-8 sm:w-10">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-1 sm:p-3">
                    <Checkbox
                      checked={selectedItems[request.id] || false}
                      onCheckedChange={(checked) =>
                        handleSelectItem(request.id, !!checked)
                      }
                      className="scale-75 sm:scale-100"
                    />
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm font-medium">
                    <span className="line-clamp-1">{request.id}</span>
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm font-medium sm:font-normal">
                    <span className="line-clamp-1">{request.name}</span>
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm">
                    <span className="line-clamp-1">{request.phoneNumber || '-'}</span>
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm">
                    <span className={`line-clamp-1 ${getEmailHighlight(request.email) || ''}`}>
                      {request.email}
                    </span>
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm">
                    <span className="line-clamp-1">{request.AgencyName}</span>
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div 
                          className={`inline-flex items-center px-2.5 py-1 rounded-md cursor-pointer ${
                            request.status === "Active" 
                              ? "bg-[#E7F6EC] text-[#12B76A]"
                              : "bg-[#FEE4E2] text-[#F04438]"
                          }`}
                        >
                          <span>{request.status}</span>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[100px]">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(request.id, "Active")}
                          className="cursor-pointer text-xs hover:bg-[#E7F6EC] hover:text-[#12B76A] px-2.5 py-1.5"
                        >
                          Active
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(request.id, "Inactive")}
                          className="cursor-pointer text-xs hover:bg-[#FEE4E2] hover:text-[#F04438] px-2.5 py-1.5"
                        >
                          Inactive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-1 sm:p-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${getRequestTypeDotColor(
                          request.requestType
                        )}`}
                      ></span>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${getRequestTypeColor(request.requestType)}`}>
                            <span className="cursor-pointer">{request.requestType}</span>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            className="cursor-pointer text-xs hover:bg-emerald-50 hover:text-emerald-600"
                            onClick={() => handleRequestTypeChange(request.id, "APPROVED")}
                          >
                            Approved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-xs hover:bg-yellow-50 hover:text-yellow-600"
                            onClick={() => handleRequestTypeChange(request.id, "PENDING")}
                          >
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-xs hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleRequestTypeChange(request.id, "REJECTED")}
                          >
                            Rejected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                  <td className="p-1 sm:p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                        >
                          <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 sm:w-auto"
                      >
                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                          onClick={() => navigateToDetail(request.id)}
                          aria-label="View"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                          onClick={() => console.log("Edit", request.id)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer text-red-600 text-xs sm:text-sm"
                          onClick={() => console.log("Delete", request.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-4 sm:p-8 text-center text-gray-500 text-xs sm:text-sm"
                  >
                    {allRequests.length === 0
                      ? "No agency forms submitted yet"
                      : "No records found matching your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end mt-4 gap-1 sm:gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {screenSize !== "sm" && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          )}

          {getPageNumbers().map((page, index) =>
            page === "ellipsis-start" || page === "ellipsis-end" ? (
              <Button
                key={`ellipsis-${index}`}
                variant="outline"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8 text-xs sm:text-sm"
                disabled
              >
                ...
              </Button>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className={`h-6 w-6 sm:h-8 sm:w-8 text-xs sm:text-sm ${
                  currentPage === page ? "bg-green-600 hover:bg-green-700" : ""
                }`}
                onClick={() => paginate(page as number)}
                aria-label={
                  currentPage === page ? "Current page" : `Go to page ${page}`
                }
              >
                {page}
              </Button>
            )
          )}

          {screenSize !== "sm" && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
              >
                <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-8">
        © 2023, Made by <span className="text-emerald-500">Trekking Miles</span>
        .
      </div>
    </div>
  );
}
