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
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeolocationResult } from '@/types/mapbox';
import { Badge } from '@/components/ui/badge';

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

export function DMCRegistrationForm() {
  const { formData, setFormData, isEditing, editingId, resetForm, triggerRefresh } = useDMCForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Add these state variables inside your component
const [countrySearch, setCountrySearch] = useState('');
const [citySearch, setCitySearch] = useState('');
const [destinationSearch, setDestinationSearch] = useState('');
const [countryResults, setCountryResults] = useState<GeolocationResult[]>([]);
const [cityResults, setCityResults] = useState<GeolocationResult[]>([]);
const [destinationResults, setDestinationResults] = useState<GeolocationResult[]>([]);
const [showCountryDropdown, setShowCountryDropdown] = useState(false);
const [showCityDropdown, setShowCityDropdown] = useState(false);
const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
const { geocodeAddress } = useGeolocation();


const handleCountrySearch = async (query: string) => {
  setCountrySearch(query);
  if (query.trim() !== '') {
    const results = await geocodeAddress(query, 'country');
    setCountryResults(results);
    setShowCountryDropdown(true);
  } else {
    setCountryResults([]);
    setShowCountryDropdown(false);
  }
};

const handleCitySearch = async (query: string) => {
  setCitySearch(query);
  if (query.trim() !== '' && formData.primaryCountry) {
    const results = await geocodeAddress(
      `${query}, ${formData.primaryCountry}`,
      'place'
    );
    setCityResults(results);
    setShowCityDropdown(true);
  } else {
    setCityResults([]);
    setShowCityDropdown(false);
  }
};
const handleDestinationSearch = async (query: string) => {
  setDestinationSearch(query);
  if (query.length > 2) {
    const results = await geocodeAddress(
      query,
      'poi,address,place'
    );
    setDestinationResults(results);
    setShowDestinationDropdown(true);
  } else {
    setDestinationResults([]);
    setShowDestinationDropdown(false);
  }
};

const addDestination = (destination: string) => {
  const currentDestinations = getDestinationsArray();
  if (!currentDestinations.includes(destination)) {
    setFormData(prev => ({
      ...prev,
      destinationsCovered: JSON.stringify([...currentDestinations, destination])
    }));
  }
  setDestinationSearch('');
  setShowDestinationDropdown(false);
};


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      const { ...rest } = errors
      setErrors(rest)
    }
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


// Update the existing removeDestination function
const removeDestination = (destination: string) => {
  const currentDestinations = getDestinationsArray();
  const newDestinations = currentDestinations.filter(d => d !== destination);
  setFormData(prev => ({
    ...prev,
    destinationsCovered: JSON.stringify(newDestinations)
  }));
};

  const validateForm = (): { valid: boolean; firstErrorField?: string } => {
    try {
      const dataToValidate = {
        ...formData,
        destinationsCovered: getDestinationsArray(),
      }
      dmcSchema.parse(dataToValidate)
      setErrors({})
      return { valid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((issue: z.ZodIssue) => {
          const field = (issue.path?.[0] as string) || "form"
          if (!fieldErrors[field]) fieldErrors[field] = issue.message
          toast({
            title: "Validation Error",
            description: issue.message,
            variant: "destructive",
          })
        })
        setErrors(fieldErrors)
        const firstField = Object.keys(fieldErrors)[0]
        return { valid: false, firstErrorField: firstField }
      }
      return { valid: false }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = validateForm()
    if (!result.valid) {
      setIsSubmitting(false)
      if (result.firstErrorField) {
        const el = document.getElementById(result.firstErrorField)
        el?.focus()
      }
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

      // Notify listeners (e.g., table) to refresh
      triggerRefresh()

      // (Table will refetch via refresh signal)
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


  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
          {errors.dmcName && (<p className="text-sm text-red-600">{errors.dmcName}</p>)}
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
          {errors.primaryContact && (<p className="text-sm text-red-600">{errors.primaryContact}</p>)}
        </div>

        {/* Phone Number */}
        <div className="space-y-2 w-full">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 font-Poppins">
            Phone number
          </label>
          <div className="flex">
            <Select
              value={formData.primaryPhoneExtension}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, primaryPhoneExtension: value }))
                if (errors.primaryPhoneExtension) {
                  const { ...rest } = errors
                  setErrors(rest)
                }
              }}
            >
              <SelectTrigger id="primaryPhoneExtension" className="w-28 h-12 rounded-r-none border-r-0">
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
            {errors.phoneNumber && (<p className="text-sm text-red-600">{errors.phoneNumber}</p>)}
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
          {errors.designation && (<p className="text-sm text-red-600">{errors.designation}</p>)}
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
          {errors.ownerName && (<p className="text-sm text-red-600">{errors.ownerName}</p>)}
        </div>

        {/* Owner Phone Number */}
        <div className="space-y-2 w-full">
          <label htmlFor="ownerPhoneNumber" className="block text-sm font-medium text-gray-700 font-Poppins">
            Phone number
          </label>
          <div className="flex">
            <Select
              value={formData.ownerPhoneExtension}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, ownerPhoneExtension: value }))
                if (errors.ownerPhoneExtension) {
                  const { ...rest } = errors
                  setErrors(rest)
                }
              }}
            >
              <SelectTrigger id="ownerPhoneExtension" className="w-28 h-12 rounded-r-none border-r-0">
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
            {errors.ownerPhoneNumber && (<p className="text-sm text-red-600">{errors.ownerPhoneNumber}</p>)}
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
          {errors.email && (<p className="text-sm text-red-600">{errors.email}</p>)}
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
          {errors.website && (<p className="text-sm text-red-600">{errors.website}</p>)}
        </div>

        {/* Primary Country */}
