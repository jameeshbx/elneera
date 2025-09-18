// lib/pdf-config.ts
export const PDF_CONFIG = {
  // Page settings
  page: {
    format: "A4" as const,
    margin: {
      top: "20mm",
      right: "15mm",
      bottom: "20mm",
      left: "15mm",
    },
    printBackground: true,
    displayHeaderFooter: false,
  },

  // Color scheme
  colors: {
    primary: "#2c5530", // Dark green
    secondary: "#4a7c59", // Medium green
    accent: "#ff6b35", // Orange for meals
    light: "#e8f5e8", // Light green background
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      600: "#4b5563",
      700: "#374151",
      900: "#111827",
    },
  },

  // Typography
  fonts: {
    primary: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    sizes: {
      title: "2.5em",
      subtitle: "1.8em",
      heading: "1.4em",
      subheading: "1.3em",
      body: "1em",
      small: "0.9em",
      tiny: "0.8em",
    },
  },

  // Layout settings
  layout: {
    maxWidth: "800px",
    borderRadius: {
      small: "8px",
      medium: "12px",
      large: "15px",
    },
    spacing: {
      xs: "5px",
      sm: "10px",
      md: "15px",
      lg: "20px",
      xl: "25px",
      xxl: "30px",
    },
  },
}

// Activity type configurations
export const ACTIVITY_TYPES = {
  meal: {
    backgroundColor: "#f8f9fa",
    badgeColor: "#ff6b35",
    icon: "🍽️",
  },
  sightseeing: {
    backgroundColor: "#ffffff",
    badgeColor: "#2c5530",
    icon: "🏛️",
  },
  adventure: {
    backgroundColor: "#fff7ed",
    badgeColor: "#ea580c",
    icon: "🏔️",
  },
  transfer: {
    backgroundColor: "#f0f9ff",
    badgeColor: "#0284c7",
    icon: "🚗",
  },
  activity: {
    backgroundColor: "#f0fdf4",
    badgeColor: "#16a34a",
    icon: "🎯",
  },
  leisure: {
    backgroundColor: "#fefce8",
    badgeColor: "#ca8a04",
    icon: "🌴",
  },
}

// CSV to destination mapping
export const DESTINATION_CSV_MAPPING = {
  // Primary mappings
  thailand: "THAI001.csv",
  thai: "THAI001.csv",
  bangkok: "THAI001.csv",
  phuket: "THAI001.csv",

  kerala: "EVER001.csv",
  kochi: "EVER001.csv",
  munnar: "EVER001.csv",
  alleppey: "EVER001.csv",
  thekkady: "EVER001.csv",

  goa: "GOA001.csv",
  "north goa": "GOA001.csv",
  "south goa": "GOA001.csv",
  panaji: "GOA001.csv",

  kashmir: "KASH001.csv",
  srinagar: "KASH001.csv",
  gulmarg: "KASH001.csv",
  pahalgam: "KASH001.csv",
  jammu: "KASH001.csv",

  rajasthan: "RAJ001.csv",
  jaipur: "RAJ001.csv",
  udaipur: "RAJ001.csv",
  jodhpur: "RAJ001.csv",
  jaisalmer: "RAJ001.csv",
}

// Default package templates for fallback
export const DEFAULT_PACKAGES = {
  THAI001: {
    name: "Exotic Thailand Adventure",
    days: 4,
    nights: 3,
    basePrice: { INR: 60000, USD: 750 },
    highlights: ["Bangkok City Tour", "Island Hopping", "Thai Cooking Class", "Temple Visits"],
  },
  EVER001: {
    name: "Evergreen Kerala Experience",
    days: 4,
    nights: 3,
    basePrice: { INR: 47000, USD: 520 },
    highlights: ["Backwater Cruise", "Hill Station", "Spice Plantation", "Ayurveda Spa"],
  },
  GOA001: {
    name: "Goa Beach Paradise",
    days: 3,
    nights: 2,
    basePrice: { INR: 45000, USD: 550 },
    highlights: ["Beach Activities", "Water Sports", "Nightlife", "Portuguese Heritage"],
  },
  KASH001: {
    name: "Kashmir Valley Delight",
    days: 3,
    nights: 2,
    basePrice: { INR: 38500, USD: 500 },
    highlights: ["Shikara Ride", "Gulmarg Cable Car", "Saffron Fields", "Local Crafts"],
  },
  KER001: {
    name: "Kerala Honeymoon Special",
    days: 4,
    nights: 3,
    basePrice: { INR: 55000, USD: 640 },
    highlights: ["Romantic Backwaters", "Hill Station Romance", "Couple Spa", "Private Dining"],
  },
  RAJ001: {
    name: "Royal Rajasthan Heritage",
    days: 6,
    nights: 5,
    basePrice: { INR: 30000, USD: 450 },
    highlights: ["Palace Tours", "Desert Safari", "Cultural Shows", "Local Cuisine"],
  },
}

// PDF generation settings
export const PDF_GENERATION_CONFIG = {
  puppeteer: {
    launch: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-extensions",
      ],
    },
    page: {
      waitUntil: "networkidle0" as const,
      timeout: 30000,
    },
  },

  // File naming convention
  fileNaming: {
    prefix: "itinerary",
    timestampFormat: "YYYY-MM-DD-HHmmss",
    extension: "pdf",
  },

  // Error handling
  retryAttempts: 2,
  retryDelay: 1000, // milliseconds

  // Quality settings
  quality: {
    printBackground: true,
    preferCSSPageSize: false,
  },
}

// Validation rules for CSV data
export const CSV_VALIDATION_RULES = {
  required: {
    packageInfo: ["quoteId", "name", "days", "nights"],
    activities: ["day", "time", "activity"],
  },

  dataTypes: {
    days: "number",
    nights: "number",
    costINR: "number",
    costUSD: "number",
    guests: "number",
    day: "number",
  },

  patterns: {
    time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$|^([0-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
    quoteId: /^[A-Z]{3,4}[0-9]{3}$/,
  },
}

export default PDF_CONFIG
