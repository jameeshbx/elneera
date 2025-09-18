// Service to fetch and manage CSV itinerary data
export interface ItineraryCSVData {
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
interface CSVRow {
  [key: string]: string;
}

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/quote%20ids%20-%20Sheet1-H02oNXiFdVfZJ9iJTVJWwQEDuns2wq.csv"

export async function fetchItineraryCSVData(): Promise<ItineraryCSVData[]> {
  try {
    const response = await fetch(CSV_URL)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const csvText = await response.text()
    return parseCSVData(csvText)
  } catch (error) {
    console.error("Error fetching CSV data:", error)
    throw new Error("Failed to fetch itinerary data from CSV")
  }
}

function parseCSVData(csvText: string): ItineraryCSVData[] {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const data: ItineraryCSVData[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    const row: CSVRow = {};

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

    const itineraryData: ItineraryCSVData = {
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

  return data
}

export function findItineraryByLocation(data: ItineraryCSVData[], location: string): ItineraryCSVData | null {
  // Try to match by name containing the location
  const match = data.find(
    (item) =>
      item.name.toLowerCase().includes(location.toLowerCase()) ||
      location.toLowerCase().includes(item.name.toLowerCase()),
  )

  return match || null
}

export function formatDayWiseItinerary(dayWiseActivities: { [key: string]: string }): Array<{
  day: number
  activities: string
}> {
  const days: Array<{ day: number; activities: string }> = []

  Object.keys(dayWiseActivities).forEach((key) => {
    const dayMatch = key.match(/day\s*(\d+)/i)
    if (dayMatch && dayWiseActivities[key]) {
      const dayNumber = Number.parseInt(dayMatch[1])
      days.push({
        day: dayNumber,
        activities: dayWiseActivities[key],
      })
    }
  })

  // Sort by day number
  return days.sort((a, b) => a.day - b.day)
}
