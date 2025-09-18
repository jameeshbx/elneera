import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { AgencyType, PanType } from "@prisma/client"

const sampleAgencyForms = [
  {
    name: "Agency 1",
    config: {
      status: "ACTIVE",
      requestStatus: "PENDING"
    },
    contactPerson: "John Doe",
    agencyType: "PRIVATE_LIMITED" as AgencyType,
    designation: "Manager",
    phoneNumber: "1234567890",
    phoneCountryCode: "+91",
    ownerName: "Jane Doe",
    email: "agency1@example.com",
    companyPhone: "9876543210",
    companyPhoneCode: "+91",
    website: "https://agency1.com",
    landingPageColor: "#4ECDC4",
    gstRegistered: true,
    gstNumber: "GST123456",
    yearOfRegistration: "2020",
    panNumber: "PAN123456",
    panType: "INDIVIDUAL" as PanType,
    headquarters: "New York",
    country: "USA",
    yearsOfOperation: "5",
    createdBy: "admin",
  },
  {
    name: "Agency 2",
    config: {
      status: "ACTIVE",
      requestStatus: "APPROVED"
    },
    contactPerson: "Alice Smith",
    agencyType: "LLP" as AgencyType,
    designation: "Director",
    phoneNumber: "2345678901",
    phoneCountryCode: "+91",
    ownerName: "Bob Smith",
    email: "agency2@example.com",
    companyPhone: "8765432109",
    companyPhoneCode: "+91",
    website: "https://agency2.com",
    landingPageColor: "#4ECDC4",
    gstRegistered: true,
    gstNumber: "GST234567",
    yearOfRegistration: "2019",
    panNumber: "PAN234567",
    panType: "COMPANY" as PanType,
    headquarters: "London",
    country: "UK",
    yearsOfOperation: "6",
    createdBy: "admin",
  },
  {
    name: "Agency 3",
    config: {
      status: "INACTIVE",
      requestStatus: "REJECTED"
    },
    contactPerson: "Charlie Brown",
    agencyType: "PROPRIETORSHIP" as AgencyType,
    designation: "CEO",
    phoneNumber: "3456789012",
    phoneCountryCode: "+91",
    ownerName: "Diana Brown",
    email: "agency3@example.com",
    companyPhone: "7654321098",
    companyPhoneCode: "+91",
    website: "https://agency3.com",
    landingPageColor: "#4ECDC4",
    gstRegistered: false,
    gstNumber: null,
    yearOfRegistration: "2021",
    panNumber: "PAN345678",
    panType: "INDIVIDUAL" as PanType,
    headquarters: "Sydney",
    country: "Australia",
    yearsOfOperation: "4",
    createdBy: "admin",
  },
  {
    name: "Agency 4",
    config: {
      status: "ACTIVE",
      requestStatus: "PENDING"
    },
    contactPerson: "Eve Wilson",
    agencyType: "PRIVATE_LIMITED" as AgencyType,
    designation: "COO",
    phoneNumber: "4567890123",
    phoneCountryCode: "+91",
    ownerName: "Frank Wilson",
    email: "agency4@example.com",
    companyPhone: "6543210987",
    companyPhoneCode: "+91",
    website: "https://agency4.com",
    landingPageColor: "#4ECDC4",
    gstRegistered: true,
    gstNumber: "GST456789",
    yearOfRegistration: "2018",
    panNumber: "PAN456789",
    panType: "COMPANY" as PanType,
    headquarters: "Toronto",
    country: "Canada",
    yearsOfOperation: "7",
    createdBy: "admin",
  },
]

export async function POST() {
  try {
    // Clear existing data
    await prisma.agencyForm.deleteMany()
    
    // Create new sample data
    const createdForms = []
    for (const formData of sampleAgencyForms) {
      const form = await prisma.agencyForm.create({
        data: formData,
      })
      createdForms.push(form)
    }

    return NextResponse.json({
      message: "Sample data created successfully",
      forms: createdForms,
    })
  } catch (error) {
    console.error("Error creating sample data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 