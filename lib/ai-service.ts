import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model configuration
const MODELS = {
  standard: "gpt-3.5-turbo-0125",
  premium: "gpt-4-turbo",
} as const

// Cost per million tokens (approximate)
const COSTS = {
  "gpt-3.5-turbo-0125": { input: 0.50, output: 1.50 },
  "gpt-4-turbo": { input: 10.00, output: 30.00 },
} as const

// User tier type
export type UserTier = "premium" | "standard"

// Get AI model based on user tier
export function getAIModel(userTier: UserTier): string {
  switch (userTier) {
    case "premium":
      return MODELS.premium
    case "standard":
      return MODELS.standard
    default:
      return MODELS.standard
  }
}

// Get max tokens based on user tier
function getMaxTokensForTier(userTier: UserTier): number {
  const tokenLimits = {
    standard: 2000, // ~1500 words
    premium: 4000, // ~3000 words
  }
  return tokenLimits[userTier] || 2000
}

// Calculate cost based on usage
function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: string): number {
  const costPerMillion = COSTS[model as keyof typeof COSTS]
  if (!costPerMillion) return 0

  const inputCost = (usage.prompt_tokens / 1000000) * costPerMillion.input
  const outputCost = (usage.completion_tokens / 1000000) * costPerMillion.output

  return parseFloat((inputCost + outputCost).toFixed(6))
}

// Format date to "DD MMM YY" format
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear().toString().slice(-2)
  return `${day} ${month} ${year}`
}

