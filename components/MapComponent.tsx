"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set your Mapbox access token here
// You'll need to replace this with your actual Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export type LocationCategory = 
  | "landmark" 
  | "restaurant" 
  | "hotel" 
  | "activity" 
  | "transport" 
  | "other";

export interface Location {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  title?: string;
  description?: string;
  category?: LocationCategory;
  day?: number;
  activityType?: string;
  time?: string;
}

export interface DayItineraryData {
  day: number;
  date: string;
  title: string;
  activities: Array<{
    time: string;
    title: string;
    type: string;
    description: string;
    location?: string | null;
  }>;
}

interface MapComponentProps {
  addresses?: string[];
  locations?: Location[];
  itineraryData?: {
    dailyItinerary?: DayItineraryData[];
    accommodation?: Array<{
      name: string;
      rating?: number;
      nights?: number;
      location?: string | null;
    }>;
  };
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  height?: string;
  width?: string;
  showRoute?: boolean;
  selectedDay?: number | null; // Filter by specific day
  onLocationClick?: (location: Location) => void;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  addresses = [],
  locations = [],
  itineraryData,
  center = [-74.006, 40.7128], // Default to New York City
  zoom = 10,
  height = "400px",
  width = "100%",
  showRoute = false,
  selectedDay = null,
  onLocationClick,
  className = "",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [processedLocations, setProcessedLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevAddressesRef = useRef<string>("");
  const prevLocationsRef = useRef<string>("");
  const prevItineraryDataRef = useRef<string>("");
  const mapLoadedRef = useRef<boolean>(false);

  // Add debugging
  useEffect(() => {
    console.log("MapComponent Debug:", {
      addresses,
      locations,
      accessToken: mapboxgl.accessToken ? "Set" : "Missing",
      processedLocations: processedLocations.length,
    });
  }, [addresses, locations, processedLocations]);

  // Helper function to categorize location based on activity type
  const getCategoryFromActivityType = (activityType: string): LocationCategory => {
    const type = activityType.toUpperCase();
    if (type.includes("SIGHTSEEING") || type.includes("LANDMARK")) {
      return "landmark";
    }
    if (type.includes("MEAL") || type.includes("RESTAURANT") || type.includes("DINING")) {
      return "restaurant";
    }
    if (type.includes("HOTEL") || type.includes("ACCOMMODATION") || type.includes("CHECKIN") || type.includes("CHECKOUT")) {
      return "hotel";
    }
    if (type.includes("TRANSPORT") || type.includes("TRANSFER") || type.includes("AIRPORT")) {
      return "transport";
    }
    if (type.includes("ACTIVITY") || type.includes("ADVENTURE") || type.includes("EXCURSION")) {
      return "activity";
    }
    return "other";
  };

  // Extract location names from activity text
  const extractLocationFromText = (text: string): string | null => {
    // Common location keywords and patterns
    const locationKeywords = [
      /(?:visit|explore|at|in|to|from|see|tour|discover)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Temple|Palace|Fort|Museum|Park|Beach|Lake|Hill|Mountain|Valley|Fortress|Monument|Garden|Market|Bazaar)/gi,
      /(?:restaurant|hotel|cafe|resort|villa|palace)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Airport|Station|Bus|Train)/gi,
    ];

    // Common words to exclude
    const commonWords = new Set([
      "the", "and", "or", "to", "from", "at", "in", "on", "visit", "explore", 
      "see", "tour", "discover", "enjoy", "experience", "morning", "afternoon",
      "evening", "breakfast", "lunch", "dinner", "transfer", "check", "in", "out"
    ]);

