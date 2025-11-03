import { z } from "zod"

// Agency form validation schema
export const agencyFormSchemaBase = z
  .object({
    name: z.string().min(1, "Company name is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
agencyType: z.enum([
  "PRIVATE_LIMITED", 
  "PROPRIETORSHIP", 
  "PARTNERSHIP", 
  "PUBLIC_LIMITED", 
  "LLP",
  "TOUR_OPERATOR",
  "TRAVEL_AGENT",
  "DMC",
  "OTHER"
]),
    designation: z.string().min(1, "Designation is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    phoneCountryCode: z.string().default("+91"),
    ownerName: z.string().min(1, "Owner name is required"),
    email: z.string().email("Invalid email address"),
    companyPhone: z.string().min(10, "Company phone must be at least 10 digits"),
    companyPhoneCode: z.string().default("+91"),
    website: z.string().url("Invalid website URL"),
    landingPageColor: z.string().default("#4ECDC4"),
    gstRegistered: z.boolean().default(true),
    gstNumber: z.string().optional(),
    yearOfRegistration: z.coerce
      .number()
      .min(1900, "Invalid year")
      .max(new Date().getFullYear(), "Year cannot be in the future"),
    panNumber: z.string().min(10, "PAN number must be 10 characters").max(10, "PAN number must be 10 characters"),
    panType: z.enum(["INDIVIDUAL", "COMPANY", "TRUST", "OTHER"]),
    headquarters: z.string().min(1, "Headquarters address is required"),
    country: z.string().default("INDIA"),
    yearsOfOperation: z.coerce.number().min(0, "Years of operation cannot be negative"),
    logo: z.instanceof(File).optional(),
    businessLicense: z.instanceof(File).optional(),
  })
  .refine(
    (data) => {
      // If GST is registered, GST number is required
      if (data.gstRegistered && !data.gstNumber) {
        return false
      }
      return true
    },
    {
      message: "GST number is required when GST registered is Yes",
      path: ["gstNumber"],
    },
  )

export type AgencyFormValues = z.infer<typeof agencyFormSchemaBase>
