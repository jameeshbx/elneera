"use client";

import React, { useState } from "react";
import MapComponent from "./MapComponent";

const MapExample: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Example addresses
  const sampleAddresses = [
    "Times Square, New York, NY",
    "Central Park, New York, NY",
    "Empire State Building, New York, NY",
    "Brooklyn Bridge, New York, NY",
    "Statue of Liberty, New York, NY",
  ];

  // Example locations with coordinates
  const sampleLocations = [
    {
      id: "1",
      address: "Eiffel Tower, Paris, France",
      lat: 48.8584,
      lng: 2.2945,
      title: "Eiffel Tower",
      description: "Iconic iron lattice tower on the Champ de Mars in Paris",
    },
    {
      id: "2",
      address: "Louvre Museum, Paris, France",
      lat: 48.8606,
      lng: 2.3376,
      title: "Louvre Museum",
      description: "World's largest art museum and a historic monument",
    },
    {
      id: "3",
      address: "Arc de Triomphe, Paris, France",
      lat: 48.8738,
      lng: 2.295,
      title: "Arc de Triomphe",
      description: "Triumphal arch in the center of Place Charles de Gaulle",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    console.log("Clicked location:", location);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Map Component Examples
        </h1>
        <p className="text-gray-600">
          Demonstrating the reusable MapComponent with different configurations
        </p>
      </div>

      {/* Example 1: Basic usage with addresses */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Example 1: Basic Map with Addresses
        </h2>
        <p className="text-gray-600">
          This example shows a map with addresses that are automatically
          geocoded.
        </p>
        <MapComponent
          addresses={sampleAddresses}
          height="400px"
          className="border rounded-lg shadow-lg"
        />
      </div>

      {/* Example 2: Map with predefined locations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Example 2: Map with Predefined Locations
        </h2>
        <p className="text-gray-600">
          This example shows a map with locations that already have coordinates.
        </p>
        <MapComponent
          locations={sampleLocations}
          height="400px"
          className="border rounded-lg shadow-lg"
        />
      </div>

      {/* Example 3: Map with route */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Example 3: Map with Route
        </h2>
        <p className="text-gray-600">
          This example shows a map with a driving route between destinations.
        </p>
        <MapComponent
          locations={sampleLocations}
          showRoute={true}
          height="400px"
          className="border rounded-lg shadow-lg"
        />
      </div>

      {/* Example 4: Map with click handlers */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Example 4: Interactive Map
        </h2>
        <p className="text-gray-600">
          This example shows a map with click handlers and custom styling.
        </p>
        <MapComponent
          addresses={[
            "Golden Gate Bridge, San Francisco, CA",
            "Alcatraz Island, San Francisco, CA",
          ]}
          onLocationClick={handleLocationClick}
          center={[-122.4194, 37.7749]} // San Francisco
          zoom={12}
          height="400px"
          className="border rounded-lg shadow-lg"
        />
        {selectedLocation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900">Selected Location:</h3>
            <p className="text-blue-800">
              {selectedLocation.title || selectedLocation.address}
            </p>
            <p className="text-blue-700 text-sm">
              {selectedLocation.description}
            </p>
          </div>
        )}
      </div>

      {/* Example 5: Custom sized map */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Example 5: Custom Sized Map
        </h2>
        <p className="text-gray-600">
          This example shows a map with custom dimensions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MapComponent
            addresses={["London Eye, London, UK"]}
            height="300px"
            width="100%"
            className="border rounded-lg shadow-lg"
          />
          <MapComponent
            addresses={["Big Ben, London, UK"]}
            height="300px"
            width="100%"
            className="border rounded-lg shadow-lg"
          />
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Usage Instructions
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">
              1. Environment Setup
            </h3>
            <p className="text-gray-600">
              Add your Mapbox access token to your environment variables:
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm mt-1">
              NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">2. Basic Usage</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {`import MapComponent from './components/MapComponent';

// With addresses
<MapComponent addresses={['Address 1', 'Address 2']} />

// With locations
<MapComponent locations={[
  {
    id: '1',
    address: 'Some Address',
    lat: 40.7128,
    lng: -74.0060,
    title: 'Location Title',
    description: 'Location Description'
  }
]} />`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">3. Available Props</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <code className="bg-gray-200 px-1 rounded">addresses</code> -
                Array of address strings to geocode
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">locations</code> -
                Array of location objects with coordinates
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">center</code> - Map
                center coordinates [lng, lat]
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">zoom</code> - Initial
                zoom level
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">height</code> - Map
                height (default: &quot;400px&quot;)
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">width</code> - Map
                width (default: &quot;100%&quot;)
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">showRoute</code> -
                Show driving route between locations
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  onLocationClick
                </code>{" "}
                - Callback when location is clicked
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">className</code> -
                Additional CSS classes
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapExample;