    // Try each pattern
    for (const pattern of locationKeywords) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match[1]) {
          const location = match[1].trim();
          // Filter out common words and short strings
          if (
            location.length > 2 &&
            !commonWords.has(location.toLowerCase()) &&
            !location.match(/^\d+$/) // Not just numbers
          ) {
            return location;
          }
        }
      }
    }

    // Fallback: Look for capitalized words that might be locations
    const capitalizedWords = text.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)\b/g);
    if (capitalizedWords) {
      for (const word of capitalizedWords) {
        if (!commonWords.has(word.toLowerCase()) && word.length > 3) {
          return word;
        }
      }
    }

    return null;
  };

  // Extract locations from itinerary data
  const extractLocationsFromItinerary = (): Location[] => {
    if (!itineraryData?.dailyItinerary) return [];

    const extractedLocations: Map<string, Location> = new Map();

    itineraryData.dailyItinerary.forEach((day) => {
      day.activities.forEach((activity, activityIndex) => {
        // Priority 1: Use structured location from AI if available
        if (activity.location && activity.location.trim()) {
          const locationKey = activity.location.toLowerCase().trim();
          if (!extractedLocations.has(locationKey)) {
            const category = getCategoryFromActivityType(activity.type);
            extractedLocations.set(locationKey, {
              id: `day-${day.day}-activity-${activityIndex}-${Date.now()}`,
              address: activity.location.trim(), // Use the structured location from AI
              title: activity.title,
              description: activity.description,
              category,
              day: day.day,
              activityType: activity.type,
              time: activity.time,
            });
          }
        } else {
          // Priority 2: Fallback to text extraction if no structured location
          const locationName = extractLocationFromText(`${activity.title} ${activity.description}`);
          
          if (locationName) {
            const key = locationName.toLowerCase();
            if (!extractedLocations.has(key)) {
              const category = getCategoryFromActivityType(activity.type);
              // Try to construct a better address with country context
              // Extract country from destinations or use a default
              const countryContext = extractCountryFromDestinations();
              const fullAddress = countryContext 
                ? `${locationName}, ${countryContext}`
                : locationName;
              
              extractedLocations.set(key, {
                id: `day-${day.day}-${activity.title}-${Date.now()}`,
                address: fullAddress,
                title: activity.title,
                description: activity.description,
                category,
                day: day.day,
                activityType: activity.type,
                time: activity.time,
              });
            }
          }
        }
      });
    });

    // Add accommodation locations (use structured location if available)
    if (itineraryData.accommodation) {
      itineraryData.accommodation.forEach((acc, index) => {
        if (acc.name) {
          const locationKey = acc.location 
            ? acc.location.toLowerCase().trim()
            : `hotel-${index}`;
          
          if (!extractedLocations.has(locationKey)) {
            const address = acc.location 
              ? acc.location.trim() 
              : `${acc.name}, ${extractCountryFromDestinations() || "the destination country"}`;
            
            extractedLocations.set(locationKey, {
              id: `hotel-${index}`,
              address,
              title: acc.name,
              description: `Hotel - ${acc.rating ? `${acc.rating} stars` : "Accommodation"}`,
              category: "hotel",
              day: 1, // Hotels are typically for the entire trip
              activityType: "HOTEL",
            });
          }
        }
      });
    }

    return Array.from(extractedLocations.values());
  };

  // Helper to extract country context from destinations (fallback)
  const extractCountryFromDestinations = (): string | null => {
    // This is a fallback - ideally locations should come from AI with full context
    // Try to infer from itinerary title or first day title
    if (itineraryData?.dailyItinerary && itineraryData.dailyItinerary.length > 0) {
      const firstDayTitle = itineraryData.dailyItinerary[0].title.toLowerCase();
      if (firstDayTitle.includes("ireland") || firstDayTitle.includes("dublin") || firstDayTitle.includes("cork")) {
        return "Ireland";
      }
      if (firstDayTitle.includes("india") || firstDayTitle.includes("kashmir") || firstDayTitle.includes("kerala")) {
        return "India";
      }
      if (firstDayTitle.includes("thailand")) {
        return "Thailand";
      }
    }
    return null;
  };

  // Extract country from address string
  const extractCountryFromAddress = (address: string): string | null => {
    const addressLower = address.toLowerCase();
    // Check for common country names in address
    const countries = ["ireland", "india", "thailand", "spain", "france", "united states", "usa", "united kingdom", "uk"];
    for (const country of countries) {
      if (addressLower.includes(country)) {
        return country.charAt(0).toUpperCase() + country.slice(1);
      }
    }
    return null;
  };

  // Function to geocode addresses using Mapbox Geocoding API with country context
  const geocodeAddress = async (
    address: string,
    countryContext?: string | null
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log("Geocoding address:", address, countryContext ? `(context: ${countryContext})` : "");

      if (!mapboxgl.accessToken) {
        console.error("Mapbox access token is missing");
        return null;
      }

      // Build geocoding URL with country bias if available
      let geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
      
      // Add country code bias if we have country context
      if (countryContext) {
        const countryCode = getCountryCode(countryContext);
        if (countryCode) {
          geocodeUrl += `&country=${countryCode}`;
        }
      }

      const response = await fetch(geocodeUrl);

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Geocoding response for", address, ":", data);

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const resultContext = data.features[0].context || [];
        const countryFromResult = resultContext.find((ctx: any) => ctx.id?.startsWith("country"))?.text;
        
        console.log("Geocoded coordinates for", address, ":", { lat, lng, country: countryFromResult });
        
        // Verify the result is in the expected country if we have context
        if (countryContext && countryFromResult) {
          const expectedCountry = countryContext.toLowerCase();
          const resultCountry = countryFromResult.toLowerCase();
          if (!expectedCountry.includes(resultCountry) && !resultCountry.includes(expectedCountry)) {
            console.warn(`Geocoding result may be incorrect: expected ${countryContext}, got ${countryFromResult}`);
          }
        }
        
        return { lat, lng };
      }

      console.warn("No geocoding results for:", address);
      return null;
    } catch (error) {
      console.error("Geocoding error for", address, ":", error);
      return null;
    }
  };

  // Helper to get ISO country code from country name
  const getCountryCode = (countryName: string): string | null => {
    const countryMap: Record<string, string> = {
      "ireland": "ie",
      "india": "in",
      "thailand": "th",
      "spain": "es",
      "france": "fr",
      "united states": "us",
      "usa": "us",
      "united kingdom": "gb",
      "uk": "gb",
      "australia": "au",
      "canada": "ca",
      "germany": "de",
      "italy": "it",
      "japan": "jp",
      "china": "cn",
    };
    
    const lowerName = countryName.toLowerCase();
    for (const [key, code] of Object.entries(countryMap)) {
      if (lowerName.includes(key)) {
        return code;
      }
    }
    return null;
  };

  // Process addresses and convert to coordinates
  const processAddresses = async () => {
    // Extract locations from itinerary if available
    const itineraryLocations = itineraryData ? extractLocationsFromItinerary() : [];
    
    // Combine all location sources
    const allLocations = [
      ...locations,
      ...itineraryLocations,
    ];

    if (
      (!addresses || addresses.length === 0) &&
      allLocations.length === 0
    )
      return;

    setIsLoading(true);
    setError(null);

    try {
      const processed: Location[] = [];

      // Process locations that already have coordinates
      if (allLocations.length > 0) {
        for (const location of allLocations) {
          // Apply day filter if selectedDay is set
          if (selectedDay !== null && location.day !== undefined && location.day !== selectedDay) {
            continue;
          }

          if (location.lat && location.lng) {
            processed.push(location);
          } else if (location.address) {
            // Extract country from address if available
            const countryFromAddress = extractCountryFromAddress(location.address);
            const coords = await geocodeAddress(location.address, countryFromAddress);
            if (coords) {
              processed.push({
                ...location,
                lat: coords.lat,
                lng: coords.lng,
              });
            }
          }
        }
      }

      // Process addresses array (only if no day filter is active)
      if (addresses && addresses.length > 0 && selectedDay === null) {
        for (let i = 0; i < addresses.length; i++) {
          const address = addresses[i];
          const countryFromAddress = extractCountryFromAddress(address);
          const coords = await geocodeAddress(address, countryFromAddress);
          if (coords) {
            processed.push({
              id: `address-${i}`,
              address,
              lat: coords.lat,
              lng: coords.lng,
              title: `Location ${i + 1}`,
              description: address,
              category: "other",
            });
          }
        }
      }

      console.log("Processed locations:", processed);
      setProcessedLocations(processed);

      // Update map center if we have locations and map is ready
      if (processed.length > 0 && map.current && map.current.isStyleLoaded()) {
        console.log("Updating map with processed locations:", processed);
        if (processed.length === 1) {
          // Center on single location
          const newCenter: [number, number] = [
            processed[0].lng!,
            processed[0].lat!,
          ];
          console.log("Setting map center to:", newCenter);
          map.current.setCenter(newCenter);
          map.current.setZoom(12);
        } else {
          // Fit bounds for multiple locations
          const bounds = new mapboxgl.LngLatBounds();
          processed.forEach((location) => {
            bounds.extend([location.lng!, location.lat!]);
          });
          console.log("Setting map bounds to fit all locations");
          map.current.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      setError("Failed to process addresses");
      console.error("Error processing addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!mapboxgl.accessToken) {
      setError("Mapbox access token is required");
      return;
    }

    console.log("Initializing map with center:", center, "zoom:", zoom);
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: zoom,
    });

    map.current.on("load", () => {
      console.log("Map loaded, adding controls");
      mapLoadedRef.current = true;
      // Add navigation controls
      map.current!.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add fullscreen control
      map.current!.addControl(new mapboxgl.FullscreenControl(), "top-right");

      // Initialize refs with current values to prevent duplicate processing
      prevAddressesRef.current = JSON.stringify(addresses);
      prevLocationsRef.current = JSON.stringify(locations);
      prevItineraryDataRef.current = JSON.stringify(itineraryData);
      
      // Process addresses after map is loaded (only if we have addresses/locations/itineraryData)
      if (addresses.length > 0 || locations.length > 0 || itineraryData) {
        processAddresses();
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      mapLoadedRef.current = false;
    };
  }, []); // Remove center and zoom dependencies to prevent re-initialization

  // Get marker style based on category
  const getMarkerStyle = (category: LocationCategory = "other", index: number = 0) => {
    const categoryStyles: Record<LocationCategory, { bg: string; border: string; icon: string }> = {
      landmark: { bg: "#ef4444", border: "#dc2626", icon: "🏛️" },
      restaurant: { bg: "#f59e0b", border: "#d97706", icon: "🍽️" },
      hotel: { bg: "#3b82f6", border: "#2563eb", icon: "🏨" },
      activity: { bg: "#10b981", border: "#059669", icon: "🎯" },
      transport: { bg: "#6366f1", border: "#4f46e5", icon: "🚗" },
      other: { bg: "#6b7280", border: "#4b5563", icon: "📍" },
    };

    const style = categoryStyles[category] || categoryStyles.other;
    return {
      backgroundColor: style.bg,
      borderColor: style.border,
      icon: style.icon,
    };
  };

  // Memoize addresses and locations strings for comparison
  const addressesKey = useMemo(() => JSON.stringify(addresses), [addresses]);
  const locationsKey = useMemo(() => JSON.stringify(locations), [locations]);
  const itineraryDataKey = useMemo(() => JSON.stringify(itineraryData), [itineraryData]);

  // Track previous selectedDay to detect changes
  const prevSelectedDayRef = useRef<number | null>(null);

  // Process addresses when addresses, locations, itineraryData, or selectedDay change
  useEffect(() => {
    // Don't process if map hasn't loaded yet
    if (!mapLoadedRef.current || !map.current || !map.current.isStyleLoaded()) {
      return;
    }

    // Check if addresses, locations, itineraryData, or selectedDay have changed
    const addressesChanged = addressesKey !== prevAddressesRef.current;
    const locationsChanged = locationsKey !== prevLocationsRef.current;
    const itineraryDataChanged = itineraryDataKey !== prevItineraryDataRef.current;
    const selectedDayChanged = selectedDay !== prevSelectedDayRef.current;

    if (!addressesChanged && !locationsChanged && !itineraryDataChanged && !selectedDayChanged) {
      return; // No actual change, skip processing
    }

    // Update refs with new values
    prevAddressesRef.current = addressesKey;
    prevLocationsRef.current = locationsKey;
    prevItineraryDataRef.current = itineraryDataKey;
    prevSelectedDayRef.current = selectedDay;

    console.log("Addresses/locations/itineraryData/selectedDay changed, reprocessing...");
    processAddresses();
  }, [addressesKey, locationsKey, itineraryDataKey, selectedDay]);

  // Add markers and route when processed locations change
  useEffect(() => {
    if (
      !map.current ||
      !map.current.isStyleLoaded() ||
      processedLocations.length === 0
    )
      return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove existing sources and layers with better error handling
    try {
      if (map.current.getLayer("destinations")) {
        map.current.removeLayer("destinations");
      }
      if (map.current.getSource("destinations")) {
        map.current.removeSource("destinations");
      }
      if (map.current.getLayer("route")) {
        map.current.removeLayer("route");
      }
      if (map.current.getSource("route")) {
        map.current.removeSource("route");
      }
    } catch (error) {
      console.warn("Error removing existing sources/layers:", error);
    }

    // Add destination markers with category-based styling
    processedLocations.forEach((location, index) => {
      if (location.lat && location.lng) {
        const category = location.category || "other";
        const markerStyle = getMarkerStyle(category, index);
        
        // Create marker element
        const markerEl = document.createElement("div");
        markerEl.className = `destination-marker category-${category}`;
        markerEl.style.width = "40px";
        markerEl.style.height = "40px";
        markerEl.style.borderRadius = "50%";
        markerEl.style.backgroundColor = markerStyle.backgroundColor;
        markerEl.style.border = `3px solid ${markerStyle.borderColor}`;
        markerEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        markerEl.style.display = "flex";
        markerEl.style.alignItems = "center";
        markerEl.style.justifyContent = "center";
        markerEl.style.fontSize = "18px";
        markerEl.style.cursor = "pointer";
        markerEl.textContent = markerStyle.icon;

        // Create popup with enhanced information
        const dayInfo = location.day ? `Day ${location.day}` : "";
        const timeInfo = location.time ? ` • ${location.time}` : "";
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 10px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 20px;">${markerStyle.icon}</span>
              <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                ${location.title || `Location ${index + 1}`}
              </h3>
            </div>
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              ${location.description || location.address}
            </p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <span style="font-size: 11px; color: #9ca3af;">
                ${categoryLabel}${dayInfo ? ` • ${dayInfo}` : ""}${timeInfo}
              </span>
            </div>
          </div>
        `);

        // Add marker to map
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([location.lng, location.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);

        // Add click handler
        if (onLocationClick) {
          markerEl.addEventListener("click", () => {
            onLocationClick(location);
          });
        }
      }
    });

    // Add route if requested and we have multiple locations
    if (showRoute && processedLocations.length > 1) {
      const coordinates = processedLocations
        .filter((location) => location.lat && location.lng)
        .map((location) => [location.lng!, location.lat!]);

      if (coordinates.length > 1) {
        // Create route using Mapbox Directions API
        const waypoints = coordinates.map((coord) => coord.join(",")).join(";");
        fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        )
          .then((response) => response.json())
          .then((data) => {
            // Check if map is still valid and source doesn't exist
            if (
              map.current &&
              map.current.isStyleLoaded() &&
              data.routes &&
              data.routes.length > 0
            ) {
              try {
                // Double-check that source doesn't exist before adding
                if (!map.current.getSource("route")) {
                  map.current.addSource("route", {
                    type: "geojson",
                    data: {
                      type: "Feature",
                      properties: {},
                      geometry: data.routes[0].geometry,
                    },
                  });

                  map.current.addLayer({
                    id: "route",
                    type: "line",
                    source: "route",
                    layout: {
                      "line-join": "round",
                      "line-cap": "round",
                    },
                    paint: {
                      "line-color": "#3b82f6",
                      "line-width": 4,
                      "line-opacity": 0.8,
                    },
                  });
                }
              } catch (error) {
                console.warn("Error adding route source/layer:", error);
              }
            }
          })
          .catch((error) => {
            console.error("Error fetching route:", error);
          });
      }
    }
  }, [processedLocations, showRoute, onLocationClick]);

  if (!mapboxgl.accessToken) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">
            Mapbox access token is required
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment
            variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* {processedLocations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-medium text-sm mb-2">
            Destinations ({processedLocations.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {processedLocations.map((location, index) => (
              <div key={location.id} className="flex items-center text-xs">
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0">
                  {index + 1}
                </div>
                <span className="truncate">
                  {location.title || location.address}
                </span>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MapComponent;