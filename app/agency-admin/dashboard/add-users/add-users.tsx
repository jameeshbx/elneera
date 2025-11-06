"use client"

import type React from "react"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"


interface User {
  id: string;
  userId: string;
  name: string;
  username: string;
  phoneNumber: string;  
  phoneExtension: string;  
  email: string;
  userType: 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL';
  password: string;
  maskedPassword: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  profileImage?: {
    name: string;
    url: string;
  } | null;
}

export default function AddUsers() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [users, setUsers] = useState<User[]>([])
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([])
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    userType: "TEAM_LEAD" as 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL',
    profile: null as File | null,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      userType: "TEAM_LEAD",
      profile: null,
    });
    setUploadedFile(null);
  };
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [phoneExtension, setPhoneExtension] = useState("+91")
  const [isLoading, setIsLoading] = useState(false)

  const itemsPerPage = 3
  const totalPages = Math.ceil(users.length / itemsPerPage)


  const validateForm = (): boolean => {
    // Simple validation - just check if required fields are not empty
    const requiredFields = ['name', 'phone', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.toString().trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Missing required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Phone number must be 10 digits",
        variant: "destructive",
      });
      return false;
    }

    // Validate email
    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    // Username validation removed as we're using email as the identifier

    // Validate password
    if (!formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters", 
        variant: "destructive",
      });
      return false;
    }

    // Validate user type
    const userTypes = [
      { value: 'TEAM_LEAD', label: 'Team Lead', path: '/teamlead/dashboard' },
      { value: 'EXECUTIVE', label: 'Executive', path: '/executive/dashboard' },
      { value: 'MANAGER', label: 'Manager', path: '/agency/dashboard' },
      { value: 'TL', label: 'Telecaller', path: '/telecaller/dashboard' },
    ];
    if (!userTypes.find(type => type.value === formData.userType)) {
      toast({
        title: "Validation Error",
        description: "Please select a valid user type",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Let the API resolve the agency admin from the server session
      const response = await fetch('/api/auth/agency-add-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Fetched users:', data);
      
      if (data.success && Array.isArray(data.data)) {
        interface ApiUser {
        id: string;
        name: string;
        phoneNumber: string;
        phoneExtension: string;
        email: string;
        userType: 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL';
        password: string;
        maskedPassword: string;
        status: 'ACTIVE' | 'INACTIVE';
        createdAt: string;
        profileImage?: {
          name: string;
          url: string;
        } | null;
      }

      const mappedUsers = data.data.map((user: ApiUser) => ({
          id: user.id,
          userId: `UID${user.id.slice(0, 4).toUpperCase()}`,
          name: user.name,
          phoneNumber: user.phoneNumber,
          phoneExtension: user.phoneExtension,
          email: user.email,
          userType: user.userType || 'TEAM_LEAD',
          password: user.password,
          maskedPassword: "•••••••",
          status: user.status || 'ACTIVE',
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          profileImage: user.profileImage ? {
            name: user.profileImage.name,
            url: user.profileImage.url
          } : null
        }));
        
        console.log('Mapped users:', mappedUsers);
        
        setUsers(mappedUsers);
        setDisplayedUsers(mappedUsers.slice(0, itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (users.length === 0) return

    let filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "status") {
        return sortOrder === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
      } else if (sortBy === "email") {
        return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
      }
      return 0
    })

    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage)

    setDisplayedUsers(paginatedUsers)

    if (paginatedUsers.length === 0 && filtered.length > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, searchQuery, sortBy, sortOrder, users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        console.log('No file selected');
        return;
      }
      
      const file = e.target.files[0];
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        e.target.value = ''; // Reset the file input
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        e.target.value = ''; // Reset the file input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profile: file
      }));
      
      setUploadedFile(file.name);
      
      toast({
        title: "File ready",
        description: `${file.name} is ready to be uploaded`,
      });
      
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast({
        title: "Error",
        description: "Failed to process the selected file",
        variant: "destructive",
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Basic user data
      const userData = {
        name: formData.name.trim(),
        phoneNumber: formData.phone.trim(),
        phoneExtension: phoneExtension,
        email: formData.email.trim().toLowerCase(),
        username: formData.email.trim().toLowerCase(), // Using email as username
        password: formData.password,
        userType: formData.userType,
      };
      
      // Append all form data
      Object.entries(userData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Handle file upload if exists
      if (formData.profile) {
        formDataToSend.append("profileImage", formData.profile);
      }

      console.log('Submitting form with data:', {
        name: formData.name,
        phoneNumber: formData.phone,
        phoneExtension,
        email: formData.email,
        userType: formData.userType,
        hasProfileImage: !!formData.profile
      });

      // Add credentials to include cookies for session
      const response = await fetch('/api/auth/agency-add-user', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
        // Don't set Content-Type header - let the browser set it with the correct boundary
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', responseData);
        throw new Error(responseData.error || responseData.message || 'Failed to create user');
      }

      if (responseData.success) {
        toast({
          title: "Success!",
          description: "User has been created successfully!",
          variant: "default",
        });
        
        resetForm();
        setUploadedFile(null);
        
        // Refresh the users list
        await fetchUsers();
      } else {
        throw new Error(responseData.message || 'Failed to add user');
      }

    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create user. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = async (id: string) => {
    try {
      if (!showPassword[id]) {
        const response = await fetch('/api/auth/agency-add-user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch password");
        }

        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === id ? { ...user, password: data.data.password } : user
          )
        );
      }

      setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    } catch (error: unknown) {
      let errorMessage = "Failed to reveal password";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      
      const response = await fetch(`/api/auth/agency-add-user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ 
          id: userId,
          status: newStatus 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user status");
      }

      toast({
        title: "Success",
        description: `User status changed to ${newStatus}`,
      });
      
      await fetchUsers();
    } catch (error: unknown) {
      let errorMessage = "Failed to update user status";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    try {
      const headers = ["User ID", "Name", "Phone", "Email", "Username", "Status", "Created At"];
      const csvContent = [
        headers.join(","),
        ...users.map(user => 
          [
            user.userId,
            `"${user.name}"`,
            `"${user.phoneExtension} ${user.phoneNumber}"`,
            user.email,
            user.username,
            user.status,
            user.createdAt
          ].join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "users_data.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "User data has been downloaded as CSV",
      });
    } catch {
      toast({
        title: "Download Error",
        description: "Failed to download user data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      phone: user.phoneNumber,
      email: user.email,
      username: user.username,
      password: "",
      userType: user.userType || "TEAM_LEAD",
      profile: null,
    });
  
    setPhoneExtension(user.phoneExtension);
  
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/auth/agency-add-user?id=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User has been deleted successfully",
      });
      
      await fetchUsers();
    } catch (error: unknown) {
      let errorMessage = "Failed to delete user";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSort = (value: string) => {
    if (value === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(value)
      setSortOrder("asc")
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleUserTypeChange = (value: string) => {
    setFormData({ ...formData, userType: value as 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL' });
  };

  useEffect(() => {
    if (formData.email && !formData.username) {
      const usernameFromEmail = formData.email.split('@')[0];
      setFormData(prev => ({
        ...prev,
        username: usernameFromEmail.toLowerCase().replace(/[^a-z0-9]/g, '')
      }));
    }
  }, [formData.email]);

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
                    <Image
                      src="https://flagcdn.com/w20/in.png"
                      alt="India"
                      className="h-4 mr-1"
                      width={20}
                      height={14}
                    />
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
                    <Image
                      src="https://flagcdn.com/w20/au.png"
                      alt="Australia"
                      className="h-4 mr-1"
                      width={20}
                      height={14}
                    />
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
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700 font-poppins">
            User Type
          </label>
          <Select
            value={formData.userType}
            onValueChange={handleUserTypeChange}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
              <SelectItem value="EXECUTIVE">Executive</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="TL">TL</SelectItem>
            </SelectContent>
          </Select>
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
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isLoading}
            className="h-12 w-24 bg-gradient-to-r from-custom-green to-light-green hover:from-green-900 hover:to-emerald-600 text-white font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
            ) : 'Submit'}
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
                <TableHead className="py-3 font-bold font-poppins text-gray-500">User ID</TableHead>
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
                <TableHead className="py-3 font-bold font-poppins text-gray-500">
                  <span className="hidden lg:inline">User Type</span>
                  <span className="lg:hidden">Type</span>
                </TableHead>
                <TableHead className="py-3 font-bold font-poppins text-gray-500">Status</TableHead>
                <TableHead className="w-12 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsers.length > 0 ? (
                displayedUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    data-testid={`user-row-${user.id}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50 border-0"}
                  >
                    <TableCell className="py-3">
                      <Checkbox id={`select-${user.id}`} />
                    </TableCell>
                    <TableCell className="py-3 font-medium font-poppins">{user.userId}</TableCell>
                    <TableCell className="py-3 font-poppins">{user.name}</TableCell>
                    <TableCell className="py-3 font-poppins hidden md:table-cell">
                      {user.phoneExtension} {user.phoneNumber}
                    </TableCell>
                    <TableCell className="py-3 font-poppins hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell className="py-3 font-poppins hidden lg:table-cell">{user.username}</TableCell>
                    <TableCell className="py-3 font-poppins hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <span>{showPassword[user.id] ? user.password : user.maskedPassword}</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showPassword[user.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 font-poppins">
                      <Badge 
                        variant="outline" 
                        className={`${user.userType === 'TEAM_LEAD' ? 'bg-blue-100 text-blue-800' : 
                                   user.userType === 'EXECUTIVE' ? 'bg-green-100 text-green-800' : 
                                   user.userType === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                                   'bg-orange-100 text-orange-800'}`}
                      >
                        {user.userType === 'TEAM_LEAD' ? 'Team Lead' : 
                         user.userType === 'EXECUTIVE' ? 'Executive' : 
                         user.userType === 'MANAGER' ? 'Manager' : 'TL'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          user.status === "ACTIVE"
                            ? "bg-green-800 hover:bg-green-800 text-white border-0"
                            : "bg-gray-200 hover:bg-gray-200 text-gray-700 border-0"
                        }`}
                        onClick={() => toggleUserStatus(user.id, user.status)}
                      >
                        {user.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
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
                          <DropdownMenuItem 
                            className="flex items-center"
                            onClick={() => handleEdit(user)}
                          >
                            <FileEdit className="h-4 w-4 mr-2 font-poppins" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2 font-poppins" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 font-poppins" />
                            <span>Created: {user.createdAt}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-gray-500 font-poppins">
                    No users found. Try adjusting your search criteria.
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
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${
                    page === currentPage ? "bg-greenlight text-white border-0 hover:bg-emerald-600" : ""
                  }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              )
            }

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