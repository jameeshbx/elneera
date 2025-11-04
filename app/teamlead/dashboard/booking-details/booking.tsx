import React, { useCallback, useEffect, useState } from 'react';
import {  Calendar,  X, Loader2, Plus, Save, Edit2, MapPin, Users, Phone, User } from "lucide-react";
import { Itinerary } from '@/lib/types';


// Type definitions
interface ProgressData {
  id: string;
  date: string;
  service: string;
  status: string;
  dmcNotes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Feedback {
  id: string;
  note: string;
  createdAt: string;
}

interface Reminder {
  id: string;
  date: string;
  note: string;
  isCompleted?: boolean;
  createdAt?: string;
}

interface Service {
  time: string;
  activity: string;
  type?: string;
  description?: string;
}

interface ItineraryService {
  day: number;
  date: Date;
  services: Service[];
}

interface ItineraryData {
  id: string;
  name: string;
  phone: string;
  email: string;
  startDate: string;
  endDate: string;
  days: number;
  nights: number;
  adults: number;
  kids: number;
  costINR: number;
  costUSD: number;
  locations: string;
  package: string;
}

interface NewRow {
  date: string;
  service: string;
  status: string;
  dmcNotes: string;
  customService?: string;
}

interface NewFeedback {
  note: string;
}

interface NewReminder {
  date: string;
  note: string;
}

// Define interfaces for mock data structure
interface MockServiceRow {
  day: string | number;
  time: string;
  activity: string;
  type?: string;
  description?: string;
}

interface MockItineraryData {
  quoteId: string;
  name: string;
  days: number;
  nights: number;
  startDate: string;
  costINR: number;
  costUSD: number;
  guests: number;
  adults: number;
  kids: number;
  services: MockServiceRow[];
}

interface EnquiryData {
  data?: {
    locations?: string;
    assignedStaff?: string;
  };
}

interface ShareDmcResponse {
  data?: Array<{
    enquiryId: string | null;
    customerId: string | null;
    activeStatus?: boolean;
    selectedDMCs?: Array<{
      status: string;
      dmc?: { name?: string };
      dmcName?: string;
    }>;
  }>;
}

interface DMCData {
  name: string;
}

interface SelectedDMC {
  dmc: DMCData;
}

interface BookingItem {
  id: string;
  date: string;
  note: string;
  selectedDMCs?: SelectedDMC[];
}

interface NewRow {
  date: string;
  service: string;
  customService?: string;
  status: string;
  dmc?: DMCData;
}

const statusOptions = ["PENDING", "CONFIRMED", "CANCELLED", "NOT_INCLUDED", "IN_PROGRESS", "COMPLETED"];

// Helper function to transform DMC data
const transformDMCData = (dmc: DMCData) => ({
  name: dmc.name
});

const BookingProgressDashboard = () => {
  // Get enquiry ID from URL params or use default
  const [itineraryId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id') || 'KASH001'; // Default to KASH001 for demo
    }
    return 'KASH001';
  });
  const [enquiryId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('enquiryId');
    }
    return null as string | null;
  });
  const [locationParam] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('location');
    }
    return null as string | null;
  });

  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [itineraryServices, setItineraryServices] = useState<ItineraryService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [newRow, setNewRow] = useState<NewRow>({ date: "", service: "", status: "PENDING", dmcNotes: "", customService: "" });
  const [showAddProgressModal, setShowAddProgressModal] = useState<boolean>(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Store edited values separately to avoid losing focus
  const [editingValues, setEditingValues] = useState<{ [key: string]: ProgressData }>({});

  // Feedback state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState<boolean>(false);
  const [newFeedback, setNewFeedback] = useState<NewFeedback>({ note: "" });

  // Reminder state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [newReminder, setNewReminder] = useState<NewReminder>({ date: "", note: "" });
  // Context persistence and overview extras
  const [assignedStaffName, setAssignedStaffName] = useState<string>("");
  const [selectedDmcName, setSelectedDmcName] = useState<string>("");
  const [csvItineraryId, setCsvItineraryId] = useState<string>("");
  const [, setFilteredServices] = useState<Service[]>([]);


  const getCsvFilenameForLocation = (loc: string): string => {
    const normalized = (loc || '').toLowerCase();
    if (normalized.includes('goa')) return 'GOA001.csv';
    if (normalized.includes('kerala')) return 'KER001.csv';
    if (normalized.includes('kashmir')) return 'KASH001.csv';
    if (normalized.includes('everest')) return 'EVER001.csv';
    if (normalized.includes('thailand')) return 'THAI001.csv';
    if (normalized.includes('rajasthan')) return 'RAJ001.csv';
    if (normalized.includes('himachal')) return 'HIM001.csv';
    if (normalized.includes('uttarakhand')) return 'UTT001.csv';
    if (normalized.includes('andaman')) return 'AND001.csv';
    if (normalized.includes('ladakh')) return 'LAD001.csv';
    // Default fallback - try to find a matching CSV file
    console.warn(`No specific CSV mapping found for location: ${loc}, using default GOA001.csv`);
    return 'GOA001.csv';
  };

  const parseCsvServices = (csvText: string): { meta: Partial<MockItineraryData>, services: MockServiceRow[] } => {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    const metaLine = lines[1];
    const servicesHeaderIndex = lines.findIndex(l => l.toLowerCase().startsWith('day,time,activity'));
    const serviceLines = servicesHeaderIndex >= 0 ? lines.slice(servicesHeaderIndex + 1) : [];

    let meta: Partial<MockItineraryData> = {};
    try {
      const metaValues = metaLine.split(',');
      meta = {
        quoteId: metaValues[0],
        name: metaValues[1],
        days: Number(metaValues[2]),
        nights: Number(metaValues[3]),
        startDate: metaValues[4],
        costINR: Number(metaValues[5]),
        costUSD: Number(metaValues[6]),
        guests: Number(metaValues[7]),
        adults: Number(metaValues[8]),
        kids: Number(metaValues[9] || 0),
      } as Partial<MockItineraryData>;
    } catch {}

    const services: MockServiceRow[] = serviceLines.map(line => {
      const [day, time, activity] = line.split(',');
      return { day: day || '', time: time || '', activity: activity || '' };
    }).filter(row => row.activity);

    return { meta, services };
  };

  // Load itinerary/services from CSV using location from enquiry or URL
  const loadItineraryFromMockData = useCallback(async () => {
    try {
      // Determine location: explicit param > enquiry lookup > fallback
      let selectedLocation = locationParam || '';
      if (!selectedLocation && enquiryId) {
        try {
          const res = await fetch(`/api/enquiries/${enquiryId}`);
          if (res.ok) {
            const json :EnquiryData  = await res.json();
            selectedLocation = json?.data?.locations || '';
          }
        } catch {}
      }

      const filename = getCsvFilenameForLocation(selectedLocation);
      const csvFilenameId = filename.replace('.csv', ''); // Extract KASH001, GOA001, etc.
      setCsvItineraryId(csvFilenameId);
      
      const resCsv = await fetch(`/Itinerary/${filename}`);
      const csvText = await resCsv.text();
      const parsed = parseCsvServices(csvText);
      const data: MockItineraryData = {
        quoteId: parsed.meta.quoteId || csvFilenameId,
        name: parsed.meta.name || (selectedLocation ? `${selectedLocation} Package` : 'Itinerary'),
        days: (parsed.meta.days as number) || 3,
        nights: (parsed.meta.nights as number) || Math.max(((parsed.meta.days as number) || 3) - 1, 0),
        startDate: parsed.meta.startDate || new Date().toISOString().split('T')[0],
        costINR: (parsed.meta.costINR as number) || 0,
        costUSD: (parsed.meta.costUSD as number) || 0,
        guests: (parsed.meta.guests as number) || 0,
        adults: (parsed.meta.adults as number) || 0,
        kids: (parsed.meta.kids as number) || 0,
        services: parsed.services,
      };

      const startDate = new Date(data.startDate);

      const itinerary: ItineraryData = {
        id: data.quoteId,
        name: data.name,
        phone: '+91-XXXXXXXXXX',
        email: 'customer@example.com',
        startDate: data.startDate,
        endDate: new Date(startDate.getTime() + (data.days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: data.days,
        nights: data.nights,
        adults: data.adults,
        kids: data.kids,
        costINR: data.costINR,
        costUSD: data.costUSD,
        locations: selectedLocation || data.name || 'India',
        package: data.name
      };

      setItineraryData(itinerary);

      // Create services data
      const servicesByDay: { [key: number]: Service[] } = {};

      data.services.forEach((row: MockServiceRow) => {
        const day = typeof row.day === 'string' ? parseInt(row.day) : row.day;
        if (!servicesByDay[day]) {
          servicesByDay[day] = [];
        }

        servicesByDay[day].push({
          time: row.time,
          activity: row.activity,
          type: row.type || 'activity',
          description: row.description || row.activity
        });
      });

      // Convert to ItineraryService array
      const services: ItineraryService[] = [];
      for (let day = 1; day <= data.days; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + (day - 1));

        services.push({
          day,
          date: dayDate,
          services: servicesByDay[day] || []
        });
      }

      setItineraryServices(services);

    } catch (error) {
      console.error('Error loading mock data:', error);
    }
  }, [itineraryId, enquiryId, locationParam]);

  // Load booking progress from API - filtered by customer
  const loadProgressData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);
      
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-progress/${itineraryIdToUse}?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const formattedData = result.data.map((item: ProgressData) => ({
            ...item,
            date: new Date(item.date).toISOString().split('T')[0]
          }));
          setProgressData(formattedData);
        }
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }, [itineraryId, enquiryId, csvItineraryId]);

  // Load feedback data from API - filtered by customer
  const loadFeedbackData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);
      
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-feedback/${itineraryIdToUse}?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFeedbacks(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading feedback data:', error);
    }
  }, [itineraryId, enquiryId, csvItineraryId]);

  // Load reminder data from API - filtered by customer
  const loadReminderData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);
      
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-reminder/${itineraryIdToUse}?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const transformedData = result.data.map((item: BookingItem) => ({
            ...item,
            date: new Date(item.date).toISOString().split('T')[0]
          }));
          setReminders(transformedData);
        }
      }
    } catch (error) {
      console.error('Error loading reminder data:', error);
    }
  }, [itineraryId, enquiryId, csvItineraryId]);

  useEffect(() => {
    if (itineraryServices.length > 0) {
      const relevantServices = itineraryServices.flatMap(day => 
        day.services
          .filter(service => {
            const activity = service.activity.toLowerCase();
            // Exclude meal-related services
            const isMealService = 
              activity.includes('breakfast') ||
              activity.includes('lunch') ||
              activity.includes('dinner') ||
              activity.includes('tea tasting') ||
              activity.includes('meal') ||
              activity.includes('food');
              
            // Include only relevant service types that are not meals
            return !isMealService && (
              activity.includes('accommodation') || 
              activity.includes('hotel') ||
              activity.includes('stay') ||
              activity.includes('activity') ||
              activity.includes('tour') ||
              activity.includes('sightseeing')
            );
          })
          .map(service => ({
            ...service,
            day: day.day,
            date: day.date
          }))
      );
      setFilteredServices(relevantServices);
    }
  }, [itineraryServices]);

  // Load data on component mount with better persistence
  // Fetch data based on enquiry ID
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/booking-details?enquiryId=${enquiryId}`);
      if (response.ok) {
        const data = await response.json();
        setProgressData(data.progressData);
        setItineraryData(data.itineraryData);
        setItineraryServices(data.itineraryServices);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (enquiryId) {
    fetchData();
  }
}, [enquiryId]);


  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);

      try {
        // Enhanced context persistence - restore from localStorage if URL lacks params
        try {
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            let currentEnquiryId = enquiryId;
            let currentItineraryId = itineraryId;
            let currentLocation = locationParam;

            // Try to restore from localStorage if URL parameters are missing
            if (!currentEnquiryId || !currentItineraryId) {
              const stored = localStorage.getItem('bookingContext');
              if (stored) {
                const ctx = JSON.parse(stored);
                currentEnquiryId = currentEnquiryId || ctx.enquiryId;
                currentItineraryId = currentItineraryId || ctx.itineraryId;
                currentLocation = currentLocation || ctx.location;
              }
            }

            // Update URL to reflect current context
            if (currentEnquiryId && !params.get('enquiryId')) {
              params.set('enquiryId', currentEnquiryId);
            }
            if (currentItineraryId && !params.get('id')) {
              params.set('id', currentItineraryId);
            }
            if (currentLocation && !params.get('location')) {
              params.set('location', currentLocation);
            }
            
            if (params.toString() !== window.location.search.substring(1)) {
              window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
            }

            // Save current context
            localStorage.setItem('bookingContext', JSON.stringify({ 
              enquiryId: currentEnquiryId, 
              itineraryId: currentItineraryId, 
              location: currentLocation 
            }));
          }
        } catch {}

        await loadItineraryFromMockData();
        await Promise.all([
          loadProgressData(),
          loadFeedbackData(),
          loadReminderData()
        ]);

        // Fetch assigned staff and selected DMC for overview - customer specific
        try {
          if (enquiryId) {
            const res = await fetch(`/api/enquiries/${enquiryId}`);
            if (res.ok) {
              const json = await res.json();
              setAssignedStaffName(json?.data?.assignedStaff || "");
            }
          }
        } catch {}

        try {
          const params = new URLSearchParams();
          if (enquiryId) params.append('enquiryId', enquiryId);
          const sharedRes = await fetch(`/api/share-dmc?${params.toString()}`);
          if (sharedRes.ok) {
            const data: ShareDmcResponse = await sharedRes.json();
            console.log('Initial DMC data for customer:', data);
            const list = Array.isArray(data?.data) ? data.data : [];
            
            // Find the active itinerary for this specific customer/enquiry
            const customerItinerary = list.find((it) => 
              it.activeStatus && 
              (it.enquiryId === enquiryId || it.customerId === enquiryId)
            ) || list.find((it) => 
              it.enquiryId === enquiryId || it.customerId === enquiryId
            );
            
            if (customerItinerary && customerItinerary.selectedDMCs && customerItinerary.selectedDMCs.length > 0) {
              // Find the DMC with the highest status or first active one
              const activeDmc = customerItinerary.selectedDMCs.find((dmc) => 
                dmc.status === 'QUOTATION_RECEIVED' || dmc.status === 'CONFIRMED'
              ) || customerItinerary.selectedDMCs[0];
              
              if (activeDmc) {
                const name = activeDmc?.dmc?.name || activeDmc?.dmcName || 'Selected DMC';
                setSelectedDmcName(name);
                console.log('Initial selected DMC for customer:', name);
              }
            } else {
              setSelectedDmcName('No DMC Selected');
            }
          }
        } catch (error) {
          console.error('Error fetching initial DMC data:', error);
          setSelectedDmcName('DMC Info Unavailable');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }

      setLoading(false);
    };

    fetchBookingDetails();
  }, [enquiryId, itineraryId, locationParam, loadItineraryFromMockData, loadProgressData, loadFeedbackData, loadReminderData]);

  // Add refresh functionality
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadItineraryFromMockData(),
        loadProgressData(),
        loadFeedbackData(),
        loadReminderData()
      ]);
      
      // Refresh assigned staff and DMC data
      if (enquiryId) {
        try {
          const res = await fetch(`/api/enquiries/${enquiryId}`);
          if (res.ok) {
            const json = await res.json();
            setAssignedStaffName(json?.data?.assignedStaff || "");
          }
        } catch {}

        try {
          const params = new URLSearchParams();
          if (enquiryId) params.append('enquiryId', enquiryId);
          const sharedRes = await fetch(`/api/share-dmc?${params.toString()}`);
          if (sharedRes.ok) {
            const data = await sharedRes.json();
            console.log('DMC data for customer:', data);
            const list = Array.isArray(data?.data) ? data.data : [];
            
            // Find the active itinerary for this specific customer/enquiry
            const customerItinerary = list.find((it: Itinerary) => 
  it.activeStatus && 
  (it.enquiryId === enquiryId || it.customerId === enquiryId)
) || list.find((it: Itinerary) => 
  it.enquiryId === enquiryId || it.customerId === enquiryId
);

if (customerItinerary && customerItinerary.selectedDMCs && customerItinerary.selectedDMCs.length > 0) {
  // Find the DMC with the highest status or first active one
  const activeDmc = customerItinerary.selectedDMCs.find((dmc: { status: string }) => 
    dmc.status === 'QUOTATION_RECEIVED' || dmc.status === 'CONFIRMED'
  ) || customerItinerary.selectedDMCs[0];
  
  if (activeDmc) {
    const name = activeDmc?.dmc?.name || activeDmc?.dmcName || 'Selected DMC';
    setSelectedDmcName(name);
    console.log('Selected DMC for customer:', name);
  }
} else {
  setSelectedDmcName('No DMC Selected');
}
          }
        } catch (error) {
          console.error('Error fetching DMC data:', error);
          setSelectedDmcName('DMC Info Unavailable');
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setLoading(false);
  }, [loadItineraryFromMockData, loadProgressData, loadFeedbackData, loadReminderData, enquiryId]);

  // Listen for parameter changes and auto-refresh
  useEffect(() => {
    const handleParamChange = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const newEnquiryId = currentParams.get("enquiryId");
      const newItineraryId = currentParams.get("itineraryId");
      
      if ((newEnquiryId && newEnquiryId !== enquiryId) || 
          (newItineraryId && newItineraryId !== itineraryId)) {
        // Force refresh data when parameters change
        setTimeout(() => {
          handleRefresh();
        }, 100);
      }
    };

    window.addEventListener('popstate', handleParamChange);
    return () => window.removeEventListener('popstate', handleParamChange);
  }, [enquiryId, itineraryId, handleRefresh]);

  // Add new progress row
  const handleAddProgress = async () => {
    if (!newRow.date || !newRow.service) return;

    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);
      
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-progress/${itineraryIdToUse}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newRow.date,
          service: newRow.service === 'custom' ? (newRow.customService || '') : newRow.service,
          status: newRow.status,
          dmc: newRow.dmc ? transformDMCData(newRow.dmc as DMCData) : null,
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const formattedData = {
            ...result.data,
            date: new Date(result.data.date).toISOString().split('T')[0]
          };
          setProgressData(prev => [...prev, formattedData]);
          setNewRow({ date: "", service: "", status: "PENDING", dmcNotes: "", customService: "" });
          setShowAddProgressModal(false);
        }
      } else {
        console.error('Failed to add progress');
      }

    } catch (error) {
      console.error('Error adding progress:', error);
    }
    setSaving(false);
  };

  // Start editing - create a copy of the item to edit
  const handleStartEdit = (item: ProgressData) => {
    setEditingRow(item.id);
    setEditingValues({
      ...editingValues,
      [item.id]: { ...item }
    });
  };

  // Update editing values
  const handleUpdateEditingValue = (id: string, field: string, value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  // Save progress row
  const handleSaveProgress = async (id: string) => {
    const editedItem = editingValues[id];
    if (!editedItem) return;

    setSaving(true);
    try {
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-progress/${itineraryIdToUse}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editedItem.date,
          service: editedItem.service,
          status: editedItem.status,
          dmcNotes: editedItem.dmcNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update the main progress data with saved values
          setProgressData(prev => prev.map(p =>
            p.id === id ? {
              ...result.data,
              date: new Date(result.data.date).toISOString().split('T')[0]
            } : p
          ));

          // Clear editing state
          setEditingRow(null);
          const newEditingValues = { ...editingValues };
          delete newEditingValues[id];
          setEditingValues(newEditingValues);
        }
      } else {
        console.error('Failed to save progress');
      }

    } catch (error) {
      console.error('Error saving progress:', error);
    }
    setSaving(false);
  };

  // Cancel editing
  const handleCancelEdit = (id: string) => {
    setEditingRow(null);
    const newEditingValues = { ...editingValues };
    delete newEditingValues[id];
    setEditingValues(newEditingValues);
  };

  // Add new feedback
  const handleAddFeedback = async () => {
    if (!newFeedback.note.trim()) return;

    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);
      
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-feedback/${itineraryIdToUse}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newFeedback.note })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFeedbacks(prev => [...prev, result.data]);
          setNewFeedback({ note: "" });
          setShowAddNoteModal(false);
        }
      } else {
        console.error('Failed to add feedback');
      }

    } catch (error) {
      console.error('Error adding feedback:', error);
    }
    setSaving(false);
  };

  // Add new reminder
  const handleAddReminder = async () => {
    if (!newReminder.date || !newReminder.note.trim()) return;

    setSaving(true);
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);
      
      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-reminder/${itineraryIdToUse}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newReminder.date,
          note: newReminder.note
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const formattedData = {
            ...result.data,
            date: new Date(result.data.date).toISOString().split('T')[0]
          };
          setReminders(prev => [...prev, formattedData]);
          setNewReminder({ date: "", note: "" });
          setShowReminderModal(false);
        }
      } else {
        console.error('Failed to add reminder');
      }

    
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
    setSaving(false);
  };

  // Add Progress Modal Component
  const AddProgressModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Add Progress</h2>
          <button
            onClick={() => setShowAddProgressModal(false)}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date*</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={newRow.date}
              onChange={e => setNewRow(prev => ({ ...prev, date: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service*</label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter service name"
                value={newRow.service}
                onChange={e => setNewRow(prev => ({ ...prev, service: e.target.value }))}
                disabled={saving}
                required
              />
              <button
                type="button"
                onClick={handleAddProgress}
                className="px-4 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:bg-gray-400 flex items-center justify-center"
                disabled={!newRow.service || saving}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {newRow.service === "custom" && (
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter custom service"
                value={newRow.customService}
                onChange={e => setNewRow(prev => ({ ...prev, customService: e.target.value }))}
                disabled={saving}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Booking Status*</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={newRow.status}
              onChange={e => setNewRow(prev => ({ ...prev, status: e.target.value }))}
              disabled={saving}
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DMC Notes</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg h-20 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
              placeholder="Add notes..."
              value={newRow.dmcNotes || ''}
              onChange={e => setNewRow(prev => ({ ...prev, dmcNotes: e.target.value }))}
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-8">
          <button
            onClick={handleAddProgress}
            className="w-full bg-green-800 text-white py-3 rounded-lg font-medium hover:bg-green-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={!newRow.date || !newRow.service || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Adding...' : 'Add Progress'}
          </button>
        </div>
      </div>
    </div>
  );

  // Add Note Modal Component
  const AddNoteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Add Customer Feedback</h2>
          <button
            onClick={() => setShowAddNoteModal(false)}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
            placeholder="Enter customer feedback or notes..."
            value={newFeedback.note || ''}
            onChange={e => setNewFeedback(prev => ({ ...prev, note: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="mt-8">
          <button
            onClick={handleAddFeedback}
            className="w-full bg-green-800 text-white py-3 rounded-lg font-medium hover:bg-green-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={!newFeedback.note.trim() || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Adding...' : 'Add Feedback'}
          </button>
        </div>
      </div>
    </div>
  );

  // Reminder Modal
  const AddReminderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Set Reminder</h2>
          <button
            onClick={() => setShowReminderModal(false)}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Date*</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={newReminder.date}
              onChange={e => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Note*</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
              placeholder="Enter reminder details..."
              value={newReminder.note || ''}
              onChange={e => setNewReminder(prev => ({ ...prev, note: e.target.value }))}
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-8">
          <button
            onClick={handleAddReminder}
            className="w-full bg-green-800 text-white py-3 rounded-lg font-medium hover:bg-green-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={!newReminder.date || !newReminder.note.trim() || saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Setting...' : 'Set Reminder'}
          </button>
        </div>
      </div>
    </div>
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'NOT_INCLUDED': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusDisplay = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Progress Dashboard
          </h1>
          <p className="text-gray-600">
            {itineraryData?.package || 'Loading...'} - {itineraryData?.id || itineraryId}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Progress Monitor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Booking Progress Monitor</h2>
                  <button
                    onClick={() => setShowAddProgressModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:bg-gray-400"
                    disabled={saving}
                  >
                    <Plus size={16} />
                    Add Progress
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DMC Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            <span>Loading progress...</span>
                          </div>
                        </td>
                      </tr>
                    ) : progressData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No progress entries yet. Click &quot;Add Progress&quot; to get started.
                        </td>
                      </tr>
                    ) : (
                      progressData.map((item) => {
                        const isEditing = editingRow === item.id;
                        const editedItem = editingValues[item.id] || item;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editedItem.date}
                                  onChange={e => handleUpdateEditingValue(item.id, 'date', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  disabled={saving}
                                />
                              ) : (
                                item.date ? new Date(item.date).toLocaleDateString() : ""
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <div className="flex flex-col space-y-2">
                                  <div className="flex space-x-2">
                                    <input
                                      type="text"
                                      value={editedItem.service}
                                      onChange={e => handleUpdateEditingValue(item.id, 'service', e.target.value)}
                                      className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      placeholder="Enter service"
                                      disabled={saving}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddProgress()}
                                      className="px-3 py-2 bg-green-800 text-white rounded hover:bg-green-900 disabled:bg-gray-400"
                                      disabled={saving}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {editedItem.date && `Date: ${new Date(editedItem.date).toLocaleDateString()}`}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-medium">{item.service}</div>
                                  <div className="text-xs text-gray-500">
                                    {item.date && `Date: ${new Date(item.date).toLocaleDateString()}`}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <select
                                  value={editedItem.status}
                                  onChange={e => handleUpdateEditingValue(item.id, 'status', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  disabled={saving}
                                >
                                  {statusOptions.map(opt => (
                                    <option key={opt} value={opt}>{formatStatusDisplay(opt)}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                                  {formatStatusDisplay(item.status)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                              {isEditing ? (
                                <textarea
                                  value={editedItem.dmcNotes || ''}
                                  onChange={e => handleUpdateEditingValue(item.id, 'dmcNotes', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-vertical focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  placeholder="Enter DMC notes..."
                                  disabled={saving}
                                />
                              ) : (
                                <div className="truncate" title={item.dmcNotes || ''}>
                                  {item.dmcNotes || "—"}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveProgress(item.id)}
                                    className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:text-gray-400"
                                    disabled={saving}
                                  >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit(item.id)}
                                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1 disabled:text-gray-400"
                                    disabled={saving}
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center gap-1 disabled:text-gray-400"
                                  disabled={saving}
                                >
                                  <Edit2 size={16} />
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Feedbacks */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Customer Feedback</h3>
                    <button
                      onClick={() => setShowAddNoteModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors disabled:bg-gray-400"
                      disabled={saving}
                    >
                      <Plus size={14} />
                      Add Note
                    </button>
                  </div>
                </div>
                <div className="p-6 max-h-64 overflow-y-auto">
                  <div className="space-y-4">
                    {feedbacks.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-4">No feedback entries yet.</div>
                    ) : (
                      feedbacks.map((fb) => (
                        <div key={fb.id} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-800 text-sm mb-2">{fb.note}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(fb.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Reminders */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Reminders</h3>
                    <button
                      onClick={() => setShowReminderModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors disabled:bg-gray-400"
                      disabled={saving}
                    >
                      <Plus size={14} />
                      Set Reminder
                    </button>
                  </div>
                </div>
                <div className="p-6 max-h-64 overflow-y-auto">
                  <div className="space-y-4">
                    {reminders.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-4">No reminders set.</div>
                    ) : (
                      reminders.map((rem) => (
                        <div key={rem.id} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-gray-800 text-sm mb-1">{rem.note}</p>
                              <span className="text-xs text-gray-600">
                                Due: {new Date(rem.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Itinerary Overview */}
            <div className="bg-gradient-to-b from-green-50 to-green-100 border border-green-200 rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Itinerary Overview
                </h3>

                <div className="mb-4">
                  <div className="bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium text-center">
                    Start Date: {itineraryData?.startDate || 'Loading...'}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Package:</span>
                    <span className="text-gray-900">{itineraryData?.name || 'Loading...'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Duration:</span>
                    <span className="text-gray-900">
                      {itineraryData ? `${itineraryData.days} Days, ${itineraryData.nights} Nights` : 'Loading...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Travelers:</span>
                    <span className="text-gray-900">
                      {itineraryData ? `${itineraryData.adults} Adults${itineraryData.kids ? `, ${itineraryData.kids} Kids` : ''}` : 'Loading...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex-shrink-0">💰</div>
                    <span className="text-gray-600 font-medium">Cost:</span>
                    <span className="text-gray-900">
                      {itineraryData ? `₹${itineraryData.costINR?.toLocaleString()} / ${itineraryData.costUSD}` : 'Loading...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="text-gray-900">Booking in progress</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Quote ID:</span>
                    <span className="text-gray-900">{itineraryData?.id || 'Loading...'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">DMC:</span>
                    <span className="text-gray-900">{selectedDmcName || '—'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Staff:</span>
                    <span className="text-gray-900">{assignedStaffName || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Promotion */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-medium mb-4 leading-tight">
                  Save Time On Calls And Emails! Invite Your DMC To Connect Via WhatsApp Business For Faster Updates.
                </h3>
                <button className="bg-white text-green-800 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                  START WHATSAPP CHATS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddProgressModal && <AddProgressModal />}
      {showAddNoteModal && <AddNoteModal />}
      {showReminderModal && <AddReminderModal />}
    </div>
  );
};

export default BookingProgressDashboard;