<div className="space-y-2 w-full relative">
  <label htmlFor="primaryCountry" className="block text-sm font-medium text-gray-700 font-Poppins">
    Primary country
  </label>
  <div className="relative">
    <input
      type="text"
      id="primaryCountry"
      value={countrySearch}
      onChange={(e) => handleCountrySearch(e.target.value)}
      onFocus={() => countrySearch.trim() !== '' && setShowCountryDropdown(true)}
      placeholder="Search for a country..."
      className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {showCountryDropdown && countryResults.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {countryResults.map((result) => (
          <div
            key={result.id}
            className="p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                primaryCountry: result.placeName
              }));
              setCountrySearch(result.placeName);
              setShowCountryDropdown(false);
              setCitySearch('');
              setFormData(prev => ({ ...prev, cities: '' }));
            }}
          >
            {result.placeName}
          </div>
        ))}
      </div>
    )}
  </div>
  {errors.primaryCountry && <p className="text-sm text-red-600">{errors.primaryCountry}</p>}
</div>

{/* Cities */}
<div className="space-y-2 w-full relative">
  <label htmlFor="cities" className="block text-sm font-medium text-gray-700 font-Poppins">
    Cities
  </label>
  <div className="relative">
    <input
      type="text"
      id="cities"
      value={citySearch}
      onChange={(e) => handleCitySearch(e.target.value)}
      onFocus={() => citySearch.length > 2 && setShowCityDropdown(true)}
      disabled={!formData.primaryCountry}
      placeholder={formData.primaryCountry ? "Search for a city..." : "Select a country first"}
      className={`w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        !formData.primaryCountry ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
    {showCityDropdown && cityResults.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {cityResults.map((result) => (
          <div
            key={result.id}
            className="p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                cities: result.placeName
              }));
              setCitySearch(result.placeName);
              setShowCityDropdown(false);
            }}
          >
            {result.placeName}
          </div>
        ))}
      </div>
    )}
  </div>
  {errors.cities && <p className="text-sm text-red-600">{errors.cities}</p>}
</div>

{/* Destinations Covered */}
<div className="space-y-2 w-full">
  <label htmlFor="destinationsCovered" className="block text-sm font-medium text-gray-700 font-Poppins">
    Destinations Covered
  </label>
  <div className="relative">
    <div className="w-full min-h-12 p-2 border border-gray-300 rounded-md bg-white flex flex-wrap gap-2 items-center">
      {getDestinationsArray().map((destination) => (
        <Badge key={destination} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs flex items-center gap-1">
          {destination}
          <X
            className="h-3 w-3 cursor-pointer hover:text-blue-600"
            onClick={() => removeDestination(destination)}
          />
        </Badge>
      ))}
      <input
        type="text"
        value={destinationSearch}
        onChange={(e) => handleDestinationSearch(e.target.value)}
        onFocus={() => destinationSearch.trim() !== '' && setShowDestinationDropdown(true)}
        placeholder="Search for destinations..."
        className="flex-1 min-w-[120px] h-8 px-2 border-0 focus:ring-0 focus:outline-none"
      />
    </div>
    {showDestinationDropdown && destinationResults.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {destinationResults.map((result) => (
          <div
            key={result.id}
            className="p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => {
              addDestination(result.placeName);
              setDestinationSearch('');
              setShowDestinationDropdown(false);
            }}
          >
            {result.placeName}
          </div>
        ))}
      </div>
    )}
  </div>
  {errors.destinationsCovered && <p className="text-sm text-red-600">{errors.destinationsCovered}</p>}
</div>

        

        {/* GST Registration */}
        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700 font-Poppins">GST Registration</label>
          <RadioGroup
            id="gstRegistration"
            value={formData.gstRegistration}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                gstRegistration: value as "Yes" | "No",
              }))
              if (errors.gstRegistration) {
                const { ...rest } = errors
                setErrors(rest)
              }
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
          {errors.gstRegistration && (<p className="text-sm text-red-600">{errors.gstRegistration}</p>)}
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
          {errors.gstNo && (<p className="text-sm text-red-600">{errors.gstNo}</p>)}
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
          {errors.yearOfRegistration && (<p className="text-sm text-red-600">{errors.yearOfRegistration}</p>)}
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
          {errors.panNo && (<p className="text-sm text-red-600">{errors.panNo}</p>)}
        </div>

        {/* PAN Type */}
        <div className="space-y-2 w-full">
          <label htmlFor="panType" className="block text-sm font-medium text-gray-700 font-Poppins">
            PAN type
          </label>
          <Select
            value={formData.panType}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, panType: value }))
              if (errors.panType) {
                const { ...rest } = errors
                setErrors(rest)
              }
            }}
          >
            <SelectTrigger id="panType" className="w-full h-12">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Individual">Individual</SelectItem>
              <SelectItem value="Company">Company</SelectItem>
              <SelectItem value="Trust">Trust</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.panType && (<p className="text-sm text-red-600">{errors.panType}</p>)}
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
          {errors.headquarters && (<p className="text-sm text-red-600">{errors.headquarters}</p>)}
        </div>

        {/* Country */}
        <div className="space-y-2 w-full">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 font-Poppins">
            Country
          </label>
          <Select
            value={formData.country}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, country: value }))
              if (errors.country) {
                const { ...rest } = errors
                setErrors(rest)
              }
            }}
          >
            <SelectTrigger id="country" className="w-full h-12">
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
          {errors.country && (<p className="text-sm text-red-600">{errors.country}</p>)}
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
          {errors.yearOfExperience && (<p className="text-sm text-red-600">{errors.yearOfExperience}</p>)}
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