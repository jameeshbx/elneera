"use client";

import React from "react";
import MapComponent from "./MapComponent";

const MapTest: React.FC = () => {
  const testAddresses = [
    "Times Square, New York, NY",
    "Central Park, New York, NY"
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Map Test</h2>
      <p className="mb-4">
        Access Token: {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? "Set" : "Missing"}
      </p>
      <MapComponent 
        addresses={testAddresses} 
        height="400px"
        showRoute={true}
      />
    </div>
  );
};

export default MapTest;
