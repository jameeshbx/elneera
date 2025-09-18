import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

type EnquiryContext = {
  enquiryId: string | null;
  itineraryId: string | null;
  location: string | null;
};

export function useEnquiryData() {
  const searchParams = useSearchParams();
  const [enquiryContext, setEnquiryContext] = useState<EnquiryContext>({
    enquiryId: null,
    itineraryId: null,
    location: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load context from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEnquiryId = params.get('enquiryId');
    const urlItineraryId = params.get('itineraryId');
    const urlLocation = params.get('location');

    // Try to get from localStorage if not in URL
    const storedContext = localStorage.getItem('enquiryContext');
    const parsedContext = storedContext ? JSON.parse(storedContext) : null;

    const newContext: EnquiryContext = {
      enquiryId: urlEnquiryId || parsedContext?.enquiryId || null,
      itineraryId: urlItineraryId || parsedContext?.itineraryId || null,
      location: urlLocation || parsedContext?.location || null,
    };

    // Update URL if needed
    const newParams = new URLSearchParams();
    if (newContext.enquiryId) newParams.set('enquiryId', newContext.enquiryId);
    if (newContext.itineraryId) newParams.set('itineraryId', newContext.itineraryId);
    if (newContext.location) newParams.set('location', newContext.location);

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);

    // Save to state and localStorage
    setEnquiryContext(newContext);
    localStorage.setItem('enquiryContext', JSON.stringify(newContext));
    setIsLoading(false);
  }, [searchParams]);

  // Update context
  const updateContext = useCallback((updates: Partial<EnquiryContext>) => {
    setEnquiryContext(prev => {
      const newContext = { ...prev, ...updates };
      localStorage.setItem('enquiryContext', JSON.stringify(newContext));
      
      // Update URL
      const params = new URLSearchParams();
      if (newContext.enquiryId) params.set('enquiryId', newContext.enquiryId);
      if (newContext.itineraryId) params.set('itineraryId', newContext.itineraryId);
      if (newContext.location) params.set('location', newContext.location);
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
      
      return newContext;
    });
  }, []);

  // Clear context
  const clearContext = useCallback(() => {
    localStorage.removeItem('enquiryContext');
    setEnquiryContext({ enquiryId: null, itineraryId: null, location: null });
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  return {
    ...enquiryContext,
    isLoading,
    updateContext,
    clearContext,
  };
}

// API helper functions
export async function fetchEnquiryData(enquiryId: string) {
  const response = await fetch(`/api/enquiries/${enquiryId}`);
  if (!response.ok) throw new Error('Failed to fetch enquiry data');
  return response.json();
}

export async function fetchProgressData(enquiryId: string, itineraryId: string) {
  const params = new URLSearchParams({ enquiryId });
  const response = await fetch(`/api/booking-progress/${itineraryId}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch progress data');
  return response.json();
}

// Add similar functions for other data types (feedback, reminders, etc.)