// Build itinerary prompt
function buildItineraryPrompt(preferences: {
  destinations: string
  startDate: string
  endDate: string
  travelType: string
  adults: number
  children: number
  under6: number
  from7to12: number
  budget: number
  currency: string
  activityPreferences: string
  hotelPreferences: string
  mealPreference: string
  dietaryPreference: string
  transportPreferences: string
  travelingWithPets: string
  additionalRequests?: string | null
  moreDetails?: string | null
  mustSeeSpots?: string | null
  pickupLocation?: string | null
  dropLocation?: string | null
  flightsRequired?: string
}) {
  // Calculate number of days
  const startDate = new Date(preferences.startDate)
  const endDate = new Date(preferences.endDate)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Calculate dates for each day
  const dateStrings: string[] = []
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    dateStrings.push(formatDate(currentDate))
  }

  const systemPrompt = `You are an expert travel planner specializing in creating detailed, realistic itineraries. Create comprehensive travel itineraries that consider:
- Budget constraints and local costs
- Travel time between locations
- Logical daily flow and pacing
- Local customs and best practices
- Weather and seasonal considerations
- Age-appropriate activities for children
- Dietary restrictions and preferences

IMPORTANT: Use these exact dates for each day:
${dateStrings.map((date, idx) => `Day ${idx + 1}: ${date}`).join("\n")}

CRITICAL FOR GEO DATA: For every activity that involves a specific location, you MUST include a "location" field with the FULL address including city, state/region, and country. This is essential for accurate map display.

Examples of proper location format:
- "Dublin, County Dublin, Ireland" (NOT just "Dublin")
- "Cork, County Cork, Ireland" (NOT just "Cork")
- "Srinagar, Jammu and Kashmir, India"
- "Kochi, Kerala, India"
- "Jaipur, Rajasthan, India"

Always respond with valid JSON matching this exact schema:

{
  "dailyItinerary": [
    {
      "day": number (starting from 1),
      "date": "string (format: DD MMM YY, e.g., '15 Mar 25') - MUST match the dates provided above",
      "title": "string (e.g., 'Day 1 - Arrival and Exploration')",
      "activities": [
        {
          "time": "string (format: 'HH:MM AM/PM', e.g., '8:00 AM')",
          "title": "string",
          "type": "SIGHTSEEING|ACTIVITY|MEAL|TRANSPORT|REST|ADVENTURE|HOTEL_CHECKIN|HOTEL_CHECKOUT",
          "description": "string (detailed description of the activity)",
          "location": "string (REQUIRED for activities with specific locations - format: 'City, State/Region, Country' or 'City, Country' if no state/region. Use full geographic context to avoid ambiguity. For example, if destination is Ireland, use 'Dublin, County Dublin, Ireland' not just 'Dublin')"
        }
      ]
    }
  ],
  "accommodation": [
    {
      "name": "string (hotel/resort name)",
      "rating": number (1-5),
      "nights": number,
      "image": "string (placeholder image URL like '/placeholder-hotel.jpg' or description)",
      "location": "string (REQUIRED - full address with city, state/region, and country)"
    }
  ],
  "budgetEstimation": {
    "amount": number,
    "currency": "string",
    "costTourist": number
  }
}

LOCATION FIELD RULES:
1. ALWAYS include country in the location field
2. Include state/region/province when applicable (e.g., "County Dublin", "Jammu and Kashmir", "Kerala")
3. For transport activities (airports, stations), include the full location
4. For meals at restaurants, include the restaurant location if it's a specific place
5. For generic activities without a specific location, you may omit the location field
6. Use the destination country/region from the user's request as the primary geographic context

Keep descriptions concise but informative. Ensure activities are realistic and consider travel time between locations. Include breakfast, lunch, and dinner at appropriate times.`

  // Extract country/region from destinations for better context
  const extractCountryContext = (destinations: string): string => {
    const lowerDest = destinations.toLowerCase();
    if (lowerDest.includes("ireland") || lowerDest.includes("dublin") || lowerDest.includes("cork")) {
      return "Ireland";
    }
    if (lowerDest.includes("india") || lowerDest.includes("kashmir") || lowerDest.includes("kerala") || lowerDest.includes("rajasthan")) {
      return "India";
    }
    if (lowerDest.includes("thailand") || lowerDest.includes("bangkok") || lowerDest.includes("phuket")) {
      return "Thailand";
    }
    if (lowerDest.includes("spain") || lowerDest.includes("barcelona") || lowerDest.includes("madrid")) {
      return "Spain";
    }
    if (lowerDest.includes("france") || lowerDest.includes("paris") || lowerDest.includes("nice")) {
      return "France";
    }
    // Default fallback
    return destinations.split(",").pop()?.trim() || "the destination country";
  };

  const countryContext = extractCountryContext(preferences.destinations);

  const userPrompt = `Create a ${days}-day itinerary for ${preferences.destinations}.

PRIMARY GEOGRAPHIC CONTEXT: All locations should be in ${countryContext}. When specifying locations, ALWAYS include the full address format: "City, State/Region, ${countryContext}" to ensure accurate geocoding.

TRAVELER PROFILE:
- Group: ${preferences.adults} adults, ${preferences.children} children (${preferences.under6} under 6, ${preferences.from7to12} aged 7-12)
- Travel Type: ${preferences.travelType}
- Budget: ${preferences.budget} ${preferences.currency}
- Start Date: ${preferences.startDate}
- End Date: ${preferences.endDate}

PREFERENCES:
- Activities: ${preferences.activityPreferences || "None specified"}
- Hotel: ${preferences.hotelPreferences || "No preference"}
- Meals: ${preferences.mealPreference || "No preference"}
- Dietary: ${preferences.dietaryPreference || "No restrictions"}
- Transport: ${preferences.transportPreferences || "No preference"}
- Flights Required: ${preferences.flightsRequired || "no"}
- Traveling with Pets: ${preferences.travelingWithPets || "no"}

SPECIAL REQUIREMENTS:
${preferences.mustSeeSpots ? `- Must-see spots: ${preferences.mustSeeSpots}` : ""}
${preferences.additionalRequests ? `- Additional requests: ${preferences.additionalRequests}` : ""}
${preferences.moreDetails ? `- More details: ${preferences.moreDetails}` : ""}
${preferences.pickupLocation ? `- Pickup: ${preferences.pickupLocation}` : ""}
${preferences.dropLocation ? `- Drop: ${preferences.dropLocation}` : ""}

IMPORTANT: For every activity with a specific location, include the "location" field with the FULL address including city, state/region (if applicable), and country. This ensures accurate map display. For example:
- If visiting Dublin: "Dublin, County Dublin, Ireland"
- If visiting Cork: "Cork, County Cork, Ireland"
- If visiting multiple cities in one day, specify each location separately

Please create a realistic, detailed itinerary that fits within the budget and matches the travel style. Include appropriate activities for the age groups. Ensure the daily itinerary has activities from morning to evening with proper meal times.`

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}

