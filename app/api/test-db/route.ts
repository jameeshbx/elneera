// Simple test API to verify database connectivity
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("=== Database Test API Started ===")
    
    // Test database connection
    await prisma.$connect()
    
    // Check total count of itineraries
    const count = await prisma.itineraries.count();
    
    // Get first 5 itineraries
    const itineraries = await prisma.itineraries.findMany({
      take: 5,
      select: {
        id: true,
        enquiryId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customerId: true,
        pdfUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Test DMCForm table
    let dmcCount = 0
    try {
      dmcCount = await prisma.dMCForm.count()
      console.log(`✅ DMCForm table accessible with ${dmcCount} records`)
    } catch (error) {
      console.error("❌ DMCForm table error:", error)
      return NextResponse.json({
        success: false,
        error: "DMCForm table not accessible",
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 })
    }
    
    // Test SharedDMC table
    let sharedCount = 0
    try {
      sharedCount = await prisma.sharedDMC.count()
      console.log(`✅ SharedDMC table accessible with ${sharedCount} records`)
    } catch (error) {
      console.error("❌ SharedDMC table error:", error)
      // This is expected to fail if table doesn't exist
    }
    
    return NextResponse.json({
      success: true,
      message: "Database connection test successful",
      data: {
        dmcCount,
        sharedCount,
        connectionStatus: "OK",
        itinerariesCount: count,
        sampleItineraries: itineraries,
      }
    })
    
  } catch (error) {
    console.error("=== Database Test API Error ===", error)
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
    console.log("=== Database Test API Completed ===")
  }
}
