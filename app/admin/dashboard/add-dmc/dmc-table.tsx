"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { StandaloneBankDetails } from "./standalone-bank-details"

interface DMCData {
  id: string;
  name: string;
  primaryContact: string;
  phoneNumber: string;
  designation: string;
  email: string;
  status: string;
  joinSource: string;
  createdAt: string;
  registrationCertificate?: {
    id: string;
    name: string;
    url: string;
  } | null;
  ownerName: string;
  ownerPhoneNumber: string;
  website: string;
  primaryCountry: string;
  destinationsCovered: string;
  cities: string;
  gstRegistered: boolean;
  gstNumber: string;
  yearOfRegistration: string;
  panNumber: string;
  panType: string;
  headquarters: string;
  country: string;
  yearsOfExperience: string;
}

interface DMCTableProps {
  refreshTrigger: number;
}

export function DMCTable({ refreshTrigger }: DMCTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dmcData, setDmcData] = useState<DMCData[]>([]);
  const [displayedDMCs, setDisplayedDMCs] = useState<DMCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(displayedDMCs.length / itemsPerPage);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayedDMCs.slice(indexOfFirstItem, indexOfLastItem);

  // Fetch DMC data from API
  const fetchDMCData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/dmc");

      if (!response.ok) {
        throw new Error("Failed to fetch DMC data");
      }

      const result = await response.json();

      if (result.success) {
        setDmcData(result.data);
        setDisplayedDMCs(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch DMC data");
      }
    } catch (error: unknown) {
      console.error("Error fetching DMC data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch DMC data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchDMCData();
  }, [refreshTrigger]);

  const handleSort = (value: string) => {
    if (value === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortBy(value);
      setSortOrder("asc");
    }

    // Apply sorting
    const sorted = [...dmcData].sort((a, b) => {
      if (value === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (value === "contact") {
        return sortOrder === "asc"
          ? a.primaryContact.localeCompare(b.primaryContact)
          : b.primaryContact.localeCompare(a.primaryContact);
      } else if (value === "status") {
        return sortOrder === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });

    setDisplayedDMCs(sorted);
    setCurrentPage(1); // Reset to first page after sorting
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setDisplayedDMCs(dmcData);
      return;
    }

    const filtered = dmcData.filter(
      (dmc) =>
        dmc.name.toLowerCase().includes(query.toLowerCase()) ||
        dmc.primaryContact.toLowerCase().includes(query.toLowerCase()) ||
        dmc.email.toLowerCase().includes(query.toLowerCase())
    );

    setDisplayedDMCs(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  const handleDownload = () => {
    console.log("Downloading data");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this DMC?")) return;
    try {
      const res = await fetch(`/api/dmc?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setDmcData((prev) => prev.filter((dmc) => dmc.id !== id));
        setDisplayedDMCs((prev) => prev.filter((dmc) => dmc.id !== id));
        toast({ title: "Deleted", description: "DMC deleted successfully." });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete DMC",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error deleting DMC:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete DMC";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [selectedDmcId, setSelectedDmcId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="mt-12 space-y-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Loading DMC data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 space-y-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500">Error: {error}</div>
          <Button onClick={fetchDMCData} className="ml-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-4">
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
              <SelectItem value="name">
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </SelectItem>
              <SelectItem value="contact">
                Contact{" "}
                {sortBy === "contact" && (sortOrder === "asc" ? "↑" : "↓")}
              </SelectItem>
              <SelectItem value="status">
                Status{" "}
                {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-gray-100"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-gray-100"
            onClick={fetchDMCData}
          >
            <RefreshCw className="h-4 w-4" />
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
                <TableHead className="py-3 font-bold text-gray-500">
                  DMC name
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500">
                  Primary contact
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden md:table-cell">
                  Phone no.
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden md:table-cell">
                  Designation
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden sm:table-cell">
                  Email
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden lg:table-cell">
                  Registration certificate
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500 hidden lg:table-cell">
                  Join Source
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500">
                  Status
                </TableHead>
                <TableHead className="py-3 font-bold text-gray-500">Payments</TableHead>
                <TableHead className="w-12 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((dmc, index) => (
                  <TableRow
                    key={dmc.id}
                    data-testid={`dmc-row-${dmc.id}`}
                    className={
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50 border-0"
                    }
                  >
                    <TableCell className="py-3">
                      <Checkbox id={`select-${dmc.id}`} />
                    </TableCell>
                    <TableCell className="py-3 font-medium">
                      <div className="flex items-center gap-2">{dmc.name}</div>
                    </TableCell>
                    <TableCell className="py-3">{dmc.primaryContact}</TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      {dmc.phoneNumber}
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      {dmc.designation}
                    </TableCell>
                    <TableCell className="py-3 hidden sm:table-cell">
                      {dmc.email}
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      {dmc.registrationCertificate ? (
                        <a
                          href={dmc.registrationCertificate.url}
                          download={dmc.registrationCertificate.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          No certificate
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      {dmc.joinSource || "Direct"}
                    </TableCell>
                    <TableCell className="py-3">
                     
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(dmc.id)}
                          >
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
                  <TableCell
                    colSpan={10}
                    className="text-center py-6 text-gray-500"
                  >
                    No DMCs found. Try adjusting your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {displayedDMCs.length > 0 && (
          <div className="flex justify-end items-center space-x-2 py-4 px-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 rounded-md ${
                      page === currentPage
                        ? "bg-greenlight text-white border-0 hover:bg-emerald-600"
                        : ""
                    }`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                );
              }

              // Show ellipsis for gaps
              if (
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <div key={page} className="mx-1">
                    ...
                  </div>
                );
              }

              return null;
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
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
      <Toaster />
    </div>
  );
}
