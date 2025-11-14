import { useState, useCallback } from 'react';
import { GeolocationResult } from '@/types/mapbox';
import { mapboxService } from '@/services/mapboxService';

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeolocationResult[]>([]);

  const geocodeAddress = useCallback(async (address: string, types?: string) => {
  if (!address.trim()) {
    setResults([]);
    setError(null);
    return [];
  }

  setLoading(true);
  setError(null);

  try {
    const geocodingResults = await mapboxService.geocodeAddress(address, types);
    setResults(geocodingResults);
    return geocodingResults; // Add this line to return the results
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
    setResults([]);
    return []; // Return empty array on error
  } finally {
    setLoading(false);
  }
}, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    loading,
    error,
    results,
    geocodeAddress,
    clearResults,
  };
};