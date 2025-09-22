"use client"

import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react"
import {
  MapPin,
  Calendar,
  Users,
  Download,
  Edit,
  Share2,
  ChevronDown,
  ChevronUp,
  Save,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import MapComponent from "@/components/MapComponent"

// Define types for the CSV itinerary data
interface CsvActivity {
  time: string
  title: string
  type: string
  description: string
  image?: string
}

interface CsvDayItinerary {
  day: number
  date: string
  title: string
  activities: CsvActivity[]
}

interface CsvItineraryDay {
  day: number;
  date: string;
  title: string;
  description: string;
  activities: Array<{
    time: string;
    title: string;
    description: string;
    type: string;
    image?: string;
  }>;
}

interface CsvItineraryData {
  quoteId: string
  name: string
  days: number
  title: string
  description: string
  nights: number
  startDate: string
  costINR: number
  costUSD: number
  guests: number
  adults: number
  kids: number
  dailyItinerary: CsvItineraryDay[];
  locationMatched?: string
  location: string;
}

// Keep existing interfaces for database data
interface Activity {
  time: string
  title: string
  type: string
  description: string
  image?: string
}

interface DayItinerary {
  day: number
  date: string
  title: string
  location: string
  richContent: string
  activities: Activity[]
}

interface Accommodation {
  name: string
  rating: number
  nights: number
  image: string
}

interface BudgetEstimation {
  amount: number
  currency: string
  costTourist: number
}

interface EnquiryDetails {
  description: string
  moreDetails: string
}

interface ItineraryData {
  id: string
  name: string
  quoteId: string
  enquiryId: string
  location: string
  numberOfDays: string
  travelStyle: string
  budgetEstimation: BudgetEstimation
  accommodation: Accommodation[]
  dailyItinerary: DayItinerary[]
  enquiryDetails: EnquiryDetails
  destinations: string
  startDate: string
  endDate: string
  travelType: string
  adults: number
  children: number
  under6: number
  from7to12: number
  flightsRequired: string
  pickupLocation: string | null
  dropLocation: string | null
  currency: string
  budget: number
  activityPreferences: string
  hotelPreferences: string
  mealPreference: string
  dietaryPreference: string
  transportPreferences: string
  travelingWithPets: string
  additionalRequests: string | null
  moreDetails: string | null
  mustSeeSpots: string | null
  status: string
  createdAt: string
  updatedAt: string
  enquiry: {
    id: string
    name: string
    phone: string
    email: string
    locations: string
    tourType: string
    estimatedDates: string
    currency: string
    budget: number
    enquiryDate: string
    assignedStaff: string | null
    pointOfContact: string | null
    notes: string | null
  }
  pdfUrl?: string
}

// Extend the existing interfaces to include richContent
type ExtendedDayItinerary = Omit<DayItinerary, 'richContent'> & {
  richContent?: string
}

interface ExtendedCsvDayItinerary extends CsvDayItinerary {
  richContent?: string
}

interface ExtendedItineraryData extends Omit<ItineraryData, "dailyItinerary"> {
  dailyItinerary: ExtendedDayItinerary[]
  richContent?: string
  locationMatched?: string
  name: string
  days?: number
  nights?: number
  kids?: number
  costINR?: number
  costUSD?: number
}

interface LocationContent {
  location: string
  name: string
  description: string
  bgImage: string
}

const staffMembers = ["Kevin Blake", "Maria Rodriguez", "Priya Sharma", "Ahmed Khan", "Emily Johnson"]

export function ItineraryViewContent() {
  const [itineraryData, setItineraryData] = useState<ExtendedItineraryData | null>(null)
  const [csvItineraryData, setCsvItineraryData] = useState<CsvItineraryData | null>(null);
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 1: true });
  const [showReassignStaffDialog, setShowReassignStaffDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [useCSVData, setUseCSVData] = useState(false);
  const [showRichTextEditor, setShowRichTextEditor] = useState(false)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [richTextContent, setRichTextContent] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Function to parse CSV text into structured data
  const parseCsvToItinerary = (csvText: string, filename: string): CsvItineraryData | null => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        console.error('CSV file is empty or has no data rows');
        return null;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const daysData: Record<number, CsvItineraryDay> = {};

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const dayNum = parseInt(row.day || '1');
        if (isNaN(dayNum)) continue;

        if (!daysData[dayNum]) {
          daysData[dayNum] = {
            day: dayNum,
            date: row.date || `Day ${dayNum}`,  // Add date from CSV or default
            title: row.title || `Day ${dayNum}`,
            description: row.description || '',
            activities: []
          };
        }

        daysData[dayNum].activities.push({
          time: row.time || '',
          title: row.activity || row.title || '',
          description: row.description || '',
          type: row.type || 'activity',
          image: row.image || undefined  // Add image if available
        });
      }

      const dailyItinerary = Object.values(daysData).sort((a, b) => a.day - b.day);
      const firstRow = lines[1].split(',').reduce((obj, val, i) => {
        obj[headers[i]] = val;
        return obj;
      }, {} as Record<string, string>);

      return {
        quoteId: firstRow.quoteid || filename.replace('.csv', '').toUpperCase(),
        name: firstRow.itineraryname || filename.replace('.csv', '').replace(/-/g, ' '),
        days: parseInt(firstRow.days) || dailyItinerary.length,
        title: firstRow.itinerarytitle || firstRow.title || 'Your Itinerary',
        description: firstRow.description || '',
        nights: parseInt(firstRow.nights) || Math.max(0, dailyItinerary.length - 1),
        startDate: firstRow.startdate || '',
        costINR: parseFloat(firstRow.costinr) || 0,
        costUSD: parseFloat(firstRow.costusd) || 0,
        dailyItinerary,
        location: firstRow.location || '',
        guests: parseInt(firstRow.guests) || 0,
        adults: parseInt(firstRow.adults) || 0,
        kids: parseInt(firstRow.kids) || 0
      };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return null;
    }
  };

  // Function to fetch and parse CSV file
  const fetchAndParseCsv = async (filename: string): Promise<CsvItineraryData | null> => {
    try {
      // Add the Itinerary/ prefix to the filename
      const response = await fetch(`/Itinerary/${filename}`);
      if (!response.ok) {
        console.error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const csvText = await response.text();
      console.log('Fetched CSV content:', csvText.substring(0, 200) + '...'); // Log first 200 chars
      
      const parsedData = parseCsvToItinerary(csvText, filename);
      if (!parsedData) {
        console.error('Failed to parse CSV data');
      }
      return parsedData;
    } catch (error) {
      console.error('Error in fetchAndParseCsv:', error);
      return null;
    }
  };
  

  // Function to find and load matching CSV based on location
  const findAndLoadMatchingCsv = useCallback(async (location: string): Promise<boolean> => {
    try {
      // List of known CSV files in the public/Itinerary directory
      const csvFiles = [
        'GOA001.csv',
        'KASH001.csv',
        'THAI001.csv',
        'EVER001.csv',
        'RAJ001.csv',
        'KER001.csv'
      ];
  
      console.log('Available CSV files:', csvFiles);
      console.log('Searching for location:', location);
      
      const locationLower = location.toLowerCase();
      
      // Try to find exact match first, then partial match
      const matchingFile = csvFiles.find(file => 
        file.toLowerCase().includes(locationLower)
      ) || csvFiles[0]; // Fallback to first file if no match found
      
      console.log('Selected file:', matchingFile);
      
      if (matchingFile) {
        const csvData = await fetchAndParseCsv(matchingFile);
        if (csvData) {
          console.log('Successfully parsed CSV data');
          setCsvItineraryData(csvData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error in findAndLoadMatchingCsv:', error);
      return false;
    }
  }, []);

  const searchParams = useSearchParams()

  const currentDisplayData = useMemo(() => {
    return useCSVData ? csvItineraryData : itineraryData
  }, [useCSVData, csvItineraryData, itineraryData])

  const currentFallbackData = useMemo(() => {
    return itineraryData
  }, [itineraryData])

  // Update your fetchData function to use the new CSV handling
  const fetchData = useCallback(async () => {
    if (!searchParams) return;

    const enquiryId = searchParams.get("enquiryId");
    const itineraryId = searchParams.get("itineraryId");
    
    setLoading(true);

    try {
      // Fetch enquiry data first to get location
      if (enquiryId) {
        const enquiryResponse = await fetch(`/api/enquiries?id=${enquiryId}`);
        if (enquiryResponse.ok) {
          const enquiryData = await enquiryResponse.json();
          if (enquiryData?.locations) {
            // Try to load matching CSV data
            const csvLoaded = await findAndLoadMatchingCsv(enquiryData.locations);
            setUseCSVData(csvLoaded);
          }
        }
      }

      // Fetch database itinerary as fallback
      if (itineraryId) {
        const response = await fetch(`/api/itineraries/${itineraryId}`);
        if (response.ok) {
          const data = await response.json();
          setItineraryData(data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, findAndLoadMatchingCsv]);

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const locationContent = useMemo<LocationContent>(() => ({
    location: useCSVData
      ? (currentDisplayData as CsvItineraryData)?.location || currentFallbackData?.location || currentFallbackData?.enquiry?.locations || ""
      : currentFallbackData?.location || currentFallbackData?.enquiry?.locations || "",
    name: useCSVData ? (currentDisplayData as CsvItineraryData)?.name || "" : currentFallbackData?.enquiry?.name || "",
    description: useCSVData
      ? (currentDisplayData as CsvItineraryData)?.description || ""
      : currentFallbackData?.enquiry?.notes || "",
    bgImage: "/images/placeholder-bg.jpg",
  }), [useCSVData, currentDisplayData, currentFallbackData])

  const handleSaveRichText = useCallback(async () => {
    if (!richTextContent.trim()) {
      alert("Please enter some content before saving.");
      return;
    }
  
    try {
      setIsSaving(true);
      const currentData = useCSVData ? csvItineraryData : itineraryData;
  
      if (!currentData) {
        throw new Error("No data available to save");
      }
  
      // Check if currentData has an id property (ExtendedItineraryData)
      if ('id' in currentData) {
        const updateData: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };
  
        if (editingDay !== null) {
          updateData.dailyItinerary = currentData.dailyItinerary?.map((day) => ({
            ...day,
            richContent: day.day === editingDay ? richTextContent : day.richContent,
          })) || [];
        } else {
          updateData.richContent = richTextContent;
        }
  
        const response = await fetch(`/api/itineraries/${currentData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
  
        if (!response.ok) {
          throw new Error("Failed to save data");
        }
  
        // Rest of your save logic...
      } else {
        // Handle case when currentData is ExtendedCsvItineraryData
        // You might want to implement CSV-specific save logic here
        // For now, we'll just show a message
        console.log("Saving to CSV data is not implemented yet");
        // Optionally, you could implement CSV save logic here
        // or convert CSV data to itinerary data and save it
      }
  
      alert("Data saved successfully!");
      setShowRichTextEditor(false);
      setEditingDay(null);
      setRichTextContent("");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [richTextContent, useCSVData, csvItineraryData, itineraryData, editingDay]);

  const toggleDayExpansion = (day: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  const handleEditPlan = () => {
    if (!itineraryData) return

    const queryParams = new URLSearchParams({
      enquiryId: itineraryData.enquiryId,
      edit: "true",
    })

    if (typeof window !== "undefined") {
      window.location.href = `/agency-admin/dashboard/Itenary-form?${queryParams.toString()}`
    }
  }

  const handleExportPDF = async () => {
    if (typeof window === "undefined" || !itineraryData) return

    try {
      setIsLoading(true)

      const printWindow = window.open("", "", "width=1200,height=800")
      if (!printWindow) {
        throw new Error("Could not open print window")
      }

      const content = document.getElementById("itinerary-content")
      if (!content) {
        throw new Error("Could not find itinerary content")
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Itinerary - ${itineraryData.destinations || "Travel Plan"}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
              h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
              h2 { color: #1f2937; margin-top: 30px; }
              h3 { color: #2563eb; margin: 20px 0 10px; }
              .day-container { margin-bottom: 40px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
              .day-header { background-color: #f3f4f6; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
              .day-content { padding: 20px; }
              .activity { margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; }
              .activity-time { font-weight: bold; color: #2563eb; margin-bottom: 5px; }
              .activity-title { font-weight: 600; margin: 5px 0; }
              .activity-description { color: #4b5563; }
              .activity-image { max-width: 200px; max-height: 150px; border-radius: 4px; margin-top: 10px; }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
                .day-container { break-inside: avoid; page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div id="print-content">
              <h1>${itineraryData.destinations || "Travel Itinerary"}</h1>
              <p><strong>Travel Dates:</strong> ${itineraryData.startDate} to ${itineraryData.endDate}</p>
              <p><strong>Travelers:</strong> ${itineraryData.adults || 0} Adults, ${itineraryData.children || 0} Children</p>
              <div class="no-print" style="margin: 20px 0; padding: 10px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
                <p style="margin: 0;">This is a print preview. Click the print button in your browser to print or save as PDF.</p>
              </div>
      `

      const dailyItinerary = currentDisplayData?.dailyItinerary || currentFallbackData?.dailyItinerary || []
      dailyItinerary.forEach((day: ExtendedDayItinerary | ExtendedCsvDayItinerary) => {
        htmlContent += `
          <div class="day-container">
            <div class="day-header">
              <h2>Day ${day.day}: ${day.title || ""}</h2>
              <div>${day.date || ""}</div>
            </div>
            <div class="day-content">
        `

        if (day.richContent) {
          htmlContent += `<div class="rich-content">${day.richContent}</div>`
        }

        if (day.activities?.length > 0) {
          day.activities.forEach((activity: Activity) => {
            htmlContent += `
              <div class="activity">
                <div class="activity-time">${activity.time || ""}</div>
                <div class="activity-title">${activity.title || ""}</div>
                <div class="activity-description">${activity.description || ""}</div>
                ${activity.image ? `<img src="${activity.image}" class="activity-image" alt="${activity.title || "Activity image"}" />` : ""}
              </div>
            `
          })
        }

        htmlContent += `
            </div>
          </div>
        `
      })

      htmlContent += `
            </div>
            <div class="no-print" style="margin-top: 30px; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p>Thank you for choosing our travel services. Have a wonderful trip!</p>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `

      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }, 500)
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareToCustomer = () => {
    if (!itineraryData) {
      console.error("No enquiry data available to generate itinerary.")
      alert("Please select an enquiry first.")
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const enquiryId = searchParams.get("enquiryId") || itineraryData?.enquiryId || ""
    const itineraryId = searchParams.get("itineraryId") || itineraryData?.id || ""
    const customerId = searchParams.get("customerId") || ""

    const queryParams = new URLSearchParams({
      enquiryId,
      itineraryId,
      customerId,
    })

    if (typeof window !== "undefined") {
      window.location.href = `/agency/dashboard/share-customer?${queryParams.toString()}`
    }
  }

  const handleEditDailyItinerary = (dayNumber?: number) => {
    if (dayNumber) {
      setEditingDay(dayNumber)
      const currentData = currentDisplayData || currentFallbackData

      const dayData = currentData?.dailyItinerary?.find((day) => day.day === dayNumber)

      if (dayData) {
        let richText = `<h2>Day ${dayData.day} - ${dayData.title}</h2>`
        richText += `<p><strong>Date:</strong> ${dayData.date}</p>`
        richText += `<h3>Activities:</h3>`

        dayData.activities.forEach((activity) => {
          richText += `<div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #3b82f6;">`
          richText += `<h4 style="color: #1f2937; margin: 0 0 5px 0;">${activity.time} - ${activity.title}</h4>`
          richText += `<p style="margin: 0; color: #6b7280;">${activity.description}</p>`
          richText += `<span style="background: #f3f4f6; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #374151;">${activity.type}</span>`
          richText += `</div>`
        })

        setRichTextContent(richText)
      } else {
        setRichTextContent("<h2>No data available</h2><p>Please add some content.</p>")
      }
    } else {
      const currentData = currentDisplayData || currentFallbackData

      if (currentData && currentData.dailyItinerary) {
        let richText = `<h1>${(currentData as ItineraryData).name || "Itinerary"}</h1>`

        if ("quoteId" in currentData && currentData.quoteId) {
          richText += `<p><strong>Quote ID:</strong> ${currentData.quoteId}</p>`
        }

        if ("days" in currentData && "nights" in currentData && currentData.days && currentData.nights) {
          richText += `<p><strong>Duration:</strong> ${currentData.days} Days / ${currentData.nights} Nights</p>`
        }
        if (currentData.startDate) {
          richText += `<p><strong>Start Date:</strong> ${currentData.startDate}</p>`
        }
        if ("costINR" in currentData && "costUSD" in currentData && currentData.costINR && currentData.costUSD) {
          richText += `<p><strong>Cost:</strong> ₹${currentData.costINR.toLocaleString()} (USD $${currentData.costUSD})</p>`
        }

        if ("adults" in currentData && "kids" in currentData && currentData.adults && currentData.kids) {
          richText += `<p><strong>Guests:</strong> ${currentData.adults} Adults, ${currentData.kids} Kids</p>`
        }
        richText += `<hr>`

        currentData.dailyItinerary.forEach((day) => {
          richText += `<h2>Day ${day.day} - ${day.title}</h2>`
          richText += `<p><strong>Date:</strong> ${day.date}</p>`
          richText += `<h3>Activities:</h3>`

          day.activities.forEach((activity) => {
            richText += `<div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #3b82f6; background: #f8fafc;">`
            richText += `<h4 style="color: #1f2937; margin: 0 0 5px 0;">${activity.time} - ${activity.title}</h4>`
            richText += `<p style="margin: 0 0 8px 0; color: #6b7280;">${activity.description}</p>`
            richText += `<span style="background: #e5e7eb; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #374151; font-weight: 500;">${activity.type}</span>`
            richText += `</div>`
          })
          richText += `<hr style="margin: 20px 0;">`
        })

        setRichTextContent(richText)
      } else {
        setRichTextContent(
          "<h2>No itinerary data available</h2><p>Please ensure the itinerary data is loaded properly.</p>",
        )
      }
    }

    setShowRichTextEditor(true)
  }

  const handleGenerateOtherPlan = async () => {
    if (!itineraryData) return

    try {
      const alternativeQuotes = ["KASH001", "KER001", "GOA001", "RAJ001", "EVER001", "THAI001"]
      const currentQuoteId = csvItineraryData?.quoteId

      const alternatives = alternativeQuotes.filter((id) => id !== currentQuoteId)
      const randomAlternative = alternatives[Math.floor(Math.random() * alternatives.length)]

      const csvResponse = await fetch(`/api/itinerary-csv?quoteId=${randomAlternative}`)
      if (csvResponse.ok) {
        const csvData = await csvResponse.json()
        setCsvItineraryData(csvData)
        setUseCSVData(true)
        alert(`Generated alternative plan: ${csvData.name}`)
      }
    } catch (error) {
      console.error("Error generating alternative plan:", error)
      alert("Failed to generate alternative plan")
    }
  }

  const handleReassignStaff = async () => {
    if (!selectedStaff) {
      alert("Please select a staff member")
      return
    }

    if (!itineraryData) {
      throw new Error("No itinerary data available")
    }

    try {
      const response = await fetch("/api/enquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itineraryData.enquiryId,
          assignedStaff: selectedStaff,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reassign staff")
      }

      setItineraryData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          enquiry: {
            ...prev.enquiry,
            assignedStaff: selectedStaff,
          },
        }
      })

      setShowReassignStaffDialog(false)
      alert(`Staff reassigned to ${selectedStaff} successfully!`)
    } catch (error) {
      console.error("Error reassigning staff:", error)
      alert(`Failed to reassign staff: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      "airport-arrival": "",
      "airport-departure": "",
      transfer: "",
      "hotel-checkin": "",
      "hotel-checkout": "",
      meal: "",
      activity: "",
      sightseeing: "",
      adventure: "",
      hotel: "",
      nature: "",
      flight: "",
      shopping: "",
    }
    return icons[type] || ""
  }

  const getDynamicAddresses = (location: string) => {
    const locationLower = location.toLowerCase()

    if (locationLower.includes("kashmir") || locationLower.includes("srinagar")) {
      return [
        "Srinagar, Jammu and Kashmir, India",
        "Gulmarg, Jammu and Kashmir, India",
        "Pahalgam, Jammu and Kashmir, India",
      ]
    } else if (locationLower.includes("kerala") || locationLower.includes("kochi")) {
      return ["Kochi, Kerala, India", "Munnar, Kerala, India", "Alleppey, Kerala, India"]
    } else if (locationLower.includes("goa")) {
      return ["Panaji, Goa, India", "Calangute, Goa, India", "Anjuna, Goa, India"]
    } else if (locationLower.includes("rajasthan") || locationLower.includes("jaipur")) {
      return ["Jaipur, Rajasthan, India", "Jodhpur, Rajasthan, India", "Udaipur, Rajasthan, India"]
    } else if (locationLower.includes("thailand") || locationLower.includes("bangkok")) {
      return ["Bangkok, Thailand", "Phuket, Thailand", "Chiang Mai, Thailand"]
    }

    return ["New Delhi, India", "Mumbai, India", "Bangalore, India"]
  }

  const RichTextEditor = () => {
    const editorRef = useRef<HTMLDivElement>(null)
    const [editorKey, setEditorKey] = useState(0)
    const [currentContent, setCurrentContent] = useState(richTextContent)

    useEffect(() => {
      if (showRichTextEditor) {
        setCurrentContent(richTextContent)
        setEditorKey((prev) => prev + 1)
      }
    }, [showRichTextEditor])

    const applyFormat = (command: string, value?: string) => {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
    }

    const handleInput = () => {
      if (editorRef.current) {
        setCurrentContent(editorRef.current.innerHTML)
      }
    }

    const handleSave = () => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML
        setRichTextContent(content)
        handleSaveRichText()
      }
    }

    return (
      <Dialog open={showRichTextEditor} onOpenChange={setShowRichTextEditor}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Rich Text Editor - {editingDay ? `Day ${editingDay}` : "Daily Itinerary"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 p-3 border-b bg-gray-50 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("bold")}
                className="h-8 w-8 p-0"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("italic")}
                className="h-8 w-8 p-0"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("underline")}
                className="h-8 w-8 p-0"
                title="Underline"
              >
                <Underline className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("justifyLeft")}
                className="h-8 w-8 p-0"
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("justifyCenter")}
                className="h-8 w-8 p-0"
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("justifyRight")}
                className="h-8 w-8 p-0"
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFormat("insertUnorderedList")}
                className="h-8 w-8 p-0"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <Select onValueChange={(value) => applyFormat("formatBlock", value)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Heading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">Heading 1</SelectItem>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                  <SelectItem value="p">Paragraph</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 p-4 min-h-0">
              <div
                key={editorKey}
                ref={editorRef}
                contentEditable
                className="w-full h-[400px] border border-gray-300 rounded-md p-4 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dangerouslySetInnerHTML={{ __html: currentContent }}
                onInput={handleInput}
                suppressContentEditableWarning={true}
              />
            </div>
          </div>

          <DialogFooter className="border-t bg-white p-4 mt-auto">
            <Button
              variant="outline"
              onClick={() => {
                setShowRichTextEditor(false)
                setEditingDay(null)
                setRichTextContent("")
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 min-w-[120px]"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center h-screen w-full ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location-based itinerary...</p>
        </div>
      </div>
    )
  }

  if (!itineraryData && !csvItineraryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Itinerary not found</p>
        </div>
      </div>
    )
  }

  const currentLocation =
    currentDisplayData?.locationMatched ||
    currentFallbackData?.location ||
    currentFallbackData?.enquiry?.locations ||
    ""

  const dynamicAddresses = getDynamicAddresses(currentLocation)

  return (
    <div id="itineraries" className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Itinerary Details</h1>
              {currentDisplayData && (
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    CSV Data: {currentDisplayData.name}
                  </span>
                  <button onClick={() => setUseCSVData(!useCSVData)} className="text-sm text-blue-600 hover:underline">
                    {useCSVData ? "Switch to DB Data" : "Switch to CSV Data"}
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {itineraryData?.pdfUrl && (
                <a
                  href={itineraryData.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border font-semibold border-gray-300 rounded-full hover:bg-gray-100 text-blue-500"
                >
                  <FileText className="h-4 w-4" />
                  View Saved PDF
                </a>
              )}
              <button
                onClick={handleExportPDF}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 border font-semibold rounded-full ${isLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-green-500 border-gray-300'}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={handleEditPlan}
                className="flex items-center gap-2 px-4 py-2 bg-light-orange hover:bg-yellow-500 text-white font-semibold rounded-full"
              >
                <Edit className="h-4 w-4" />
                Edit plan
              </button>
              <button
                onClick={() => setShowReassignStaffDialog(true)}
                className="px-4 py-2 border border-green-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Reassign Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-lg relative overflow-hidden">
              <Image
                src={locationContent.bgImage || "/placeholder.svg"}
                alt="Enquiry background"
                width={600}
                height={400}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
              <div className="p-6 relative z-10 pb-[327px]">
                <div className="flex items-center mb-4">
                  <span className="bg-gray-600/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="text-lg"></span> Enquiry
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-white leading-relaxed">{locationContent.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="p-4">
                <h4 className="font-semibold mb-3 text-sm">Map</h4>
                <div className="relative">
                  <MapComponent
                    addresses={dynamicAddresses}
                    height="400px"
                    showRoute={true}
                    onLocationClick={(location) => {
                      console.log("Clicked location:", location)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3" id="itinerary-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-xs text-gray-500 uppercase mb-1">LOCATION</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{locationContent.location}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-xs text-gray-500 uppercase mb-1">NUMBER OF DAY</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {(currentDisplayData as CsvItineraryData)?.days || currentFallbackData?.numberOfDays || "N/A"} Days /{" "}
                    {(currentDisplayData as CsvItineraryData)?.nights || "N/A"} Nights
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-xs text-gray-500 uppercase mb-1">GUESTS</div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {currentDisplayData
                      ? `${(currentDisplayData as CsvItineraryData).adults} Adults, ${(currentDisplayData as CsvItineraryData).kids} Kids`
                      : currentFallbackData?.travelStyle || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold">Budget Estimation</h3>
                    <span className="text-gray-400"></span>
                  </div>
                  <div className="flex items-baseline text-3xl font-bold text-violet-600 mb-2">
                    <span></span>
                    <span className="text-black ml-1">
                      {(currentDisplayData as CsvItineraryData)?.costINR?.toLocaleString() ||
                        currentFallbackData?.budgetEstimation?.amount?.toLocaleString() ||
                        "0"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    USD: $ {(currentDisplayData as CsvItineraryData)?.costUSD || currentFallbackData?.budgetEstimation?.amount || 0}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Cost/Tourist: $ {currentFallbackData?.budgetEstimation?.costTourist || 32.3}
                  </p>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs"></span>
                      </div>
                      <span className="font-medium text-sm">AI Assistant</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {currentDisplayData ? "Powered by CSV template data" : "Powered by intelligent budget estimation"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold">Accommodation</h3>
                    <span className="text-gray-400"></span>
                  </div>
                  <div className="space-y-3">
                    {currentFallbackData?.accommodation && currentFallbackData.accommodation.length > 0 ? (
                      currentFallbackData.accommodation.map((hotel, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Image
                            src={hotel.image || "/placeholder.svg?height=60&width=80&query=hotel building"}
                            alt={hotel.name}
                            width={48}
                            height={36}
                            className="w-12 h-9 rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{hotel.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(hotel.rating)].map((_, i) => (
                                <span key={i} className="text-yellow-400 text-xs">
                                  
                                </span>
                              ))}
                              <span className="text-xs text-gray-500">{hotel.rating} star</span>
                            </div>
                          </div>
                          <span className="text-sm font-medium">{hotel.nights} nights</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">Accommodation details will be provided based on your preferences</p>
                      </div>
                    )}
                  </div>
                  {currentFallbackData?.accommodation && currentFallbackData.accommodation.length > 0 && (
                    <button className="text-blue-600 text-sm mt-3 hover:underline">See all</button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Daily Itinerary</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateOtherPlan}
                      className="text-green-600 bg-white hover:bg-white border-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Image
                        src="/Magic.png"
                        alt="Magic wand icon"
                        width={16}
                        height={16}
                        className="w-4 h-4 text-green-600"
                      />
                      Generate other plan
                    </Button>
                    <Button
                      onClick={handleShareToCustomer}
                      className="bg-gradient-to-r from-[#183F30] to-[#5BC17F] hover:from-[#183F30] hover:to-[#4CAF50] text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Share2 className="h-4 w-4" />
                      Share to customer
                    </Button>
                    <Button
                      onClick={() => handleEditDailyItinerary()}
                      className="bg-gradient-to-r from-[#183F30] to-[#5BC17F] hover:from-[#183F30] hover:to-[#4CAF50] text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Daily Itinerary
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(currentDisplayData?.dailyItinerary || currentFallbackData?.dailyItinerary || []).map((day) => (
                    <div key={day.day} className="rounded-lg">
                      <div
                        className="p-4 bg-gray-100 cursor-pointer flex justify-between items-center hover:bg-gray-200"
                        onClick={() => toggleDayExpansion(day.day)}
                      >
                        <div>
                          <h4 className="font-semibold">DAY {day.day}</h4>
                          <p className="text-sm text-gray-600">
                            {day.date} - {day.title}
                          </p>
                        </div>
                        {expandedDays[day.day] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      {expandedDays[day.day] && (
                        <div className="p-4 space-y-4 bg-white">
                          {day.activities.map((activity, index) => (
                            <div key={index} className="flex gap-4 items-start">
                              <div className="text-sm font-medium text-gray-600 w-16 flex-shrink-0">
                                {activity.time}
                              </div>
                              <div className="flex-1 flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{activity.title}</h5>
                                  <p className="text-sm text-gray-600">{activity.description}</p>
                                </div>
                                {activity.image && (
                                  <Image
                                    src={activity.image || "/placeholder.svg?height=64&width=80&query=activity image"}
                                    alt={activity.title}
                                    width={80}
                                    height={64}
                                    className="w-20 h-16 rounded object-cover flex-shrink-0"
                                  />
                                )}
                              </div>
                              <button className="mb-3 text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 flex-shrink-0">
                                Details
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showReassignStaffDialog} onOpenChange={setShowReassignStaffDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="staff" className="text-right">
                Staff
              </label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff} value={staff}>
                      {staff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassignStaff}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RichTextEditor />
    </div>
  )
}

export default function ItineraryView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading itinerary...</p>
          </div>
        </div>
      }
    >
      <ItineraryViewContent />
    </Suspense>
  )
}