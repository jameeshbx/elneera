# MapComponent Integration Guide

This guide shows how to integrate the MapComponent into different parts of your trekking-miles-b2b application.

## Quick Setup

1. **Add Mapbox Access Token**

   ```bash
   # Add to your .env.local file
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```

2. **Import the Component**
   ```tsx
   import MapComponent from "@/components/MapComponent";
   ```

## Integration Examples

### 1. Itinerary Page Integration

Add the map to show all destinations in an itinerary:

```tsx
// app/agency/dashboard/Itenary-view/page.tsx
import MapComponent from "@/components/MapComponent";

export default function ItineraryViewPage() {
  const itineraryDestinations = [
    "Taj Mahal, Agra, India",
    "Red Fort, Delhi, India",
    "Gateway of India, Mumbai, India",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Itinerary Overview</h1>

      {/* Map showing all destinations */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Destination Map</h2>
        <MapComponent
          addresses={itineraryDestinations}
          showRoute={true}
          height="500px"
          className="rounded-lg"
        />
      </div>

      {/* Rest of your itinerary content */}
    </div>
  );
}
```

### 2. DMC Management Integration

Show DMC locations on a map:

```tsx
// app/admin/dashboard/manage-DMC/page.tsx
import MapComponent from "@/components/MapComponent";

export default function ManageDMCPage() {
  const dmcLocations = [
    {
      id: "dmc-1",
      address: "123 Travel Street, Mumbai, India",
      lat: 19.076,
      lng: 72.8777,
      title: "Mumbai DMC",
      description: "Premium travel services in Mumbai",
    },
    {
      id: "dmc-2",
      address: "456 Tourism Road, Delhi, India",
      lat: 28.7041,
      lng: 77.1025,
      title: "Delhi DMC",
      description: "Cultural tours and heritage experiences",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage DMCs</h1>

      {/* DMC Locations Map */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">DMC Locations</h2>
        <MapComponent
          locations={dmcLocations}
          height="400px"
          className="rounded-lg"
        />
      </div>

      {/* DMC management table */}
    </div>
  );
}
```

### 3. Agency Dashboard Integration

Show agency's service areas:

```tsx
// app/agency/dashboard/page.tsx
import MapComponent from "@/components/MapComponent";

export default function AgencyDashboardPage() {
  const serviceAreas = [
    "Kerala, India",
    "Goa, India",
    "Rajasthan, India",
    "Himachal Pradesh, India",
  ];

  const handleLocationClick = (location) => {
    console.log("Service area clicked:", location);
    // Navigate to area-specific page or show details
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Service Areas Map */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Service Areas</h2>
        <MapComponent
          addresses={serviceAreas}
          onLocationClick={handleLocationClick}
          height="400px"
          className="rounded-lg"
        />
      </div>

      {/* Dashboard stats */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
        {/* Your dashboard content */}
      </div>
    </div>
  );
}
```

### 4. Booking Details Integration

Show pickup and drop-off locations:

```tsx
// app/agency/dashboard/booking-details/page.tsx
import MapComponent from "@/components/MapComponent";

export default function BookingDetailsPage() {
  const bookingLocations = [
    {
      id: "pickup",
      address: "Mumbai Airport, Mumbai, India",
      lat: 19.0896,
      lng: 72.8656,
      title: "Pickup Location",
      description: "Mumbai Chhatrapati Shivaji International Airport",
    },
    {
      id: "hotel",
      address: "Taj Mahal Palace, Mumbai, India",
      lat: 18.9217,
      lng: 72.8347,
      title: "Hotel Location",
      description: "Taj Mahal Palace Hotel",
    },
    {
      id: "dropoff",
      address: "Gateway of India, Mumbai, India",
      lat: 18.9217,
      lng: 72.8347,
      title: "Drop-off Location",
      description: "Gateway of India Monument",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Booking Details</h1>

      {/* Journey Map */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Journey Route</h2>
        <MapComponent
          locations={bookingLocations}
          showRoute={true}
          height="500px"
          className="rounded-lg"
        />
      </div>

      {/* Booking details */}
    </div>
  );
}
```

### 5. Customer Feedback Integration

Show feedback locations:

```tsx
// app/(public)/feedback/page.tsx
import MapComponent from "@/components/MapComponent";

export default function FeedbackPage() {
  const feedbackLocations = [
    "Taj Mahal, Agra, India",
    "Jaipur Palace, Jaipur, India",
    "Varanasi Ghats, Varanasi, India",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customer Feedback</h1>

      {/* Feedback Locations */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Feedback Locations</h2>
        <MapComponent
          addresses={feedbackLocations}
          height="400px"
          className="rounded-lg"
        />
      </div>

      {/* Feedback form */}
    </div>
  );
}
```

## Customization Options

### Custom Styling

```tsx
<MapComponent
  addresses={addresses}
  className="border-2 border-blue-200 shadow-xl"
  height="600px"
  width="100%"
/>
```

### Custom Center and Zoom

```tsx
<MapComponent
  addresses={addresses}
  center={[72.8777, 19.076]} // Mumbai coordinates
  zoom={8}
  height="400px"
/>
```

### With Route and Click Handlers

```tsx
<MapComponent
  locations={locations}
  showRoute={true}
  onLocationClick={(location) => {
    // Handle location click
    console.log("Clicked:", location);
  }}
  height="500px"
/>
```

## Best Practices

1. **Performance**: Use `locations` prop when you already have coordinates to avoid geocoding API calls
2. **Error Handling**: Always provide fallback content when the map fails to load
3. **Accessibility**: Ensure the map has proper ARIA labels and keyboard navigation
4. **Mobile**: Test the map on mobile devices for touch interactions
5. **Loading States**: Show loading indicators while addresses are being geocoded

## Troubleshooting

### Map Not Loading

- Check `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set correctly
- Verify the token has the necessary permissions
- Check browser console for errors

### Addresses Not Geocoding

- Ensure addresses are specific and valid
- Check network connectivity
- Verify Mapbox API quotas

### TypeScript Errors

- Make sure all required props are provided
- Check that location objects match the `Location` interface
- Verify import paths are correct
