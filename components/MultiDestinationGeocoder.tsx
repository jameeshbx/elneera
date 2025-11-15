// components/MultiDestinationGeocoder.tsx
import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AddressGeocoder, { AddressGeocoderProps } from './AddressGeocoder';
import { GeolocationResult } from '@/types/mapbox';

interface MultiDestinationGeocoderProps extends Omit<AddressGeocoderProps, 'onLocationSelect' | 'value'> {
  destinations: string[];
  onAddDestination: (destination: string) => void;
  onRemoveDestination: (destination: string) => void;
  className?: string;
}

const MultiDestinationGeocoder: React.FC<MultiDestinationGeocoderProps> = ({
  destinations = [],
  onAddDestination,
  onRemoveDestination,
  placeholder = 'Search for a destination...',
  className = '',
  ...props
}) => {
  const handleLocationSelect = useCallback((location: GeolocationResult) => {
    onAddDestination(location.placeName);
  }, [onAddDestination]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="w-full min-h-12 p-3 border border-gray-300 rounded-md bg-white flex flex-wrap gap-2 items-center">
          {destinations.map((dest) => (
            <Badge 
              key={dest} 
              className="bg-orange-500 text-white px-3 py-1 text-xs flex items-center gap-1"
            >
              {dest}
              <X
                className="h-3 w-3 cursor-pointer hover:bg-orange-600 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDestination(dest);
                }}
              />
            </Badge>
          ))}
          <AddressGeocoder
            placeholder={destinations.length === 0 ? placeholder : "Add another destination..."}
            onLocationSelect={handleLocationSelect}
            value=""
            className="flex-1 min-w-[200px]"
            {...props}
          />
        </div>
      </div>
    </div>
  );
};

export default MultiDestinationGeocoder;