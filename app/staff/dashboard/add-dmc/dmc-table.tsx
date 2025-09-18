"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useDMCForm } from "@/context/dmc-form-context"
import { StandaloneBankDetails } from "./standalone-bank-details"

interface DMC {
  id: string
  name: string
  primaryContact: string
  phoneNumber: string
  designation: string
  email: string
  status: string
  joinSource: string
  registrationCertificateUrl?: string | null
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export function DMCTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [dmcData, setDmcData] = useState<DMC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
  })

  const { setFormData, setIsEditing, setEditingId } = useDMCForm()
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [selectedDmcId, setSelectedDmcId] = useState<string | null>(null)

  // Fetch DMCs from API
  const fetchDMCs = async (
    params: {
      search?: string
      sortBy?: string
      sortOrder?: string
      page?: number
      limit?: number
    } = {},
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        search: params.search || searchQuery,
        sortBy: params.sortBy || sortBy,
        sortOrder: params.sortOrder || sortOrder,
        page: String(params.page || pagination.page),
        limit: String(params.limit || pagination.limit),
      })

      const response = await fetch(`/api/auth/agency-add-dmc?${searchParams}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch DMCs")
      }

      const data = await response.json()
      setDmcData(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch DMCs")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch DMCs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchDMCs()
  }, [])

  // Handle DMC deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this DMC? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/auth/agency-add-dmc/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete DMC")
      }

      toast({
        title: "Success",
        description: "DMC deleted successfully",
      })

      // Refresh the data
      await fetchDMCs()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete DMC",
        variant: "destructive",
      })
    }
  }

  // Handle status toggle
  const handleStatusToggle = async (id: string) => {
    try {
      const response = await fetch(`/api/auth/agency-add-dmc/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action: "toggleStatus" }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: result.message,
      })

      // Refresh the data
      await fetchDMCs()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  // Handle DMC edit
  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/auth/agency-add-dmc/${id}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch DMC details")
      }

      const result = await response.json()
      const dmcData = result.data

      // Transform the API data to match form structure
      const formData = {
        id: dmcData.id,
        dmcName: dmcData.name || "",
        primaryContact: dmcData.contactPerson || "",
        phoneNumber: dmcData.phoneNumber || "",
        designation: dmcData.designation || "",
        ownerName: dmcData.ownerName || "",
        ownerPhoneNumber: dmcData.ownerPhoneNumber || "",
        email: dmcData.email || "",
        website: dmcData.website || "",
        primaryCountry: dmcData.primaryCountry || "",
        destinationsCovered: dmcData.destinationsCovered || "",
        cities: dmcData.cities || "",
        gstRegistration: dmcData.gstRegistered ? "Yes" : ("No" as "Yes" | "No"),
        gstNo: dmcData.gstNumber || "",
        yearOfRegistration: dmcData.yearOfRegistration || "",
        panNo: dmcData.panNumber || "",
        panType: dmcData.panType || "",
        headquarters: dmcData.headquarters || "",
        country: dmcData.country || "",
        yearOfExperience: dmcData.yearsOfExperience || "",
        registrationCertificate: null, // File will be handled separately
        primaryPhoneExtension: dmcData.phoneCountryCode || "+91",
        ownerPhoneExtension: dmcData.ownerPhoneCode || "+91",
      }

      // Set the form data and editing state
      setFormData(formData)
      setIsEditing(true)
      setEditingId(id)

      toast({
        title: "Edit Mode",
        description: "DMC data loaded for editing. Scroll up to the form.",
      })

      // Scroll to the form
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load DMC for editing",
        variant: "destructive",
      })
    }
  }

  // Handle Excel download
  const handleExcelDownload = async () => {
    try {
      const searchParams = new URLSearchParams({
        search: searchQuery,
        sortBy: sortBy,
        sortOrder: sortOrder,
      })

      const response = await fetch(`/api/auth/agency-add-dmc/export?${searchParams}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to download Excel file")
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `DMCs_Export_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to download Excel file",
        variant: "destructive",
      })
    }
  }

  const handleSort = (value: string) => {
    const newSortOrder = value === sortBy && sortOrder === "asc" ? "desc" : "asc"
    setSortBy(value)
    setSortOrder(newSortOrder)
    fetchDMCs({
      sortBy: value,
      sortOrder: newSortOrder,
      page: 1, // Reset to first page when sorting
    })
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchDMCs({
        search: query,
        page: 1, // Reset to first page when searching
      })
    }, 500)
    return () => clearTimeout(timeoutId)
  }

  const handleDownload = (url?: string | null) => {
    if (url) {
      window.open(url, "_blank")
    } else {
      toast({
        title: "Error",
        description: "No certificate available",
        variant: "destructive",
      })
    }
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchDMCs({ page })
    }
  }

  if (isLoading) {
    return <div className="mt-12 text-center">Loading DMCs...</div>
  }

  if (error) {
    return <div className="mt-12 text-center text-red-500">{error}</div>
  }

  return (
    <div className="mt-12 space-y-4">
      <Toaster />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for..."
            className="pl-10 w-full sm:w-60 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="w-full sm:w-40">
              <div className="flex items-center">
                <span>Sort by</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}</SelectItem>
              <SelectItem value="primaryContact">
                Contact {sortBy === "primaryContact" && (sortOrder === "asc" ? "↑" : "↓")}
              </SelectItem>
              <SelectItem value="status">Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={handleExcelDownload}
            title="Download Excel"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200">
                <TableHead className="w-12 py-3">
                  <Checkbox id="select-all" />
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500">DMC name</TableHead>
                <TableHead className="py-3 font-bold text-gray-500">Primary contact</TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden md:table-cell">Phone no.</TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden md:table-cell">Designation</TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden sm:table-cell">Email</TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden lg:table-cell">
                  Registration certificate
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden lg:table-cell">Join Source</TableHead>
                <TableHead className="py-3 font-bold text-gray-500">Status</TableHead>
                <TableHead className="py-3 font-bold text-gray-500">Payments</TableHead>
                <TableHead className="w-12 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dmcData.length > 0 ? (
                dmcData.map((dmc, index) => (
                  <TableRow key={dmc.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50 border-0"}>
                    <TableCell className="py-3">
                      <Checkbox id={`select-${dmc.id}`} />
                    </TableCell>
                    <TableCell className="py-3 font-medium">
                      <div className="flex items-center gap-2">{dmc.name}</div>
                    </TableCell>
                    <TableCell className="py-3">{dmc.primaryContact}</TableCell>
                    <TableCell className="py-3 hidden md:table-cell">{dmc.phoneNumber}</TableCell>
                    <TableCell className="py-3 hidden md:table-cell">{dmc.designation}</TableCell>
                    <TableCell className="py-3 hidden sm:table-cell">{dmc.email}</TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs flex items-center gap-1 bg-transparent"
                        onClick={() => handleDownload(dmc.registrationCertificateUrl)}
                        disabled={!dmc.registrationCertificateUrl}
                      >
                        <Download className="h-3 w-3" />
                        {dmc.registrationCertificateUrl ? "Download" : "N/A"}
                      </Button>
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">{dmc.joinSource}</TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          dmc.status === "Active"
                            ? "bg-custom-green hover:bg-green-800 text-white border-0"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-0"
                        }`}
                        onClick={() => handleStatusToggle(dmc.id)}
                        title="Click to toggle status"
                      >
                        {dmc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs bg-greenlight hover:bg-emerald-600 text-white border-0"
                        onClick={() => {
                          setSelectedDmcId(dmc.id)
                          setShowPaymentsModal(true)
                        }}
                      >
                        Add Bank Details
                      </Button>
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(dmc.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(dmc.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                    No DMCs found. Try adjusting your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalCount > 0 && (
          <div className="flex justify-end items-center space-x-2 py-4 px-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md bg-transparent"
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md bg-transparent"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === pagination.totalPages ||
                (page >= pagination.page - 1 && page <= pagination.page + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 rounded-md ${
                      page === pagination.page ? "bg-greenlight text-white border-0 hover:bg-emerald-600" : ""
                    }`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                )
              }
              if (
                (page === 2 && pagination.page > 3) ||
                (page === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
              ) {
                return (
                  <div key={page} className="mx-1">
                    ...
                  </div>
                )
              }
              return null
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md bg-transparent"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md bg-transparent"
              onClick={() => goToPage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {showPaymentsModal && (
        <StandaloneBankDetails
          isOpen={showPaymentsModal}
          onClose={() => {
            setShowPaymentsModal(false)
            setSelectedDmcId(null)
          }}
          dmcId={selectedDmcId}
        />
      )}
    </div>
  )
}
