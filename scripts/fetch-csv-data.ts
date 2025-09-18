// Script to fetch and parse CSV data for itinerary generation
const csvUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/quote%20ids%20-%20Sheet1-H02oNXiFdVfZJ9iJTVJWwQEDuns2wq.csv"

interface ItineraryData {
  name: string
  days: string
  nights: string
  startDate: string
  costINR: string
  costUSD: string
  guests: string
  adults: string
  kids: string
  dayWiseActivities: { [key: string]: string }
}

async function fetchCSVData(): Promise<ItineraryData[]> {
  try {
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    // Parse CSV manually
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    const data: ItineraryData[] = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue

      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      // Extract day-wise activities
      const dayWiseActivities: { [key: string]: string } = {}
      Object.keys(row).forEach((key) => {
        if (key.toLowerCase().includes("day") && row[key]) {
          dayWiseActivities[key] = row[key]
        }
      })

      const itineraryData: ItineraryData = {
        name: row.name || "",
        days: row.days || "",
        nights: row.nights || "",
        startDate: row.startDate || "",
        costINR: row.costINR || "",
        costUSD: row.costUSD || "",
        guests: row.gusts || row.guests || "", // Handle typo in CSV
        adults: row.adults || "",
        kids: row.kids || "",
        dayWiseActivities,
      }

      data.push(itineraryData)
    }

    console.log("Fetched CSV data:", JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error("Error fetching CSV data:", error)
    return []
  }
}

// Execute the function
fetchCSVData()