// Main itinerary generation method
export async function generateItinerary(
  preferences: {
    destinations: string
    startDate: string
    endDate: string
    travelType: string
    adults: number
    children: number
    under6: number
    from7to12: number
    budget: number
    currency: string
    activityPreferences: string
    hotelPreferences: string
    mealPreference: string
    dietaryPreference: string
    transportPreferences: string
    travelingWithPets: string
    additionalRequests?: string | null
    moreDetails?: string | null
    mustSeeSpots?: string | null
    pickupLocation?: string | null
    dropLocation?: string | null
    flightsRequired?: string
  },
  userTier: UserTier = "standard",
): Promise<{
  dailyItinerary: Array<{
    day: number
    date: string
    title: string
    activities: Array<{
      time: string
      title: string
      type: string
      description: string
      location?: string | null
    }>
  }>
  accommodation: Array<{
    name: string
    rating: number
    nights: number
    image: string
    location?: string | null
  }>
  budgetEstimation: {
    amount: number
    currency: string
    costTourist: number
  }
  cost?: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model_used?: string
}> {
  const model = getAIModel(userTier)
  const prompt = buildItineraryPrompt(preferences)

  // Calculate days and start date for formatting
  const startDate = new Date(preferences.startDate)
  const endDate = new Date(preferences.endDate)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  try {
    console.log(`[AI Service] Generating itinerary with ${model} for ${userTier} tier`)

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: prompt.system,
        },
        {
          role: "user",
          content: prompt.user,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: getMaxTokensForTier(userTier),
      temperature: 0.7,
    })

    const usage = response.usage
    const cost = calculateCost(
      {
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
      },
      model,
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    let itinerary
    try {
      itinerary = JSON.parse(content)
    } catch (parseError) {
      console.error("[AI Service] Failed to parse JSON response:", parseError)
      throw new Error("Invalid JSON response from AI")
    }

    // Validate and format the response
    // Ensure dailyItinerary has proper structure
    const formattedDailyItinerary = (itinerary.dailyItinerary || []).map((day: any, index: number) => {
      const dayNumber = day.day || index + 1
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + index)
      const formattedDate = formatDate(currentDate)

      return {
        day: dayNumber,
        date: day.date || formattedDate,
        title: day.title || `Day ${dayNumber}`,
        activities: (day.activities || []).map((activity: any) => ({
          time: activity.time || "",
          title: activity.title || "",
          type: activity.type || "ACTIVITY",
          description: activity.description || activity.title || "",
          location: activity.location || null, // Include location if provided by AI
        })),
      }
    })

    // Ensure accommodation has proper structure
    const formattedAccommodation = (itinerary.accommodation || []).map((acc: any) => ({
      name: acc.name || "Hotel",
      rating: acc.rating || 3,
      nights: acc.nights || Math.max(1, days - 1),
      image: acc.image || "/placeholder-hotel.jpg",
      location: acc.location || null, // Include location if provided by AI
    }))

    // If no accommodation provided, create a default one
    if (formattedAccommodation.length === 0) {
      formattedAccommodation.push({
        name: "Selected Hotel",
        rating: 3,
        nights: Math.max(1, days - 1),
        image: "/placeholder-hotel.jpg",
      })
    }

    const formattedItinerary = {
      dailyItinerary: formattedDailyItinerary,
      accommodation: formattedAccommodation,
      budgetEstimation: itinerary.budgetEstimation || {
        amount: preferences.budget,
        currency: preferences.currency,
        costTourist: preferences.budget,
      },
      cost,
      usage: usage
        ? {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
        }
        : undefined,
      model_used: model,
    }

    console.log(`[AI Service] Itinerary generated successfully. Cost: $${cost.toFixed(6)}`)
    console.log(formattedItinerary)
    return formattedItinerary
  } catch (error) {
    // Fallback to cheaper model if premium fails
    if (userTier === "premium" && error instanceof Error && error.message.includes("rate_limit")) {
      console.log("[AI Service] Premium model rate limited, falling back to standard")
      return generateItinerary(preferences, "standard")
    }

    console.error("[AI Service] Error generating itinerary:", error)
    throw error
  }
}

