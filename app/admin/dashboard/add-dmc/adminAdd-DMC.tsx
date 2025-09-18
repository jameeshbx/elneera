"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { countries } from "@/data/add-dmc";

interface FormErrors {
  dmcName?: string;
  primaryContact?: string;
  phoneNumber?: string;
  designation?: string;
  ownerName?: string;
  ownerPhoneNumber?: string;
  email?: string;
  website?: string;
  primaryCountry?: string;
  destinationsCovered?: string;
  cities?: string;
  gstNo?: string;
  yearOfRegistration?: string;
  panNo?: string;
  panType?: string;
  headquarters?: string;
  country?: string;
  yearOfExperience?: string;
}

interface DMCRegistrationFormProps {
  onDMCAdded: () => void;
}

export function DMCRegistrationForm({ onDMCAdded }: DMCRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    dmcName: "",
    primaryContact: "",
    phoneNumber: "",
    designation: "",
    ownerName: "",
    ownerPhoneNumber: "",
    email: "",
    website: "",
    primaryCountry: "",
    destinationsCovered: "",
    cities: "",
    gstRegistration: "Yes",
    gstNo: "",
    yearOfRegistration: "",
    panNo: "",
    panType: "",
    headquarters: "",
    country: "",
    yearOfExperience: "",
  });

  const [primaryPhoneExtension, setPrimaryPhoneExtension] = useState("+91");
  const [ownerPhoneExtension, setOwnerPhoneExtension] = useState("+91");

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePhoneNumber = (phone: string): string | undefined => {
    const phoneRegex = /^\d{10}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone))
      return "Please enter a valid 10-digit phone number";
    return undefined;
  };

  const validateWebsite = (website: string): string | undefined => {
    if (!website) return undefined; // Website is optional
    const urlRegex = /^https?:\/\/.+\..+/;
    if (!urlRegex.test(website))
      return "Please enter a valid website URL (e.g., https://example.com)";
    return undefined;
  };

  const validateGSTNumber = (
    gstNo: string,
    gstRegistered: string
  ): string | undefined => {
    if (gstRegistered === "No") return undefined;
    if (!gstNo) return "GST number is required when GST registered";
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNo)) return "Please enter a valid GST number";
    return undefined;
  };

  const validatePANNumber = (panNo: string): string | undefined => {
    if (!panNo) return "PAN number is required";
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNo)) return "Please enter a valid PAN number";
    return undefined;
  };

  const validateYear = (
    year: string,
    fieldName: string
  ): string | undefined => {
    if (!year) return `${fieldName} is required`;
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      return `Please enter a valid year between 1900 and ${currentYear}`;
    }
    return undefined;
  };

  const validateExperienceYears = (years: string): string | undefined => {
    if (!years) return "Year of experience is required";
    const num = parseInt(years);
    if (isNaN(num) || num < 0 || num > 100) {
      return "Please enter a valid number of years (0-100)";
    }
    return undefined;
  };


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validations
    if (!formData.dmcName.trim()) newErrors.dmcName = "DMC name is required";
    if (!formData.primaryContact.trim())
      newErrors.primaryContact = "Primary contact is required";
    if (!formData.designation.trim())
      newErrors.designation = "Designation is required";
    if (!formData.ownerName.trim())
      newErrors.ownerName = "Owner name is required";
    if (!formData.headquarters.trim())
      newErrors.headquarters = "Headquarters is required";
    if (!formData.country) newErrors.country = "Country is required";

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Phone number validations
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    const ownerPhoneError = validatePhoneNumber(formData.ownerPhoneNumber);
    if (ownerPhoneError) newErrors.ownerPhoneNumber = ownerPhoneError;

    // Website validation
    const websiteError = validateWebsite(formData.website);
    if (websiteError) newErrors.website = websiteError;

    // GST validation
    const gstError = validateGSTNumber(
      formData.gstNo,
      formData.gstRegistration
    );
    if (gstError) newErrors.gstNo = gstError;

    // PAN validation
    const panError = validatePANNumber(formData.panNo);
    if (panError) newErrors.panNo = panError;

    // Year validations
    const registrationYearError = validateYear(
      formData.yearOfRegistration,
      "Year of registration"
    );
    if (registrationYearError)
      newErrors.yearOfRegistration = registrationYearError;

    const experienceYearsError = validateExperienceYears(
      formData.yearOfExperience
    );
    if (experienceYearsError) newErrors.yearOfExperience = experienceYearsError;


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append phone extensions
      formDataToSend.append("primaryPhoneExtension", primaryPhoneExtension);
      formDataToSend.append("ownerPhoneExtension", ownerPhoneExtension);

      const response = await fetch("/api/auth/admin-addDmc", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      // Success response
      await response.json(); // Just parse but don't store if we're not using it

      toast({
        title: "Success!",
        description: "DMC has been registered successfully",
      });

      // Call the callback to refresh the table
      onDMCAdded();

      // Reset form after successful submission
      setFormData({
        dmcName: "",
        primaryContact: "",
        phoneNumber: "",
        designation: "",
        ownerName: "",
        ownerPhoneNumber: "",
        email: "",
        website: "",
        primaryCountry: "",
        destinationsCovered: "",
        cities: "",
        gstRegistration: "Yes",
        gstNo: "",
        yearOfRegistration: "",
        panNo: "",
        panType: "",
        headquarters: "",
        country: "",
        yearOfExperience: "",
      });
      setPrimaryPhoneExtension("+91");
      setOwnerPhoneExtension("+91");
      setErrors({});
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-28">
        {/* DMC Name */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="dmcName"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            DMC name
          </label>
          <Input
            id="dmcName"
            name="dmcName"
            value={formData.dmcName}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.dmcName ? "border-red-500" : ""
            }`}
            required
          />
          {errors.dmcName && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.dmcName}
            </p>
          )}
        </div>

        {/* Primary Contact Person */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="primaryContact"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Primary contact person
          </label>
          <Input
            id="primaryContact"
            name="primaryContact"
            value={formData.primaryContact}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.primaryContact ? "border-red-500" : ""
            }`}
            required
          />
          {errors.primaryContact && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.primaryContact}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Phone number
          </label>
          <div className="flex">
            <Select
              value={primaryPhoneExtension}
              onValueChange={setPrimaryPhoneExtension}
            >
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
                    <Image
                      src="https://flagcdn.com/w20/us.png"
                      alt="USA"
                      className="h-4 mr-1"
                      width={20}
                      height={14}
                    />
                    <span>+1</span>
                  </div>
                </SelectItem>
                <SelectItem value="+44">
                  <div className="flex items-center">
                    <Image
                      src="https://flagcdn.com/w20/gb.png"
                      alt="UK"
                      className="h-4 mr-1"
                      width={20}
                      height={14}
                    />
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
              className={`flex-1 h-12 rounded-l-none focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
                errors.phoneNumber ? "border-red-500" : ""
              }`}
              required
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Designation */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="designation"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Designation
          </label>
          <Input
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.designation ? "border-red-500" : ""
            }`}
            required
          />
          {errors.designation && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.designation}
            </p>
          )}
        </div>

        {/* Owner Name */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="ownerName"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Owner name
          </label>
          <Input
            id="ownerName"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.ownerName ? "border-red-500" : ""
            }`}
            required
          />
          {errors.ownerName && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.ownerName}
            </p>
          )}
        </div>

        {/* Owner Phone Number */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="ownerPhoneNumber"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Phone number
          </label>
          <div className="flex">
            <Select
              value={ownerPhoneExtension}
              onValueChange={setOwnerPhoneExtension}
            >
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
                    <Image
                      src="https://flagcdn.com/w20/us.png"
                      alt="USA"
                      className="h-4 mr-1"
                      width={20}
                      height={14}
                    />
                    <span>+1</span>
                  </div>
                </SelectItem>
                <SelectItem value="+44">
                  <div className="flex items-center">
                    <Image
                      src="https://flagcdn.com/w20/gb.png"
                      alt="UK"
                      className="h-4 mr-1"
                      width={20}
                      height={14}
                    />
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
              className={`flex-1 h-12 rounded-l-none focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
                errors.ownerPhoneNumber ? "border-red-500" : ""
              }`}
              required
            />
          </div>
          {errors.ownerPhoneNumber && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.ownerPhoneNumber}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.email ? "border-red-500" : ""
            }`}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-500 font-Poppins">{errors.email}</p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Website
          </label>
          <Input
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.website ? "border-red-500" : "" 
            }`}
          />
          {errors.website && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.website}
            </p>
          )}
        </div>

        {/* Primary Country */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="primaryCountry"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Primary Country
          </label>
          <Input
            id="primaryCountry"
            name="primaryCountry"
            value={formData.primaryCountry}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
          />
        </div>

        {/* Destinations Covered */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="destinationsCovered"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Destinations Covered
          </label>
          <Input
            id="destinationsCovered"
            name="destinationsCovered"
            value={formData.destinationsCovered}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
          />
        </div>

        {/* Cities */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="cities"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Cities
          </label>
          <Input
            id="cities"
            name="cities"
            value={formData.cities}
            onChange={handleInputChange}
            className="w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors"
          />
        </div>

        {/* GST Registration */}
        <div className="space-y-2 w-full">
          <label className="block text-sm font-medium text-gray-700 font-Poppins">
            GST Registration
          </label>
          <RadioGroup
            value={formData.gstRegistration}
            onValueChange={(value: "Yes" | "No") =>
              setFormData((prev) => ({ ...prev, gstRegistration: value }))
            }
            className="flex items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="Yes"
                id="gst-yes"
                className="text-emerald-500"
              />
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
          <label
            htmlFor="gstNo"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            TAX Id
          </label>
          <Input
            id="gstNo"
            name="gstNo"
            value={formData.gstNo}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.gstNo ? "border-red-500" : ""
            }`}
            disabled={formData.gstRegistration === "No"}
          />
          {errors.gstNo && (
            <p className="text-sm text-red-500 font-Poppins">{errors.gstNo}</p>
          )}
        </div>

        {/* Year of Registration */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="yearOfRegistration"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Year of Registration
          </label>
          <div className="relative">
            <Input
              id="yearOfRegistration"
              name="yearOfRegistration"
              value={formData.yearOfRegistration}
              onChange={handleInputChange}
              className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
                errors.yearOfRegistration ? "border-red-500" : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-sm text-gray-600 font-Poppins">
              Years
            </div>
          </div>
          {errors.yearOfRegistration && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.yearOfRegistration}
            </p>
          )}
        </div>

        {/* PAN No. */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="panNo"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            PAN No.
          </label>
          <Input
            id="panNo"
            name="panNo"
            value={formData.panNo}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.panNo ? "border-red-500" : ""
            }`}
          />
          {errors.panNo && (
            <p className="text-sm text-red-500 font-Poppins">{errors.panNo}</p>
          )}
        </div>

        {/* PAN Type */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="panType"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            PAN type
          </label>
          <Select
            value={formData.panType}
            onValueChange={(
              value: "INDIVIDUAL" | "COMPANY" | "TRUST" | "OTHER"
            ) => setFormData((prev) => ({ ...prev, panType: value }))}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="TRUST">Trust</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Headquarters */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="headquarters"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Headquarters
          </label>
          <Input
            id="headquarters"
            name="headquarters"
            value={formData.headquarters}
            onChange={handleInputChange}
            className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
              errors.headquarters ? "border-red-500" : ""
            }`}
          />
          {errors.headquarters && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.headquarters}
            </p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Country
          </label>
          <Select
            value={formData.country}
            onValueChange={(value: string) => {
              setFormData((prev) => ({ ...prev, country: value }));
              if (errors.country) {
                setErrors((prev) => ({ ...prev, country: undefined }));
              }
            }}
          >
            <SelectTrigger
              className={`w-full h-12 ${
                errors.country ? "border-red-500" : ""
              }`}
            >
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
          {errors.country && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.country}
            </p>
          )}
        </div>

        {/* Year of Experience */}
        <div className="space-y-2 w-full">
          <label
            htmlFor="yearOfExperience"
            className="block text-sm font-medium text-gray-700 font-Poppins"
          >
            Years of Experience
          </label>
          <div className="relative">
            <Input
              id="yearOfExperience"
              name="yearOfExperience"
              value={formData.yearOfExperience}
              onChange={handleInputChange}
              className={`w-full h-12 focus:border-emerald-500 hover:border-emerald-500 transition-colors ${
                errors.yearOfExperience ? "border-red-500" : ""
              }`}
              placeholder="e.g. 5"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-sm text-gray-600 font-Poppins">
              Years
            </div>
          </div>
          {errors.yearOfExperience && (
            <p className="text-sm text-red-500 font-Poppins">
              {errors.yearOfExperience}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-end mt-4 md:mt-0">
        <Button
          type="submit"
          className="h-12 px-6 bg-custom-green hover:bg-gray-900 text-white rounded-md w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>

      <Toaster />
    </form>
  );
}

