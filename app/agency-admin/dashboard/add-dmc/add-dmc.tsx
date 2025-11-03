"use client"
import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Edit, X, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { countries, cities, destinations } from "@/data/add-dmc"
import { z } from "zod"
import { useDMCForm } from "@/context/dmc-form-context"

// Validation schemas
const dmcSchema = z.object({
  dmcName: z.string().min(2, "DMC name must be at least 2 characters"),
  primaryContact: z.string().min(2, "Primary contact must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  designation: z.string().min(2, "Designation must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  ownerPhoneNumber: z.string().min(10, "Owner phone must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").or(z.literal("")),
  primaryCountry: z.string().min(1, "Primary country is required"),
  destinationsCovered: z.array(z.string()).min(1, "At least one destination must be selected"),
  cities: z.string().min(1, "Cities is required"),
  gstRegistration: z.enum(["Yes", "No"]),
  gstNo: z.string().optional(),
  yearOfRegistration: z.string().min(4, "Year must be 4 digits").max(4),
  panNo: z.string().length(10, "PAN must be 10 characters"),
  panType: z.string().min(1, "PAN type is required"),
  headquarters: z.string().min(2, "Headquarters must be at least 2 characters"),
  country: z.string().min(1, "Country is required"),
  yearOfExperience: z.string().min(1, "Year of experience is required"),
  primaryPhoneExtension: z.string(),
  ownerPhoneExtension: z.string(),
})

// Local fetchDMCs function to avoid external dependency issues
const fetchDMCs = async (params: {
  search: string
  sortBy: string
  sortOrder: string
  page: number
  limit: number
}) => {
  const searchParams = new URLSearchParams({
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page: params.page.toString(),
    limit: params.limit.toString(),
  })

  const response = await fetch(`/api/auth/agency-add-dmc?${searchParams}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    let errorMessage = "Failed to fetch DMCs"
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || `${response.status}: ${response.statusText}`
    } catch {
      errorMessage = `${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export function DMCRegistrationForm() {
  const { formData, setFormData, isEditing, editingId, resetForm } = useDMCForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Parse destinations from string to array
  const getDestinationsArray = (): string[] => {
    if (Array.isArray(formData.destinationsCovered)) {
      return formData.destinationsCovered
    }
    if (typeof formData.destinationsCovered === 'string') {
      try {
        const parsed = JSON.parse(formData.destinationsCovered)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return formData.destinationsCovered ? [formData.destinationsCovered] : []
      }
    }
    return []
  }

 const handleDestinationToggle = (destination: string) => {
  const currentDestinations = getDestinationsArray()
  
  const newDestinations = currentDestinations.includes(destination)
    ? currentDestinations.filter((d: string) => d !== destination)
    : [...currentDestinations, destination]
  
  // Convert array back to string before setting
  setFormData({ 
    ...formData, 
    destinationsCovered: JSON.stringify(newDestinations) 
  })
}

const removeDestination = (destination: string) => {
  const currentDestinations = getDestinationsArray()
  
  const newDestinations = currentDestinations.filter((d: string) => d !== destination)
  setFormData({ 
    ...formData, 
    destinationsCovered: JSON.stringify(newDestinations) 
  })
}

  const validateForm = () => {
    try {
      // Convert destinations to array for validation
      const dataToValidate = {
        ...formData,
        destinationsCovered: getDestinationsArray()
      }
      dmcSchema.parse(dataToValidate)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err: z.ZodIssue) => {
          toast({
            title: "Validation Error",
            description: err.message,
            variant: "destructive",
          })
        })
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      
      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== "id") {
          if (key === 'destinationsCovered') {
            const destinations = getDestinationsArray()
            formDataToSend.append(key, JSON.stringify(destinations))
          } else {
            formDataToSend.append(key, String(value))
          }
        }
      })

      let response
      let successMessage

      if (isEditing && editingId) {
        // Update existing DMC
        response = await fetch(`/api/auth/agency-add-dmc/${editingId}`, {
          method: "PUT",
          body: formDataToSend,
          credentials: "include",
        })
        successMessage = "DMC has been updated successfully"
      } else {
        // Create new DMC
        response = await fetch("/api/auth/agency-add-dmc", {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        })
        successMessage = "DMC has been registered successfully"
      }

      if (!response.ok) {
        let errorMessage = `Failed to ${isEditing ? "update" : "register"} DMC`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      await response.json()

      toast({
        title: "Success",
        description: successMessage,
      })

      // Reset form and editing state
      resetForm()

      // Optionally refresh DMC list
      try {
        await fetchDMCs({
          search: "",
          sortBy: "createdAt",
          sortOrder: "desc",
          page: 1,
          limit: 10,
        })
        console.log("DMC list refreshed successfully")
      } catch (fetchError) {
        console.error("Error refreshing DMC list:", fetchError)
        console.warn("DMC created/updated successfully but failed to refresh list")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "register"} DMC`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedDestinations = getDestinationsArray()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Edit className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Edit Mode</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You are currently editing an existing DMC. Make your changes and click &ldquo;Update DMC&rdquo; to
                  save.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-28">
        {/* DMC Name */}
        <div className="space-y-2 w-full">
          <label htmlFor="dmcName" className="block text-sm font-medium text-gray-700 font-Poppins">
            DMC/TO name
          </label>
          <Input
            id="dmcName"
            name="dmcName"
            value={formData.dmcName}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        {/* Primary Contact Person */}
        <div className="space-y-2 w-full">
          <label htmlFor="primaryContact" className="block text-sm font-medium text-gray-700 font-Poppins">
            Primary contact person
          </label>
          <Input
            id="primaryContact"
            name="primaryContact"
            value={formData.primaryContact}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2 w-full">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 font-Poppins">
            Phone number
          </label>
          <div className="flex">
            <Select
              value={formData.primaryPhoneExtension}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryPhoneExtension: value }))}
            >
              <SelectTrigger className="w-28 h-12 rounded-r-none border-r-0">
                <SelectValue placeholder="+91" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
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
              </SelectContent>
            </Select>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="flex-1 h-12 rounded-l-none focus:border-emerald-500 hover:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Designation */}
        <div className="space-y-2 w-full">
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 font-Poppins">
            Designation
          </label>
          <Input
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        {/* Owner Name */}
        <div className="space-y-2 w-full">
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 font-Poppins">
            Owner name
          </label>
          <Input
            id="ownerName"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            required
          />
        </div>

        {/* Owner Phone Number */}
        <div className="space-y-2 w-full">
          <label htmlFor="ownerPhoneNumber" className="block text-sm font-medium text-gray-700 font-Poppins">
            Phone number
          </label>
          <div className="flex">
            <Select
              value={formData.ownerPhoneExtension}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, ownerPhoneExtension: value }))}
            >
              <SelectTrigger className="w-28 h-12 rounded-r-none border-r-0">
                <SelectValue placeholder="+91" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
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
              </SelectContent>
            </Select>
            <Input
              id="ownerPhoneNumber"
              name="ownerPhoneNumber"
              value={formData.ownerPhoneNumber}
              onChange={handleInputChange}
              className="flex-1 h-12 rounded-l-none focus:border-emerald-500 hover:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2 w-full">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-Poppins">
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

        {/* Website */}
        <div className="space-y-2 w-full">
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 font-Poppins">
            Website
          </label>
          <Input
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
          />
        </div>

        {/* Primary Country */}
        <div className="space-y-2 w-full">
          <label htmlFor="primaryCountry" className="block text-sm font-medium text-gray-700 font-Poppins">
            Primary country
          </label>
          <Select
            value={formData.primaryCountry}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryCountry: value }))}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


{/* Destinations Covered - Multi-Select */}
<div className="space-y-2 w-full">
  <label htmlFor="destinationsCovered" className="block text-sm font-medium text-gray-700 font-Poppins">
    Destinations Covered
  </label>
  <div className="relative">
    <div
      onClick={() => setIsDestinationDropdownOpen(!isDestinationDropdownOpen)}
      className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-emerald-500 focus:border-emerald-500 transition-colors flex items-center justify-between bg-white"
    >
      <span className="text-sm text-gray-700">
        {selectedDestinations.length > 0 
          ? `${selectedDestinations.length} selected` 
          : "Select destinations..."}
      </span>
      <svg
        className={`w-4 h-4 transition-transform ${isDestinationDropdownOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    {isDestinationDropdownOpen && (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {destinations.map((destination: string) => (
          <div
            key={destination}
            onClick={() => handleDestinationToggle(destination)}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          >
            <span className="text-sm">{destination}</span>
            {selectedDestinations.includes(destination) && (
              <Check className="w-4 h-4 text-emerald-600" />
            )}
          </div>
        ))}
      </div>
    )}

    {/* Selected Destinations Tags - Shows ALL selected destinations */}
    {selectedDestinations.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedDestinations.map((destination: string) => (
          <div
            key={destination}
            className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm"
          >
            <span>{destination}</span>
            <button
              type="button"
              onClick={() => removeDestination(destination)}
              className="hover:bg-emerald-200 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

        {/* Cities */}
        <div className="space-y-2 w-full">
          <label htmlFor="cities" className="block text-sm font-medium text-gray-700 font-Poppins">
            Cities
          </label>
          <Select
            value={formData.cities}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, cities: value }))}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* GST Registration */}
        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700 font-Poppins">GST Registration</label>
          <RadioGroup
            value={formData.gstRegistration}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                gstRegistration: value as "Yes" | "No",
              }))
            }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="gst-yes" className="text-emerald-500" />
              <Label htmlFor="gst-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="gst-no" />
              <Label htmlFor="gst-no">No</Label>
            </div>
          </RadioGroup>
        </div>

        {/* GST No. */}
        <div className="space-y-2 w-full">
          <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 font-Poppins">
            TAX Id.
          </label>
          <Input
            id="gstNo"
            name="gstNo"
            value={formData.gstNo}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            disabled={formData.gstRegistration === "No"}
          />
        </div>

        {/* Year of Registration */}
        <div className="space-y-2 w-full">
          <label htmlFor="yearOfRegistration" className="block text-sm font-medium text-gray-700 font-Poppins">
            Year of Registration
          </label>
          <div className="relative">
            <Input
              id="yearOfRegistration"
              name="yearOfRegistration"
              value={formData.yearOfRegistration}
              onChange={handleInputChange}
              className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-sm text-gray-600 font-Poppins">
              Years
            </div>
          </div>
        </div>

        {/* PAN No. */}
        <div className="space-y-2 w-full">
          <label htmlFor="panNo" className="block text-sm font-medium text-gray-700 font-Poppins">
            PAN No.
          </label>
          <Input
            id="panNo"
            name="panNo"
            value={formData.panNo}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
          />
        </div>

        {/* PAN Type */}
        <div className="space-y-2 w-full">
          <label htmlFor="panType" className="block text-sm font-medium text-gray-700 font-Poppins">
            PAN type
          </label>
          <Select
            value={formData.panType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, panType: value }))}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Individual">Individual</SelectItem>
              <SelectItem value="Company">Company</SelectItem>
              <SelectItem value="Trust">Trust</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Headquarters */}
        <div className="space-y-2 w-full">
          <label htmlFor="headquarters" className="block text-sm font-medium text-gray-700 font-Poppins">
            Headquarters
          </label>
          <Input
            id="headquarters"
            name="headquarters"
            value={formData.headquarters}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
          />
        </div>

        {/* Country */}
        <div className="space-y-2 w-full">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 font-Poppins">
            Country
          </label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year of Experience */}
        <div className="space-y-2 w-full">
          <label htmlFor="yearOfExperience" className="block text-sm font-medium text-gray-700 font-Poppins">
            Year of Experience
          </label>
          <div className="relative">
            <Input
              id="yearOfExperience"
              name="yearOfExperience"
              value={formData.yearOfExperience}
              onChange={handleInputChange}
              className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-sm text-gray-600 font-Poppins">
              Years
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-6">
        <Button
          type="submit"
          className="h-12 px-6 bg-custom-green hover:bg-gray-900 text-white rounded-md ml-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditing ? "Updating..." : "Submitting...") : isEditing ? "Update DMC" : "Submit"}
        </Button>
      </div>

      <Toaster />
    </form>
  )
}