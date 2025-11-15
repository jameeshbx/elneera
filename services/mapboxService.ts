import { MapboxGeocodingResponse, GeolocationResult } from '@/types/mapbox';

class MapboxService {
  private accessToken: string;
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor() {
    this.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      console.warn('Mapbox access token not found');
    }
  }

  async geocodeAddress(address: string, types?: string): Promise<GeolocationResult[]> {
    if (!this.accessToken) {
      throw new Error('Mapbox access token is required');
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      let url = `${this.baseUrl}/${encodedAddress}.json?access_token=${this.accessToken}&limit=10`;
      
      // Add type filtering based on the search type
      if (types === 'country') {
        url += '&types=country';
      } else if (types === 'place') {
        url += '&types=place,locality,neighborhood';
      } else if (types === 'poi,address') {
        url += '&types=poi,address';
      } else {
        url += '&types=address,place,poi';
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      
      // Process and deduplicate results
      const uniqueResults = new Map<string, GeolocationResult>();
      
      data.features.forEach(feature => {
        // For countries, use the full country name
        const placeName = types === 'country' && feature.context 
          ? feature.context.find(ctx => ctx.id.includes('country'))?.text || feature.text 
          : feature.text;
          
        if (!uniqueResults.has(placeName)) {
          uniqueResults.set(placeName, {
            id: feature.id,
            latitude: feature.center[1],
            longitude: feature.center[0],
            placeName: placeName,
            address: feature.place_name,
            fullAddress: feature.place_name
          });
        }
      });
      
      return Array.from(uniqueResults.values());
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Mapbox access token is required');
    }

    try {
      const url = `${this.baseUrl}/${lng},${lat}.json?access_token=${this.accessToken}&limit=1`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      
      return data.features[0]?.place_name || 'Address not found';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }
}

export const mapboxService = new MapboxService();