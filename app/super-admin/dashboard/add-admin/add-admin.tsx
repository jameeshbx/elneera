"use client"

import { useState, useEffect, useRef } from 'react';
import { Search, Download, Eye, EyeOff, MoreVertical, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, FileEdit, Trash2, Info, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface Admin {
  id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  status: string;
  profile?: {
    url: string;
  };
  createdAt?: string;
}

export default function AdminManagerSection() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [, setIsLoading] = useState(true);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: ''
  });

  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const handleStatusChange = async (id: string, value: string) => {
    // optimistic update
    setAdmins(prev => prev.map(a => (a.id === id ? { ...a, status: value } : a)));
    try {
      const res = await fetch('/api/auth/super-admin-addadmin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: value }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast({ title: "Updated", description: "Status saved", variant: "default" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      // revert on error
      setAdmins(prev => prev.map(a => (a.id === id ? { ...a, status: a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : a)));
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const toggleRowPassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = !prev[id];
      if (next && !tempPasswords[id]) {
        toast({ title: "Password not available", description: "Stored passwords cannot be retrieved. Use Reset Password.", variant: "destructive" });
      }
      return { ...prev, [id]: next };
    });
  };

  // Fetch existing admins on component mount
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch('/api/auth/super-admin-addadmin');
        const contentType = response.headers.get('content-type');

        if (!contentType?.includes('application/json')) {
          throw new Error('Invalid response format');
        }

        const data = await response.json();

        if (response.ok) {
          setAdmins(data);
        } else {
          throw new Error(data.message || 'Failed to fetch admins');
        }
      } catch (error) {
        console.error('Error fetching admins:', error);
        toast({
          title: "Error",
          description: "Failed to load admins",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, [toast]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        // Validate file size (example: 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size too large (max 5MB)');
        }
        setSelectedFile(file);
        const displayInput = document.getElementById('profile-display') as HTMLInputElement;
        if (displayInput) {
          displayInput.value = file.name;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);
      if (selectedFile) {
        formDataToSend.append('profile', selectedFile);
      }

      setIsLoading(true);

      const response = await fetch('/api/auth/super-admin-addadmin', {
        method: 'POST',
        body: formDataToSend,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(`${responseData.message || 'Failed to create admin'}${responseData.error ? `: ${responseData.error}` : ''}`);
      }

      // Success case
      setAdmins(prev => [...prev, responseData.admin]);
      formRef.current?.reset();

      // capture the password for this admin so it can be revealed once
      setTempPasswords(prev => ({ ...prev, [responseData.admin.id]: formData.password }));
      formRef.current?.reset();

      setFormData({
        name: '',
        phone: '',
        email: '',
        username: '',
        password: ''
      });
      setSelectedFile(null);

      // Clear file inputs explicitly
      const fileInput = document.getElementById('profile-upload') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';

      const displayInput = document.getElementById('profile-display') as HTMLInputElement | null;
      if (displayInput) displayInput.value = '';

      toast({
        title: "Success",
        description: responseData.message || "Admin created successfully",
        variant: "default",
      });

    } catch (error: unknown) {
      console.error('Full submission error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create admin";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-4 md:space-y-6 bg-gray-50/50 p-3 sm:p-4 rounded-lg">
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Name Field */}
        <div className="space-y-1 sm:space-y-2 w-full">
          <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 font-poppins">
            Name
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            pattern="^[A-Za-z\s]{2,}$"
            title="Only letters and spaces, at least 2 characters"
            required
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-1 sm:space-y-2 w-full">
          <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 font-poppins">
            Phone No.
          </label>
          <div className="flex">
            <Select>
              <SelectTrigger className="w-16 sm:w-20 md:w-24 h-9 sm:h-10 md:h-9 rounded-r-none border-r-0 text-xs sm:text-sm">
                <SelectValue placeholder="+91" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+91">
                  <div className="flex items-center">
                    <Image src="https://flagcdn.com/w20/in.png" alt="India" className="h-3 sm:h-4 mr-1" width={20} height={14} />
                    <span className="text-xs sm:text-sm">+91</span>
                  </div>
                </SelectItem>
                <SelectItem value="+1">
                  <div className="flex items-center">
                    <Image src="https://flagcdn.com/w20/us.png" alt="USA" className="h-3 sm:h-4 mr-1" width={20} height={14} />
                    <span className="text-xs sm:text-sm">+1</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              inputMode="numeric"
              pattern="^\d{10}$"
              maxLength={10}
              title="Enter exactly 10 digits (India +91)"
              required
            />
          </div>
        </div>


        {/* Email Field */}
        <div className="space-y-1 sm:space-y-2 w-full">
          <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 font-poppins">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-9 sm:h-10 md:h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors text-xs sm:text-sm"
            required
          />
        </div>

        {/* Username Field */}
        <div className="space-y-1 sm:space-y-2 w-full">
          <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700 font-poppins">
            Username
          </label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            pattern="^[A-Za-z0-9._-]{3,}$"
            minLength={3}
            title="At least 3 characters; letters, numbers, dot, underscore, hyphen"
            required
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1 sm:space-y-2 w-full">
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 font-poppins">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
              minLength={8}
              title="Min 8 chars with letters, digits and a special character"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              ) : (
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Profile Upload Field */}
        <div className="space-y-1 sm:space-y-2 w-full">
          <label htmlFor="profile" className="block text-xs sm:text-sm font-medium text-gray-700 font-nunito">
            Profile
          </label>
          <div className="flex items-center">
            <Input
              id="profile-display"
              readOnly
              placeholder="No file chosen"
              className="flex-1 h-9 sm:h-10 md:h-12 rounded-r-none focus:border-emerald-500 hover:border-emerald-500 transition-colors text-xs sm:text-sm"
            />
            <label htmlFor="profile-upload" className="h-9 sm:h-10 md:h-12 rounded-l-none bg-greenlight hover:bg-emerald-600 text-white border-0 flex items-center px-2 sm:px-3 cursor-pointer">
              <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 font-nunito" />
              <span className="text-xs sm:text-sm">Upload</span>
            </label>
            <input
              id="profile-upload"
              name="profile"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full sm:col-span-2 lg:col-span-3 flex justify-end mt-2 sm:mt-4">
          <Button
            type="submit"
            className="h-9 sm:h-10 md:h-12 w-16 sm:w-20 md:w-24 bg-gradient-to-r from-custom-green to-light-green hover:from-green-900 hover:to-emerald-600 text-white font-poppins text-xs sm:text-sm"
          >
            Submit
          </Button>
        </div>
      </form>

      {/* Table Section */}
      <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
        {/* Search and Sort Controls */}
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 sm:gap-3">
          <div className="relative w-full xs:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              placeholder="Search for..."
              className="pl-9 sm:pl-10 w-full xs:w-48 sm:w-56 md:w-60 h-8 sm:h-9 md:h-10 focus:border-emerald-500 hover:border-emerald-500 transition-colors text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-center space-x-2 w-full xs:w-auto mt-2 xs:mt-0">
            <Select>
              <SelectTrigger className="w-full xs:w-32 sm:w-36 md:w-40 h-8 sm:h-9 md:h-10 text-xs sm:text-sm">
                <div className="flex items-center font-Raleway">
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name ↑</SelectItem>
                <SelectItem value="email">Email ↓</SelectItem>
                <SelectItem value="status">Status ↑</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="rounded-full bg-gray-100 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block rounded-md overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-8 sm:w-10 md:w-12 py-2 sm:py-3 px-2 sm:px-3">
                    <Checkbox id="select-all" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </TableHead>
                  <TableHead className="py-2 sm:py-3 px-2 sm:px-3 font-bold font-poppins text-gray-500 text-xs sm:text-sm min-w-[100px]">Name</TableHead>
                  <TableHead className="py-2 sm:py-3 px-2 sm:px-3 font-bold font-poppins text-gray-500 text-xs sm:text-sm hidden md:table-cell min-w-[120px]">
                    Phone no.
                  </TableHead>
                  <TableHead className="py-2 sm:py-3 px-2 sm:px-3 font-bold font-poppins text-gray-500 text-xs sm:text-sm hidden sm:table-cell min-w-[150px]">Email</TableHead>
                  <TableHead className="py-2 sm:py-3 px-2 sm:px-3 font-bold font-poppins text-gray-500 text-xs sm:text-sm hidden lg:table-cell min-w-[100px]">
                    Username
                  </TableHead>
                  <TableHead className="py-2 sm:py-3 px-2 sm:px-3 font-bold font-poppins text-gray-500 text-xs sm:text-sm hidden xl:table-cell min-w-[120px]">
                    Password
                  </TableHead>
                  <TableHead className="py-2 sm:py-3 px-2 sm:px-3 font-bold font-poppins text-gray-500 text-xs sm:text-sm min-w-[100px]">Status</TableHead>
                  <TableHead className="w-8 sm:w-10 md:w-12 py-2 sm:py-3 px-2 sm:px-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {admins.map((admin) => (
  <TableRow key={admin.id} className="bg-white">
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3">
      <Checkbox id={`select-${admin.id}`} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </TableCell>
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3 font-poppins text-xs sm:text-sm">{admin.name}</TableCell>
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3 font-poppins text-xs sm:text-sm hidden md:table-cell">{admin.phone}</TableCell>
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3 font-poppins text-xs sm:text-sm hidden sm:table-cell">{admin.email}</TableCell>
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3 font-poppins text-xs sm:text-sm hidden lg:table-cell">{admin.username}</TableCell>

    {/* Password (single cell with toggle) */}
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3 font-poppins text-xs sm:text-sm hidden xl:table-cell">
      <div className="flex items-center space-x-2">
        <span>{visiblePasswords[admin.id] ? (tempPasswords[admin.id] ?? "Not available") : "•••••••"}</span>
        <button type="button" className="text-gray-500" onClick={() => toggleRowPassword(admin.id)}>
          {visiblePasswords[admin.id] ? (
            <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          ) : (
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          )}
        </button>
      </div>
    </TableCell>

    {/* Status (controlled; persists via PATCH) */}
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3">
      <Select value={admin.status} onValueChange={(v) => handleStatusChange(admin.id, v)}>
        <SelectTrigger className="w-20 sm:w-24 md:w-28 h-6 sm:h-7 md:h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </TableCell>

    {/* Actions */}
    <TableCell className="py-2 sm:py-3 px-2 sm:px-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
            <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <span className="sr-only font-poppins">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 sm:w-40 md:w-48">
          <DropdownMenuItem className="flex items-center text-xs sm:text-sm">
            <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-2 font-poppins" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center text-xs sm:text-sm">
            <FileEdit className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-2 font-poppins" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center text-xs sm:text-sm">
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-2 font-poppins" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile-friendly Card View for small screens */}
        <div className="sm:hidden space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id={`mobile-select-${admin.id}`} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <h3 className="font-poppins font-semibold text-xs sm:text-sm">{admin.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                      <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32 sm:w-36">
                    <DropdownMenuItem className="flex items-center text-xs sm:text-sm">
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                      <span>View Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center text-xs sm:text-sm">
                      <FileEdit className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center text-xs sm:text-sm">
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 w-16 sm:w-20">Email:</span>
                  <span className="truncate">{admin.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-16 sm:w-20">Phone:</span>
                  <span>{admin.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status:</span>
                  <Select value={admin.status} onValueChange={(v) => handleStatusChange(admin.id, v)}>
                    <SelectTrigger className="w-20 sm:w-24 h-6 sm:h-7 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center sm:justify-end items-center space-x-1 sm:space-x-2 py-3 sm:py-4">
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" disabled>
            <ChevronFirst className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" disabled>
            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-greenlight text-white border-0 hover:bg-emerald-600 text-xs sm:text-sm">
            1
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md text-xs sm:text-sm">
            2
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md text-xs sm:text-sm">
            3
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md">
            <ChevronLast className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-4 sm:mt-6 text-center sm:text-left">
        © 2025, Made by <span className="text-emerald-500">Trekking Miles</span>.
      </div>

      <Toaster />
    </div>
  )
}