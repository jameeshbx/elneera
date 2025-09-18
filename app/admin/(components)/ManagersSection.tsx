"use client"

import type React from "react"
import axios from "axios"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  Search,
  Download,
  Eye,
  EyeOff,
  MoreVertical,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Trash2,
  Calendar,
  Info,
  Upload,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Manager {
  id: string;
  name: string;
  email: string;
  username: string;
  userId: string;
  status: string;
  phone: string;
  password: string;
}

export default function ManagerSection() {

  const [managers, setManagers] = useState<Manager[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1) // Start at page 1 instead of 4
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [displayedManagers, setDisplayedManagers] = useState(managers.slice(0, 3)) // Initialize with first 3 managers
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    status: "INACTIVE", // Add status to form data with 
    profile: null as File | null,
  })
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [phoneExtension, setPhoneExtension] = useState("+91")

  // Items per page
  const itemsPerPage = 3
  const totalPages = Math.ceil(managers.length / itemsPerPage)

  // Fetch managers from backend on mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await axios.get("/api/auth/add-managers")
        setManagers(response.data)
      } catch (err) {
        console.error("Failed to fetch managers:", err)
        toast({
          title: "Error",
          description: "Failed to load managers",
          variant: "destructive",
        })
      }
    }
    fetchManagers()
  }, [])


  // Handle pagination, filtering, and sorting
  useEffect(() => {
    // Apply filtering
    let filtered = managers.filter(
      (manager) =>
        manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (manager.id && manager.id.toLowerCase().includes(searchQuery.toLowerCase())),
    )


    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "status") {
        return sortOrder === "asc"
          ? (a.status || "").localeCompare(b.status || "")
          : (b.status || "").localeCompare(a.status || "")
      } else if (sortBy === "email") {
        return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
      }
      return 0
    })

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedManagers = filtered.slice(startIndex, startIndex + itemsPerPage)

    // Update state with the filtered, sorted, and paginated managers
    setDisplayedManagers(paginatedManagers);

    // Reset to page 1 if current page is invalid after filtering
    if (paginatedManagers.length === 0 && currentPage > 1 && filtered.length > 0) {
      setCurrentPage(1)
    }
  }, [managers, currentPage, searchQuery, sortBy, sortOrder])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle status change in form

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, profile: file }))
      setUploadedFile(file.name);
      toast({
        title: "File uploaded",
        description: `Successfully uploaded: ${file.name}`,
      });
    }
  };



  // Submit form with Axios POST

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 👉 Local validation
    if (formData.username.length < 3) {
      toast({ title: "Error", description: "Username must be at least 3 characters", variant: "destructive" });
      return;
    }

    if (!/^\d+$/.test(formData.phone)) {
      toast({ title: "Error", description: "Phone must contain 10 digits ", variant: "destructive" });
      return;
    }


    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    try {
      const managerData = {
        name: formData.name,
        phone: formData.phone, // only digits
        countryCode: phoneExtension, // "+91"
        email: formData.email,
        username: formData.username,
        password: formData.password,
         status: formData.status, // Include status in the request
        // Add profile upload logic if needed — here we’re not sending the file yet!
      }

      const response = await axios.post("/api/auth/add-managers", managerData)


      //  Add new manager to local state
      setManagers((prev) => [...prev, response.data]);


      // new one
      // Reset form and search
      setFormData({
        name: "",
        phone: "",
        email: "",
        username: "",
        password: "",
        status: "INACTIVE", // Reset to default
        profile: null,
      })
      setUploadedFile(null)
      setSearchQuery("");
      setCurrentPage(1);

      console.log("Form submitted:", managerData);

      toast({
        title: "Form submitted",
        description: "Manager has been added successfully",
      })


    } catch (err: unknown) {
      console.error("Submission error:", err)
      let errorMessage = "Failed to add manager"
      if (typeof err === "object" && err !== null && "response" in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response
        errorMessage = response?.data?.error || errorMessage
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }


  const togglePasswordVisibility = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  //staus update
  const handleManagerStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch("/api/auth/update-manager-status", {
        id,
        status: newStatus,
      });

      setManagers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );

      toast({
        title: "Status updated",
        description: `Status changed to ${newStatus}`,
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      toast({
        title: "Error",
        description: "Could not update status",
        variant: "destructive",
      });
    }
  };



  // status above
  const handleDownload = () => {
    toast({
      title: "Downloaded",
      description: "Manager data has been downloaded successfully",
    });
  }

  const handleSort = (value: string) => {
    if (value === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortBy(value)
      setSortOrder("asc")
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 bg-gray-50/50 p-4 sm:p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2 w-full">
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 font-poppins">
            Name
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        <div className="space-y-2 w-full">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 font-poppins">
            Phone No.
          </label>
          <div className="flex">
            <Select value={phoneExtension} onValueChange={setPhoneExtension}>
              <SelectTrigger className="w-28 h-12 rounded-r-none border-r-0">
                <SelectValue placeholder="+91" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+91">
                  <div className="flex items-center">
                    <Image src="https://flagcdn.com/w20/in.png" alt="India" className="h-4 mr-1" width={20} height={14} />
                    <span>+91</span>
                  </div>
                </SelectItem>
                <SelectItem value="+1">
                  <div className="flex items-center">
                    <Image src="https://flagcdn.com/w20/us.png" alt="USA" className="h-4 mr-1" width={20} height={14} />
                    <span>+1</span>
                  </div>
                </SelectItem>
                <SelectItem value="+44">
                  <div className="flex items-center">
                    <Image src="https://flagcdn.com/w20/gb.png" alt="UK" className="h-4 mr-1" width={20} height={14} />
                    <span>+44</span>
                  </div>
                </SelectItem>
                <SelectItem value="+61">
                  <div className="flex items-center">
                    <Image src="https://flagcdn.com/w20/au.png" alt="Australia" className="h-4 mr-1" width={20} height={14} />
                    <span>+61</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="flex-1 h-12 rounded-l-none focus:border-emerald-500 hover:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        <div className="space-y-2 w-full">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-poppins">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        <div className="space-y-2 w-full">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 font-poppins">
            Username
          </label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        <div className="space-y-2 w-full">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-poppins">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showFormPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              className="w-full h-12 pr-10 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowFormPassword(!showFormPassword)}
            >
              {showFormPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2 w-full">
          <label htmlFor="profile" className="block text-sm font-medium text-gray-700 font-nunito">
            Profile
          </label>
          <div className="flex items-center">
            <Input
              id="profile-display"
              readOnly
              value={uploadedFile || ""}
              placeholder="No file chosen"
              className="flex-1 h-12 rounded-r-none focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-l-none bg-greenlight hover:bg-emerald-600 text-white border-0 flex items-center"
              onClick={() => document.getElementById("profile-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-1 font-nunito" />
              Upload
            </Button>
            <input id="profile-upload" name="profile" type="file" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div className="w-full md:col-span-2 lg:col-span-3 flex justify-end mt-4">
          <Button
            type="submit"
            className="h-12 w-24 bg-gradient-to-r from-custom-green to-light-green hover:from-green-900 hover:to-emerald-600 text-white font-poppins"
          >
            Submit
          </Button>
        </div>
      </form>

      <div className="mt-12 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for..."
              className="pl-10 w-full sm:w-60 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Select value={sortBy} onValueChange={handleSort}>
              <SelectTrigger className="w-full sm:w-40">
                <div className="flex items-center font-Raleway">
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}</SelectItem>
                <SelectItem value="email">Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}</SelectItem>
                <SelectItem value="status">
                  Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="rounded-full bg-gray-100" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200">
                <TableHead className="w-12 py-3">
                  <Checkbox id="select-all" />
                </TableHead>

                <TableHead className="py-3 font-bold font-poppins text-gray-500">Name</TableHead>
                <TableHead className="py-3 font-bold font-poppins text-gray-500 hidden md:table-cell">
                  Phone no.
                </TableHead>
                <TableHead className="py-3 font-bold font-poppins text-gray-500 hidden sm:table-cell">Email</TableHead>
                <TableHead className="py-3 font-bold font-poppins text-gray-500 hidden lg:table-cell">
                  Username
                </TableHead>
                <TableHead className="py-3 font-bold font-poppins text-gray-500 hidden lg:table-cell">
                  Password
                </TableHead>
                <TableHead className="py-3 font-bold font-poppins text-gray-500">Status</TableHead>
                <TableHead className="w-12 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedManagers.length > 0 ? (
                displayedManagers.map((manager, index) => (
                  <TableRow
                    key={manager.id}

                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50 border-0"}
                  >
                    <TableCell className="py-3">
                      <Checkbox id={`select-${manager.id}`} />
                    </TableCell>

                    <TableCell className="py-3 font-poppins">{manager.name}</TableCell>
                    <TableCell className="py-3 font-poppins hidden md:table-cell">{manager.phone}</TableCell>
                    <TableCell className="py-3 font-poppins hidden sm:table-cell">{manager.email}</TableCell>
                    <TableCell className="py-3 font-poppins hidden lg:table-cell">{manager.username}</TableCell>
                    <TableCell className="py-3 font-poppins hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <span>{showPassword[manager.id] ? manager.password : "•••••••"}</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(manager.id)}
                          className="text-gray-500"
                        >
                          {showPassword[manager.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-3">
                      <Select
                          value={manager.status || "INACTIVE"}
                          onValueChange={(value) => handleManagerStatusChange(manager.id, value)}
>

                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only font-poppins">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="flex items-center">
                            <Info className="h-4 w-4 mr-2 font-poppins" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center">
                            <FileEdit className="h-4 w-4 mr-2 font-poppins" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center">
                            <Trash2 className="h-4 w-4 mr-2 font-poppins" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 font-poppins" />
                            <span>Created: 01/01/2023</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-gray-500 font-poppins">
                    No managers found. Try adjusting your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end items-center space-x-2 py-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronFirst className="h-4 w-4" />
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
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${page === currentPage ? "bg-greenlight text-white border-0 hover:bg-emerald-600" : ""
                    }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              )
            }

            // Show ellipsis for gaps
            if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
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
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-8">
        © 2025, Made by <span className="text-emerald-500">Trekking Miles</span>.
      </div>

      <Toaster />
    </div>
  )
}
