# MapComponent

A reusable React component that uses Mapbox to display maps with multiple destinations. The component can accept an array of addresses and automatically convert them to latitude/longitude coordinates using Mapbox's Geocoding API.

## Features

- 🗺️ **Interactive Map**: Built with Mapbox GL JS for smooth, interactive maps
- 📍 **Address Geocoding**: Automatically converts addresses to coordinates
- 🎯 **Multiple Destinations**: Display multiple locations with numbered markers
- 🛣️ **Route Display**: Optional driving routes between destinations
- 🎨 **Customizable**: Flexible styling and configuration options
- 📱 **Responsive**: Works on all device sizes
- 🔧 **TypeScript**: Fully typed with TypeScript interfaces

## Installation

1. **Install Dependencies**

   ```bash
   yarn add mapbox-gl @types/mapbox-gl
   ```

2. **Get Mapbox Access Token**

   - Sign up at [Mapbox](https://www.mapbox.com/)
   - Create a new access token
   - Add it to your environment variables

3. **Environment Setup**
   Create or update your `.env.local` file:
   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```

## Basic Usage

### Simple Address List

```tsx
import MapComponent from "./components/MapComponent";

function MyComponent() {
  const addresses = [
    "Times Square, New York, NY",
    "Central Park, New York, NY",
    "Empire State Building, New York, NY",
  ];

  return <MapComponent addresses={addresses} height="400px" />;
}
```

### With Predefined Coordinates

```tsx
import MapComponent from "./components/MapComponent";

function MyComponent() {
  const locations = [
    {
      id: "1",
      address: "Eiffel Tower, Paris, France",
      lat: 48.8584,
      lng: 2.2945,
      title: "Eiffel Tower",
      description: "Iconic iron lattice tower",
    },
    {
      id: "2",
      address: "Louvre Museum, Paris, France",
      lat: 48.8606,
      lng: 2.3376,
      title: "Louvre Museum",
      description: "World's largest art museum",
    },
  ];

  return <MapComponent locations={locations} showRoute={true} height="400px" />;
}
```

### With Click Handlers

```tsx
import MapComponent from "./components/MapComponent";

function MyComponent() {
  const handleLocationClick = (location) => {
    console.log("Clicked:", location);
    // Handle location click
  };

  return (
    <MapComponent
      addresses={["Golden Gate Bridge, San Francisco, CA"]}
      onLocationClick={handleLocationClick}
      center={[-122.4194, 37.7749]}
      zoom={12}
      height="400px"
    />
  );
}
```

## Props

| Prop              | Type                           | Default              | Description                                  |
| ----------------- | ------------------------------ | -------------------- | -------------------------------------------- |
| `addresses`       | `string[]`                     | `[]`                 | Array of address strings to geocode          |
| `locations`       | `Location[]`                   | `[]`                 | Array of location objects with coordinates   |
| `center`          | `[number, number]`             | `[-74.006, 40.7128]` | Map center coordinates [longitude, latitude] |
| `zoom`            | `number`                       | `10`                 | Initial zoom level                           |
| `height`          | `string`                       | `'400px'`            | Map height                                   |
| `width`           | `string`                       | `'100%'`             | Map width                                    |
| `showRoute`       | `boolean`                      | `false`              | Show driving route between locations         |
| `onLocationClick` | `(location: Location) => void` | `undefined`          | Callback when location is clicked            |
| `className`       | `string`                       | `''`                 | Additional CSS classes                       |

## Location Interface

```typescript
interface Location {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  title?: string;
  description?: string;
}
```

## Features

### Automatic Geocoding

The component automatically converts addresses to coordinates using Mapbox's Geocoding API. If a location already has coordinates, it will use those instead.

### Smart Map Positioning

- **Single Location**: Centers the map on the location with zoom level 12
- **Multiple Locations**: Automatically fits all locations within the map bounds

### Interactive Markers

- Numbered markers for each destination
- Popup information on hover/click
- Custom click handlers for each location

### Route Display

When `showRoute={true}` and multiple locations are provided, the component will display a driving route between all destinations.

### Navigation Controls

- Built-in zoom controls
- Fullscreen toggle
- Touch-friendly on mobile devices

## Styling

The component uses Tailwind CSS classes and can be customized with:

- Custom `className` prop
- Custom `height` and `width` props
- CSS overrides for specific elements

## Error Handling

The component includes comprehensive error handling:

- Missing Mapbox access token
- Geocoding failures
- Network errors
- Invalid coordinates

## Performance

- Efficient marker management
- Automatic cleanup on unmount
- Debounced geocoding requests
- Optimized re-renders

## Browser Support

- Modern browsers with WebGL support
- Mobile browsers (iOS Safari, Chrome Mobile)
- IE11+ (with polyfills)

## Demo

Visit `/map-demo` to see the component in action with various examples.

## Troubleshooting

### Map Not Loading

1. Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set correctly
2. Verify the token has the necessary permissions
3. Check browser console for errors

### Addresses Not Geocoding

1. Ensure addresses are valid and specific
2. Check network connectivity
3. Verify Mapbox API quotas

### Markers Not Appearing

1. Check that coordinates are valid
2. Ensure the map has loaded before adding markers
3. Verify the `processedLocations` state

## License

This component is part of the trekking-miles-b2b project.
