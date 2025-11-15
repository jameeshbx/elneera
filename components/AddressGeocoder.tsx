import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeolocationResult } from '@/types/mapbox';

export interface AddressGeocoderProps {
  onLocationSelect?: (location: GeolocationResult) => void;
  placeholder?: string;
  value?: string;
  className?: string;
}

const AddressGeocoder: React.FC<AddressGeocoderProps> = ({
  onLocationSelect,
  placeholder = 'Enter an address...',
  value = '',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update internal state when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const { loading, error, results, geocodeAddress, clearResults } = useGeolocation();

  // Debounced search
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);

      if (value.length > 2) {
        const timeoutId = setTimeout(() => {
          geocodeAddress(value);
        }, 300);

        return () => clearTimeout(timeoutId);
      } else {
        clearResults();
      }
    },
    [geocodeAddress, clearResults]
  );

  const handleResultSelect = useCallback((result: GeolocationResult) => {
    setInputValue(result.placeName);
    clearResults();
    onLocationSelect?.(result);
  }, [onLocationSelect, clearResults]);

  const handleClear = useCallback(() => {
    setInputValue('');
    clearResults();
    inputRef.current?.focus();
  }, [clearResults]);

  return (
    <div className={`relative w-full max-w-md ${className}`.trim()}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4 text-center text-gray-500">
            Searching...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-red-300 rounded-lg shadow-lg">
          <div className="p-4 text-red-500">
            Error: {error}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.latitude}-${result.longitude}-${index}`}
              type="button"
              onClick={() => handleResultSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{result.placeName}</div>
              <div className="text-sm text-gray-500 mt-1">
                Lat: {result.latitude.toFixed(6)}, Lng: {result.longitude.toFixed(6)}
              </div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {result.fullAddress}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressGeocoder;