import { type NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"

// Define the CSV data as constants with enhanced location matching
const ITINERARY_CSV_DATA = {
  KASH001: `quoteId,name,days,nights,startDate,costINR,costUSD,guests,adults,kids
KASH001,Kashmir Family Experience,3,2,11/08/2025,38500,500,5,2,3

day,time,activity,type,description
1,8:00 AM,Breakfast,meal,Start your day with traditional Kashmiri breakfast featuring local bread and kahwa
1,10:00 AM,Pickup for trekking,transfer,Hotel pickup for exciting trekking adventure in the Kashmir valleys
1,12:30 PM,Lunch,meal,Enjoy authentic Kashmiri cuisine with stunning mountain views
1,2:00 PM,Adventure activities,adventure,Thrilling outdoor adventure activities including paragliding and rock climbing
1,4:30 PM,Tea Tasting,activity,Experience authentic Kashmiri tea culture with traditional kahwa
1,5:00 PM,Horse riding,adventure,Scenic horse riding through the beautiful Kashmir valleys
1,7:00 PM,Cultural Activities,activity,Traditional Kashmiri cultural performances and local handicraft demonstrations
1,9:00 PM,Dinner,meal,Delicious dinner with local Kashmiri specialties like Rogan Josh and Yakhni
2,8:00 AM,Breakfast,meal,Fresh morning breakfast with local delicacies
2,10:00 AM,Pickup for Sight Seeing,sightseeing,Explore famous Kashmir attractions including Dal Lake and Mughal Gardens
2,12:30 PM,Lunch,meal,Midday meal at a scenic location overlooking the valley
2,2:00 PM,Skiing,adventure,Exciting skiing experience at Gulmarg (seasonal activity)
2,4:30 PM,Tea Tasting,activity,Afternoon tea break with local snacks
2,5:00 PM,Rafting,adventure,White water rafting adventure in Lidder River
2,7:00 PM,Leisure Activities,activity,Relaxing evening activities including shikara ride
2,9:00 PM,Dinner,meal,Evening dinner with traditional Kashmiri wazwan
3,8:00 AM,Breakfast,meal,Final day breakfast with continental and local options
3,10:00 AM,Pickup for trekking,adventure,Last trekking experience to Betaab Valley
3,12:30 PM,Lunch,meal,Farewell lunch with panoramic mountain views
3,2:00 PM,Camping,adventure,Short camping experience with bonfire and local music
3,4:30 PM,Tea Tasting,activity,Final tea session with goodbye ceremony
3,5:00 PM,Departure,transfer,Check out and departure preparation with souvenir shopping
3,7:00 PM,Airport Drop,transfer,Safe transfer to Srinagar airport`,

  KER001: `quoteId,name,days,nights,startDate,costINR,costUSD,guests,adults,kids
KER001,Kerala Backwater Romance,4,3,11/08/2025,55000,640,2,2,0

day,time,activity,type,description
1,8:00 AM,Breakfast,meal,Romantic breakfast for couples with Kerala specialties like appam and stew
1,10:00 AM,Pickup for trekking,adventure,Nature trekking in the lush Kerala hills and spice plantations
1,12:30 PM,Lunch,meal,Traditional Kerala lunch served on banana leaves
1,2:00 PM,Adventure activities,adventure,Couple adventure activities including bamboo rafting
1,4:30 PM,Tea Tasting,activity,Kerala tea plantation experience in Munnar hills
1,5:00 PM,Horse riding,adventure,Romantic horse riding through tea gardens
1,7:00 PM,Cultural Activities,activity,Kerala traditional performances including Kathakali and Mohiniyattam
1,9:00 PM,Dinner,meal,Candlelight dinner with fresh seafood and Kerala cuisine
2,8:00 AM,Breakfast,meal,Houseboat breakfast with backwater views
2,10:00 AM,Pickup for Sight Seeing,sightseeing,Explore Kerala attractions including Chinese fishing nets and spice markets
2,12:30 PM,Lunch,meal,Backwater lunch experience on traditional houseboat
2,2:00 PM,Skiing,adventure,Water skiing activities in Vembanad Lake
2,4:30 PM,Tea Tasting,activity,Afternoon spice garden visit and tea break
2,5:00 PM,Rafting,adventure,Peaceful backwater rafting through coconut groves
2,7:00 PM,Leisure Activities,activity,Sunset cruise and beach activities at Marari
2,9:00 PM,Dinner,meal,Fresh seafood dinner with traditional Kerala preparations
3,8:00 AM,Breakfast,meal,Beachfront breakfast with Arabian Sea views
3,10:00 AM,Pickup for Sight Seeing,sightseeing,Hill station visit to Munnar with tea factory tours
3,12:30 PM,Lunch,meal,Hill station lunch with valley views
3,2:00 PM,Skiing,adventure,Adventure activities including zip-lining
3,4:30 PM,Tea Tasting,activity,Mountain tea experience with local varieties
3,5:00 PM,Rafting,adventure,River rafting in Periyar waters
3,7:00 PM,Leisure Activities,activity,Wildlife sanctuary visit and nature walk
3,9:00 PM,Dinner,meal,Traditional Kerala feast with live music
4,8:00 AM,Breakfast,meal,Final day breakfast with Continental and South Indian options
4,10:00 AM,Pickup for Sight Seeing,sightseeing,Last minute sightseeing and shopping in Fort Kochi
4,12:30 PM,Lunch,meal,Farewell lunch at a heritage restaurant
4,2:00 PM,Skiing,adventure,Final beach activities and water sports
4,4:30 PM,Tea Tasting,activity,Goodbye drinks with traditional Kerala snacks
4,5:00 PM,Rafting,adventure,Final backwater experience
4,7:00 PM,Leisure Activities,activity,Departure preparation and souvenir shopping
4,9:00 PM,Airport Drop,transfer,Transfer to Cochin International Airport`,

  GOA001: `quoteId,name,days,nights,startDate,costINR,costUSD,guests,adults,kids
GOA001,Goa Beach Party,3,2,11/08/2025,45000,550,5,5,0

day,time,activity,type,description
1,8:00 AM,Breakfast,meal,Hearty beach breakfast with Goan specialties and fresh tropical fruits
1,10:00 AM,Pickup for trekking,adventure,Group adventure trekking in Western Ghats near Goa
1,12:30 PM,Lunch,meal,Beach side lunch with fresh seafood and Goan curry
1,2:00 PM,Adventure activities,adventure,Water sports including jet skiing, parasailing, and banana boat rides
1,4:30 PM,Tea Tasting,activity,Local beverages tasting including feni and tropical cocktails
1,5:00 PM,Horse riding,adventure,Beach horse riding along Anjuna and Baga beaches
1,7:00 PM,Cultural Activities,activity,Live music, beach volleyball, and local entertainment
1,9:00 PM,Dinner,meal,Group dinner with live entertainment and beach barbecue
2,8:00 AM,Breakfast,meal,Beachfront breakfast with continental and Goan options
2,10:00 AM,Pickup for Sight Seeing,sightseeing,Goa sightseeing tour including Old Goa churches and Panjim
2,12:30 PM,Lunch,meal,Traditional Goan lunch with vindaloo, fish curry, and bebinca
2,2:00 PM,Skiing,adventure,Jet skiing, windsurfing, and other exciting water sports
2,4:30 PM,Tea Tasting,activity,Beach café experience with local snacks and drinks
2,5:00 PM,Rafting,adventure,River rafting adventure in Mandovi River
2,7:00 PM,Leisure Activities,activity,Beach volleyball, frisbee, and sunset party games
2,9:00 PM,Dinner,meal,Seafood feast with live DJ and beach party atmosphere
3,8:00 AM,Breakfast,meal,Final breakfast with beach views and tropical smoothies
3,10:00 AM,Pickup for trekking,adventure,Last adventure sports including deep sea fishing
3,12:30 PM,Lunch,meal,Farewell lunch at a beach shack with local specialties
3,2:00 PM,Camping,adventure,Beach camping experience with bonfire and music
3,4:30 PM,Tea Tasting,activity,Final drinks session with cocktails and local brews
3,5:00 PM,Departure,transfer,Hotel checkout and last-minute shopping in Mapusa market
3,7:00 PM,Airport Drop,transfer,Group airport transfer to Goa Dabolim Airport`,

  RAJ001: `quoteId,name,days,nights,startDate,costINR,costUSD,guests,adults,kids
RAJ001,Royal Rajasthan Heritage,6,5,11/08/2025,72000,900,5,5,0

day,time,activity,type,description
1,8:00 AM,Breakfast,meal,Royal Rajasthani breakfast in palace setting with traditional dal baati churma
1,10:00 AM,Pickup for trekking,adventure,Desert trekking experience in Thar Desert with camel guides
1,12:30 PM,Lunch,meal,Royal Rajasthani thali with local delicacies in heritage restaurant
1,2:00 PM,Adventure activities,adventure,Camel safari adventure through sand dunes of Jaisalmer
1,4:30 PM,Tea Tasting,activity,Desert tea experience with traditional Rajasthani snacks
1,5:00 PM,Horse riding,adventure,Royal horse riding at Mehrangarh Fort area
1,7:00 PM,Cultural Activities,activity,Folk dance and music performances with puppet shows
1,9:00 PM,Dinner,meal,Royal dinner under the stars with traditional Rajasthani cuisine
2,8:00 AM,Breakfast,meal,Palace breakfast with heritage ambiance
2,10:00 AM,Pickup for Sight Seeing,sightseeing,Palace and fort tours including Amber Fort and City Palace
2,12:30 PM,Lunch,meal,Heritage lunch in restored haveli with royal service
2,2:00 PM,Skiing,adventure,Sand dune activities including quad biking and dune bashing
2,4:30 PM,Tea Tasting,activity,Afternoon tea at palace hotel with royal treatment
2,5:00 PM,Rafting,adventure,Lake boating in Lake Pichola with sunset views
2,7:00 PM,Leisure Activities,activity,Shopping at local markets for handicrafts and textiles
2,9:00 PM,Dinner,meal,Traditional feast with folk entertainment and local wine
3,8:00 AM,Breakfast,meal,Morning breakfast with Continental and Indian options
3,10:00 AM,Pickup for trekking,adventure,Hill fort exploration at Kumbhalgarh with wall walk
3,12:30 PM,Lunch,meal,Hilltop lunch with panoramic views of Aravalli hills
3,2:00 PM,Camping,adventure,Desert camping with luxury tents and cultural programs
3,4:30 PM,Tea Tasting,activity,Desert sunset tea with camel milk chai
3,5:00 PM,Departure,transfer,Journey to Pushkar with temple visits
3,7:00 PM,Airport Drop,transfer,Check-in at Pushkar accommodation
4,8:00 AM,Breakfast,meal,Holy city breakfast near Pushkar Lake
4,10:00 AM,Pickup for trekking,adventure,Pushkar exploration with temple visits and ghats
4,12:30 PM,Lunch,meal,Vegetarian lunch as per Pushkar traditions
4,2:00 PM,Camping,adventure,Desert camping near Pushkar with spiritual ambiance
4,4:30 PM,Tea Tasting,activity,Evening tea with local sweets and snacks
4,5:00 PM,Departure,transfer,Travel to Jaipur - the Pink City
4,7:00 PM,Airport Drop,transfer,Evening arrival and check-in at Jaipur
5,8:00 AM,Breakfast,meal,Pink City breakfast with local Rajasthani specialties
5,10:00 AM,Pickup for trekking,adventure,Jaipur city exploration including Hawa Mahal and Jantar Mantar
5,12:30 PM,Lunch,meal,Traditional Jaipur lunch with dal baati and ghewar
5,2:00 PM,Camping,adventure,Visit to elephant village and rural camping experience
5,4:30 PM,Tea Tasting,activity,Tea ceremony at heritage hotel with royal ambiance
5,5:00 PM,Departure,transfer,Shopping at Johari Bazaar and Bapu Bazaar
5,7:00 PM,Airport Drop,transfer,Return to hotel with cultural show
6,8:00 AM,Breakfast,meal,Final morning breakfast with send-off ceremony
6,10:00 AM,Pickup for trekking,adventure,Last minute shopping and sightseeing
6,12:30 PM,Lunch,meal,Farewell lunch at heritage restaurant
6,2:00 PM,Camping,adventure,Final souvenir shopping at local markets
6,4:30 PM,Tea Tasting,activity,Goodbye tea ceremony with traditional sweets
6,5:00 PM,Departure,transfer,Final departure preparation
6,7:00 PM,Airport Drop,transfer,Transfer to Jaipur International Airport`,

  EVER001: `quoteId,name,days,nights,startDate,costINR,costUSD,guests,adults,kids
EVER001,Evergreen Kerala Family,4,3,11/08/2025,47000,560,5,2,3

day,time,activity,type,description
1,8:00 AM,Breakfast,meal,Family breakfast with Kerala delicacies suitable for children and adults
1,10:00 AM,Pickup for trekking,adventure,Family-friendly nature trekking in Munnar hills
1,12:30 PM,Lunch,meal,Traditional Kerala lunch served in eco-friendly manner
1,2:00 PM,Adventure activities,adventure,Family adventure activities including nature walks and bird watching
1,4:30 PM,Tea Tasting,activity,Kerala tea plantation tour with educational component for children
1,5:00 PM,Horse riding,adventure,Safe children's horse riding experience with trained guides
1,7:00 PM,Cultural Activities,activity,Family-friendly Kerala cultural show with storytelling
1,9:00 PM,Dinner,meal,Early family dinner with kid-friendly options
2,8:00 AM,Breakfast,meal,Backwater breakfast on traditional houseboat
2,10:00 AM,Pickup for Sight Seeing,sightseeing,Family backwater sightseeing with educational commentary
2,12:30 PM,Lunch,meal,Houseboat lunch with fresh local ingredients
2,2:00 PM,Skiing,adventure,Safe water activities suitable for families with children
2,4:30 PM,Tea Tasting,activity,Spice garden visit with interactive learning for kids
2,5:00 PM,Rafting,adventure,Gentle family river rafting with safety measures
2,7:00 PM,Leisure Activities,activity,Beach activities including sandcastle building and games
2,9:00 PM,Dinner,meal,Family seafood dinner with multiple options
3,8:00 AM,Breakfast,meal,Hill station breakfast with mountain views
3,10:00 AM,Pickup for Sight Seeing,sightseeing,Family hill station tour with photo opportunities
3,12:30 PM,Lunch,meal,Mountain view lunch at family-friendly restaurant
3,2:00 PM,Skiing,adventure,Hill station family activities including nature trails
3,4:30 PM,Tea Tasting,activity,Mountain tea experience with local varieties and snacks
3,5:00 PM,Rafting,adventure,Adventure activities suitable for all family members
3,7:00 PM,Leisure Activities,activity,Family games, storytelling, and bonfire activities
3,9:00 PM,Dinner,meal,Hill station dinner with live music and entertainment
4,8:00 AM,Breakfast,meal,Final day family breakfast with special send-off
4,10:00 AM,Pickup for Sight Seeing,sightseeing,Last minute family sightseeing and photo sessions
4,12:30 PM,Lunch,meal,Farewell family lunch with traditional Kerala feast
4,2:00 PM,Skiing,adventure,Final family activities and memory-making sessions
4,4:30 PM,Tea Tasting,activity,Last tea session with local sweets and snacks for everyone
4,5:00 PM,Rafting,adventure,Final adventure experience suitable for the whole family
4,7:00 PM,Leisure Activities,activity,Departure preparation with souvenir shopping
4,9:00 PM,Dinner,meal,Final family dinner with traditional Kerala preparations`,

  THAI001: `quoteId,name,days,nights,startDate,costINR,costUSD,guests,adults,kids
THAI001,Exotic Thailand Adventure,4,3,11/08/2025,65000,780,5,2,3

day,time,activity,type,description
1,8:00 AM,Breakfast,meal,Thai breakfast with tropical fruits and local delicacies like pad thai
1,10:00 AM,Pickup for trekking,adventure,Jungle trekking adventure in Khao Yai National Park
1,12:30 PM,Lunch,meal,Authentic Thai cuisine with tom yum, green curry, and fresh seafood
1,2:00 PM,Adventure activities,adventure,Elephant sanctuary visit with ethical elephant interaction
1,4:30 PM,Tea Tasting,activity,Thai tea ceremony and cooking class experience
1,5:00 PM,Horse riding,adventure,Beach horse riding along pristine Thai beaches
1,7:00 PM,Cultural Activities,activity,Traditional Thai cultural performances including classical dance
1,9:00 PM,Dinner,meal,Traditional Thai dinner with multiple course tasting menu
2,8:00 AM,Breakfast,meal,Tropical beach breakfast with fresh coconut water
2,10:00 AM,Pickup for Sight Seeing,sightseeing,Temple and palace tours including Grand Palace and Wat Pho
2,12:30 PM,Lunch,meal,Street food experience at famous floating markets
2,2:00 PM,Skiing,adventure,Water skiing, jet skiing, and exciting water sports
2,4:30 PM,Tea Tasting,activity,Thai cooking class with market tour and hands-on experience
2,5:00 PM,Rafting,adventure,River rafting adventure through Thai jungle rivers
2,7:00 PM,Leisure Activities,activity,Traditional Thai massage and spa relaxation
2,9:00 PM,Dinner,meal,Floating market dinner cruise with live entertainment
3,8:00 AM,Breakfast,meal,Island breakfast with panoramic ocean views
3,10:00 AM,Pickup for Sight Seeing,sightseeing,Island hopping tour to Phi Phi Islands and James Bond Island
3,12:30 PM,Lunch,meal,Beach picnic lunch on pristine white sand beaches
3,2:00 PM,Skiing,adventure,Snorkeling, scuba diving, and underwater exploration
3,4:30 PM,Tea Tasting,activity,Sunset cocktails with traditional Thai appetizers
3,5:00 PM,Rafting,adventure,Sea kayaking adventure through limestone caves
3,7:00 PM,Leisure Activities,activity,Beach activities, volleyball, and sunset photography
3,9:00 PM,Dinner,meal,Seafood barbecue on the beach with live fire show
4,8:00 AM,Breakfast,meal,Final breakfast with continental and Thai options
4,10:00 AM,Pickup for Sight Seeing,sightseeing,Last minute shopping at Chatuchak Weekend Market
4,12:30 PM,Lunch,meal,Farewell lunch at rooftop restaurant with city views
4,2:00 PM,Skiing,adventure,Final water activities and beach relaxation
4,4:30 PM,Tea Tasting,activity,Goodbye drinks with traditional Thai desserts
4,5:00 PM,Rafting,adventure,Final adventure activity and souvenir collection
4,7:00 PM,Leisure Activities,activity,Departure preparation and airport transfer
4,9:00 PM,Airport Drop,transfer,Transfer to Bangkok Suvarnabhumi International Airport`,
}

// Enhanced location mapping with multiple keywords per location
const LOCATION_TO_QUOTE_MAPPING: { [key: string]: string } = {
  // Kashmir variations
  kashmir: "KASH001",
  srinagar: "KASH001",
  gulmarg: "KASH001",
  pahalgam: "KASH001",
  jammu: "KASH001",
  "dal lake": "KASH001",

  // Kerala variations
  kerala: "KER001",
  kochi: "KER001",
  cochin: "KER001",
  munnar: "KER001",
  alleppey: "KER001",
  alappuzha: "KER001",
  backwaters: "KER001",
  kumarakom: "KER001",
  wayanad: "KER001",
  thekkady: "KER001",
  kovalam: "KER001",

  // Goa variations
  goa: "GOA001",
  panaji: "GOA001",
  panjim: "GOA001",
  calangute: "GOA001",
  baga: "GOA001",
  anjuna: "GOA001",
  arambol: "GOA001",
  vagator: "GOA001",
  candolim: "GOA001",

  // Rajasthan variations
  rajasthan: "RAJ001",
  jaipur: "RAJ001",
  jodhpur: "RAJ001",
  udaipur: "RAJ001",
  jaisalmer: "RAJ001",
  bikaner: "RAJ001",
  pushkar: "RAJ001",
  ajmer: "RAJ001",
  "mount abu": "RAJ001",
  "pink city": "RAJ001",
  "blue city": "RAJ001",
  "golden city": "RAJ001",

  // Additional Kerala mapping for "Evergreen Kerala"
  evergreen: "EVER001",
  "evergreen kerala": "EVER001",

  // Thailand variations
  thailand: "THAI001",
  bangkok: "THAI001",
  phuket: "THAI001",
  pattaya: "THAI001",
  "chiang mai": "THAI001",
  krabi: "THAI001",
  "phi phi": "THAI001",
  "koh samui": "THAI001",
  ayutthaya: "THAI001",
}

// Function to find the best matching quote ID based on location
function findQuoteIdByLocation(location: string): string {
  const locationLower = location.toLowerCase().trim()

  // Direct match first
  if (LOCATION_TO_QUOTE_MAPPING[locationLower]) {
    return LOCATION_TO_QUOTE_MAPPING[locationLower]
  }

  // Partial match - check if location contains any of the keywords
  for (const [keyword, quoteId] of Object.entries(LOCATION_TO_QUOTE_MAPPING)) {
    if (locationLower.includes(keyword) || keyword.includes(locationLower)) {
      return quoteId
    }
  }

  // Default fallback
  return "KASH001"
}

interface HeaderData {
  quoteId: string
  name: string
  days: string
  nights: string
  startDate: string
  costINR: string
  costUSD: string
  guests: string
  adults: string
  kids: string
}

interface ActivityData {
  day: string
  time: string
  activity: string
  type: string
  description: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const enquiryId = searchParams.get("enquiryId")
    const quoteId = searchParams.get("quoteId")
    const location = searchParams.get("location")

    if (!enquiryId && !quoteId && !location) {
      return NextResponse.json({ error: "enquiryId, quoteId, or location is required" }, { status: 400 })
    }

    let selectedQuoteId = quoteId

    // If location is directly provided
    if (location && !quoteId) {
      selectedQuoteId = findQuoteIdByLocation(location)
    }

    // If enquiryId is provided, try to fetch enquiry data to get location
    if (enquiryId && !selectedQuoteId) {
      try {
        // Fetch enquiry data to get location information
        const enquiryResponse = await fetch(`${request.nextUrl.origin}/api/enquiries?id=${enquiryId}`)
        if (enquiryResponse.ok) {
          const enquiryData = await enquiryResponse.json()
          if (enquiryData && enquiryData.locations) {
            selectedQuoteId = findQuoteIdByLocation(enquiryData.locations)
          }
        }
      } catch (error) {
        console.log("Could not fetch enquiry data, using default mapping", error)
      }
    }

    // Fallback to simple enquiry ID mapping if location not found
    if (!selectedQuoteId && enquiryId) {
      const enquiryLower = enquiryId.toLowerCase()
      const foundKey = Object.keys(LOCATION_TO_QUOTE_MAPPING).find((key) => enquiryLower.includes(key))
      selectedQuoteId = foundKey ? LOCATION_TO_QUOTE_MAPPING[foundKey] : "KASH001"
    }

    if (!selectedQuoteId || !ITINERARY_CSV_DATA[selectedQuoteId as keyof typeof ITINERARY_CSV_DATA]) {
      return NextResponse.json({ error: "Invalid quoteId or no data found" }, { status: 404 })
    }

    const csvData = ITINERARY_CSV_DATA[selectedQuoteId as keyof typeof ITINERARY_CSV_DATA]

    // Split the CSV into header and activities sections
    const sections = csvData.split("\n\n")
    const headerCsv = sections[0]
    const activitiesCsv = sections[1]

    // Parse header information with proper typing
    const headerResult = Papa.parse<HeaderData>(headerCsv, { header: true, skipEmptyLines: true })
    const headerData = headerResult.data[0]

    // Parse activities with proper typing
    const activitiesResult = Papa.parse<ActivityData>(activitiesCsv, { header: true, skipEmptyLines: true })
    const activities = activitiesResult.data

    // Group activities by day with proper typing
    const groupedByDay = activities.reduce((acc: Record<number, ActivityData[]>, activity: ActivityData) => {
      const day = Number.parseInt(activity.day)
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(activity)
      return acc
    }, {})

    // Create date progression starting from the start date
    const startDate = new Date(headerData.startDate)
    const dailyItinerary = Object.keys(groupedByDay).map((day) => {
      const dayNumber = Number.parseInt(day)
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + (dayNumber - 1))

      return {
        day: dayNumber,
        date: currentDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        }),
        title: `Day ${day} - ${headerData.name}`,
        activities: groupedByDay[dayNumber].map((activity) => ({
          time: activity.time,
          title: activity.activity,
          type: activity.type || "activity",
          description: activity.description || activity.activity,
        })),
      }
    })

    const result = {
      quoteId: selectedQuoteId,
      name: headerData.name,
      days: Number.parseInt(headerData.days),
      nights: Number.parseInt(headerData.nights),
      startDate: headerData.startDate,
      costINR: Number.parseInt(headerData.costINR),
      costUSD: Number.parseInt(headerData.costUSD),
      guests: Number.parseInt(headerData.guests),
      adults: Number.parseInt(headerData.adults),
      kids: Number.parseInt(headerData.kids),
      dailyItinerary,
      locationMatched: location || "auto-detected",
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching itinerary CSV data:", error)
    return NextResponse.json({ error: "Failed to fetch itinerary data" }, { status: 500 })
  }
}
