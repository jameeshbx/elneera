import React from "react";
import { render } from "@testing-library/react";
import '@testing-library/jest-dom';
import MapComponent from "./MapComponent";

// Mock mapbox-gl to avoid issues in test environment
jest.mock("mapbox-gl", () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    addControl: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    fitBounds: jest.fn(),
    remove: jest.fn(),
    isStyleLoaded: jest.fn(() => true),
    getSource: jest.fn(() => null),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  FullscreenControl: jest.fn(),
  Popup: jest.fn(() => ({
    setHTML: jest.fn(() => ({
      setLngLat: jest.fn(() => ({
        addTo: jest.fn(),
      })),
    })),
  })),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn(() => ({
      setPopup: jest.fn(() => ({
        addTo: jest.fn(),
      })),
    })),
  })),
  LngLatBounds: jest.fn(() => ({
    extend: jest.fn(),
  })),
  accessToken: "test-token",
}));

// Mock the CSS import
jest.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

describe("MapComponent", () => {
  beforeEach(() => {
    // Mock fetch for geocoding
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [
              {
                center: [-74.006, 40.7128],
              },
            ],
          }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(
      <MapComponent addresses={["Test Address"]} height="400px" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with locations prop", () => {
    const locations = [
      {
        id: "1",
        address: "Test Location",
        lat: 40.7128,
        lng: -74.006,
        title: "Test Title",
        description: "Test Description",
      },
    ];

    const { container } = render(
      <MapComponent locations={locations} height="400px" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with both addresses and locations", () => {
    const addresses = ["Test Address"];
    const locations = [
      {
        id: "1",
        address: "Test Location",
        lat: 40.7128,
        lng: -74.006,
        title: "Test Title",
        description: "Test Description",
      },
    ];

    const { container } = render(
      <MapComponent
        addresses={addresses}
        locations={locations}
        height="400px"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders with custom props", () => {
    const { container } = render(
      <MapComponent
        addresses={["Test Address"]}
        center={[-74.006, 40.7128]}
        zoom={12}
        height="500px"
        width="800px"
        showRoute={true}
        className="custom-class"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    const { container } = render(
      <MapComponent
        addresses={["Test Address"]}
        onLocationClick={handleClick}
        height="400px"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
