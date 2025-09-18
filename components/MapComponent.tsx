"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set your Mapbox access token here
// You'll need to replace this with your actual Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface Location {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  title?: string;
  description?: string;
}

interface MapComponentProps {
  addresses?: string[];
  locations?: Location[];
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  height?: string;
  width?: string;
  showRoute?: boolean;
  onLocationClick?: (location: Location) => void;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  addresses = [],
  locations = [],
  center = [-74.006, 40.7128], // Default to New York City
  zoom = 10,
  height = "400px",
  width = "100%",
  showRoute = false,
  onLocationClick,
  className = "",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [processedLocations, setProcessedLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add debugging
  useEffect(() => {
    console.log("MapComponent Debug:", {
      addresses,
      locations,
      accessToken: mapboxgl.accessToken ? "Set" : "Missing",
      processedLocations: processedLocations.length,
    });
  }, [addresses, locations, processedLocations]);

  // Function to geocode addresses using Mapbox Geocoding API
  const geocodeAddress = async (
    address: string
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log("Geocoding address:", address);

      if (!mapboxgl.accessToken) {
        console.error("Mapbox access token is missing");
        return null;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${mapboxgl.accessToken}&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Geocoding response for", address, ":", data);

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        console.log("Geocoded coordinates for", address, ":", { lat, lng });
        return { lat, lng };
      }

      console.warn("No geocoding results for:", address);
      return null;
    } catch (error) {
      console.error("Geocoding error for", address, ":", error);
      return null;
    }
  };

  // Process addresses and convert to coordinates
  const processAddresses = async () => {
    if (
      (!addresses || addresses.length === 0) &&
      (!locations || locations.length === 0)
    )
      return;

    setIsLoading(true);
    setError(null);

    try {
      const processed: Location[] = [];

      // Process locations that already have coordinates
      if (locations && locations.length > 0) {
        for (const location of locations) {
          if (location.lat && location.lng) {
            processed.push(location);
          } else if (location.address) {
            const coords = await geocodeAddress(location.address);
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

      // Process addresses array
      if (addresses && addresses.length > 0) {
        for (let i = 0; i < addresses.length; i++) {
          const address = addresses[i];
          const coords = await geocodeAddress(address);
          if (coords) {
            processed.push({
              id: `address-${i}`,
              address,
              lat: coords.lat,
              lng: coords.lng,
              title: `Location ${i + 1}`,
              description: address,
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
      // Add navigation controls
      map.current!.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add fullscreen control
      map.current!.addControl(new mapboxgl.FullscreenControl(), "top-right");

      // Process addresses after map is loaded
      processAddresses();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove center and zoom dependencies to prevent re-initialization

  // Process addresses when addresses or locations change (but only if map is ready)
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      console.log("Addresses/locations changed, reprocessing...");
      processAddresses();
    }
  }, [addresses, locations]);

  // Add markers and route when processed locations change
  useEffect(() => {
    if (
      !map.current ||
      !map.current.isStyleLoaded() ||
      processedLocations.length === 0
    )
      return;

    // Remove existing markers and sources
    const existingMarkers = document.querySelectorAll(".mapboxgl-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Remove existing sources and layers
    if (map.current.getSource("destinations")) {
      map.current.removeLayer("destinations");
      map.current.removeSource("destinations");
    }
    if (map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    // Add destination markers
    processedLocations.forEach((location, index) => {
      if (location.lat && location.lng) {
        // Create marker element
        const markerEl = document.createElement("div");
        markerEl.className = "destination-marker";
        markerEl.style.width = "30px";
        markerEl.style.height = "30px";
        markerEl.style.borderRadius = "50%";
        markerEl.style.backgroundColor = "#3b82f6";
        markerEl.style.border = "3px solid white";
        markerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        markerEl.style.display = "flex";
        markerEl.style.alignItems = "center";
        markerEl.style.justifyContent = "center";
        markerEl.style.color = "white";
        markerEl.style.fontWeight = "bold";
        markerEl.style.fontSize = "12px";
        markerEl.textContent = (index + 1).toString();

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
              ${location.title || `Location ${index + 1}`}
            </h3>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${location.description || location.address}
            </p>
          </div>
        `);

        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat([location.lng, location.lat])
          .setPopup(popup)
          .addTo(map.current!);

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
            if (data.routes && data.routes.length > 0) {
              map.current!.addSource("route", {
                type: "geojson",
                data: {
                  type: "Feature",
                  properties: {},
                  geometry: data.routes[0].geometry,
                },
              });

              map.current!.addLayer({
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
