import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, X, Loader2, Plus, Save, Edit2, MapPin, Users, Phone, User } from "lucide-react";

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

interface Service {
  time: string;
  activity: string;
  type?: string;
  description?: string;
  day?: number;
  date?: Date;
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

interface BookingItem {
  id: string;
  date: string;
  note: string;
}
interface CsvMetaData {
  quoteId: string;
  name: string;
  days: number;
  nights: number;
  startDate?: string;
  costINR?: number;
  costUSD?: number;
  guests?: number;
  adults?: number;
  kids?: number;
}

interface CsvServiceRow {
  day: string | number;
  time: string;
  activity: string;
  type?: string;
  description?: string;
}
interface ProgressItem {
  id?: string;
  date: string | Date;
  service?: string;
  status?: string;
  dmcNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
interface ReminderItem {
  id: string;
  date: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}
interface CustomerItinerary {
  activeStatus?: boolean;
  enquiryId?: string;
  customerId?: string;
  selectedDMCs?: Array<{
    status: string;
    dmc?: {
      name?: string;
    };
    dmcName?: string;
  }>;
}


const statusOptions = ["PENDING", "CONFIRMED", "CANCELLED", "NOT_INCLUDED", "IN_PROGRESS", "COMPLETED"];

const BookingProgressDashboard = () => {
  // Get enquiry ID from URL params
  const [itineraryId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id') || 'KASH001';
    }
    return 'KASH001';
  });

  const [enquiryId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('enquiryId');
    }
    return null;
  });

  const [locationParam] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('location');
    }
    return null;
  });

  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [, setItineraryServices] = useState<ItineraryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState<NewRow>({
    date: "",
    service: "",
    status: "PENDING",
    dmcNotes: ""
  });
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: ProgressData }>({});
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState<NewFeedback>({ note: "" });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState<NewReminder>({ date: '', note: '' });
  const [reminders, setReminders] = useState<BookingItem[]>([]);
  const [selectedDmcName, setSelectedDmcName] = useState("");
  const [csvItineraryId, setCsvItineraryId] = useState("");
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [assignedStaffName, setAssignedStaffName] = useState("Not Assigned");


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
    console.warn(`No specific CSV mapping found for location: ${loc}, using default GOA001.csv`);
    return 'GOA001.csv';
  };

  const parseCsvServices = (csvText: string) => {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const metaLine = lines[1];
  const servicesHeaderIndex = lines.findIndex(l => l.toLowerCase().startsWith('day,time,activity'));
  const serviceLines = servicesHeaderIndex >= 0 ? lines.slice(servicesHeaderIndex + 1) : [];

  const meta: Partial<CsvMetaData> = {};
  try {
    const metaValues = metaLine.split(',');
    Object.assign(meta, {
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
    });
  } catch (error) {
    console.error('Error parsing meta data:', error);
  }

  const services = serviceLines
    .map(line => {
      const [day, time, activity] = line.split(',');
      return { 
        day: day || '', 
        time: time || '', 
        activity: activity || '',
        type: 'activity' as const
      };
    })
.filter((row): row is { day: string; time: string; activity: string; type: 'activity' } => Boolean(row.activity));

  return { meta, services };
};
  const loadItineraryFromMockData = useCallback(async () => {
    try {
      let selectedLocation = locationParam || '';
      if (!selectedLocation && enquiryId) {
        try {
          const res = await fetch(`/api/enquiries/${enquiryId}`);
          if (res.ok) {
            const json = await res.json();
            selectedLocation = json?.data?.locations || '';
          }
        } catch { }
      }

      const filename = getCsvFilenameForLocation(selectedLocation);
      const csvFilenameId = filename.replace('.csv', '');
      setCsvItineraryId(csvFilenameId);

      const resCsv = await fetch(`/Itinerary/${filename}`);
      const csvText = await resCsv.text();
      const parsed = parseCsvServices(csvText);

      const data = {
        quoteId: parsed.meta.quoteId || csvFilenameId,
        name: parsed.meta.name || (selectedLocation ? `${selectedLocation} Package` : 'Itinerary'),
        days: parsed.meta.days || 3,
        nights: parsed.meta.nights || Math.max((parsed.meta.days || 3) - 1, 0),
        startDate: parsed.meta.startDate || new Date().toISOString().split('T')[0],
        costINR: parsed.meta.costINR || 0,
        costUSD: parsed.meta.costUSD || 0,
        guests: parsed.meta.guests || 0,
        adults: parsed.meta.adults || 0,
        kids: parsed.meta.kids || 0,
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

      // Create services data and extract for dropdown
      const servicesByDay: { [key: number]: Service[] } = {};
      const allServices: Service[] = [];

      data.services.forEach((row: CsvServiceRow) => {
  const day = typeof row.day === 'string' ? parseInt(row.day) : Number(row.day);
  if (!servicesByDay[day]) {
    servicesByDay[day] = [];
  }

        const service = {
          time: row.time,
          activity: row.activity,
          type: row.type || 'activity',
          description: row.description || row.activity
        };

        servicesByDay[day].push(service);

        // Filter out meals and add to available services
        const activity = row.activity.toLowerCase();
        const isMealService =
          activity.includes('breakfast') ||
          activity.includes('lunch') ||
          activity.includes('dinner') ||
          activity.includes('tea tasting') ||
          activity.includes('meal') ||
          activity.includes('food');

        if (!isMealService) {
          allServices.push({
            ...service,
            day,
            date: new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000)
          });
        }
      });

      setAvailableServices(allServices);

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
  }, [enquiryId, locationParam]);

  const loadProgressData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);

      const itineraryIdToUse = csvItineraryId || itineraryId;
      if (!itineraryIdToUse) return;

      const response = await fetch(`/api/booking-progress/${itineraryIdToUse}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) return;

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
       const formattedData = result.data.map((item: ProgressItem) => ({
  id: item.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
  date: item.date 
    ? (typeof item.date === 'string' 
      ? item.date.split('T')[0] 
      : new Date(item.date).toISOString().split('T')[0]) 
    : '',
  service: String(item.service || 'Unnamed Service').trim(),
  status: item.status || 'PENDING',
  dmcNotes: item.dmcNotes || null,
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString()
}));

        setProgressData(formattedData);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }, [itineraryId, enquiryId, csvItineraryId]);

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

  const loadReminderData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);

      const itineraryIdToUse = csvItineraryId || itineraryId;
      const response = await fetch(`/api/booking-reminder/${itineraryIdToUse}?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
const transformedData = result.data.map((item: ReminderItem) => ({
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

  // In the BookingProgressDashboard component, update the useEffect that fetches the assigned staff:

 const fetchStaffName = useCallback(async (staffId: string) => {
  console.log('Fetching staff with ID:', staffId);
  if (!staffId) {
    console.log('No staff ID provided');
    setAssignedStaffName("Not Assigned");
    return;
  }
  try {
    console.log(`Calling API: /api/auth/agency-add-user/${staffId}`);
    const res = await fetch(`/api/auth/agency-add-user/${staffId}`);
    const data = await res.json();
    console.log('Staff API response status:', res.status);
    console.log('Staff API response data:', data);
    
    if (res.ok) {
      // Check different possible name fields in the response
      const staffName = data.name || data.fullName || data.username || 'Staff Member';
      console.log('Resolved staff name:', staffName);
      setAssignedStaffName(staffName);
    } else {
      console.log('Error response from staff API:', data);
      // Show a more user-friendly message with the ID
      setAssignedStaffName(`Staff (${staffId.substring(0, 8)}...)`);
    }
  } catch (error) {
    console.error('Error in fetchStaffName:', error);
    // Show a shortened version of the ID if the API call fails
    setAssignedStaffName(`Staff (${staffId.substring(0, 8)}...)`);
  }
}, []);

useEffect(() => {
  const fetchEnquiryData = async () => {
    if (!enquiryId) {
      console.log('No enquiry ID provided');
      return;
    }
    
    try {
      console.log('Fetching enquiry data for ID:', enquiryId);
      const res = await fetch(`/api/enquiries/${enquiryId}`);
      const enquiryData = await res.json();
      console.log('Full enquiry data:', enquiryData);
      
      if (res.ok) {
        const staffId = enquiryData?.assignedStaff || 
                       enquiryData?.data?.assignedStaff || 
                       enquiryData?.staffId;
        
        console.log('Resolved staff ID:', staffId);
        
        if (staffId) {
          console.log('Found staff ID:', staffId);
          fetchStaffName(staffId);
        } else {
          console.log('No staff ID found in enquiry data');
          console.log('Available enquiry data keys:', Object.keys(enquiryData));
          if (enquiryData.data) {
            console.log('Data object keys:', Object.keys(enquiryData.data));
          }
          setAssignedStaffName("Not Assigned");
        }
      } else {
        console.log('Error response from enquiry API:', enquiryData);
        setAssignedStaffName("Error loading staff");
      }
    } catch (error) {
      console.error('Error in fetchEnquiryData:', error);
      setAssignedStaffName("Error");
    }
  };

  fetchEnquiryData();
}, [enquiryId, fetchStaffName]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      await loadItineraryFromMockData();
      await Promise.all([
        loadProgressData(),
        loadFeedbackData(),
        loadReminderData()
      ]);

      // Fetch assigned staff with improved logic matching itinerary-form
      if (enquiryId) {
        try {
          // First try to get enquiry data
          const enquiryRes = await fetch(`/api/enquiries?id=${enquiryId}`);
          if (enquiryRes.ok) {
            const enquiryData = await enquiryRes.json();

            // Try to get itinerary data for this enquiry
            let staffId = null;
            try {
              const itineraryResponse = await fetch(`/api/itineraries?enquiryId=${enquiryId}`);
              if (itineraryResponse.ok) {
                const itineraries = await itineraryResponse.json();
                if (itineraries && itineraries.length > 0) {
                  const existingItinerary = itineraries[0];
                  // Prefer staff from itinerary's enquiry relationship
                  staffId = existingItinerary?.enquiry?.assignedStaff || enquiryData?.assignedStaff;
                }
              }
            } catch (error) {
              console.error('Error fetching itinerary for staff:', error);
              staffId = enquiryData?.assignedStaff;
            }

            // If we have a staffId, fetch the staff name from userform
            if (staffId) {
              try {
                const staffRes = await fetch(`/api/auth/agency-add-user/${staffId}`);
                if (staffRes.ok) {
                  const staffData = await staffRes.json();
                  setAssignedStaffName(staffData.name || staffId);
                } else {
                  // If API call fails, use the staffId as fallback
                  setAssignedStaffName(staffId);
                }
              } catch (error) {
                console.error('Error fetching staff details:', error);
                setAssignedStaffName(staffId);
              }
            } else {
              setAssignedStaffName("Not Assigned");
            }
          } else {
            setAssignedStaffName("Not Assigned");
          }
        } catch (error) {
          console.error('Error fetching enquiry:', error);
          setAssignedStaffName("Not Assigned");
        }

        // Fetch selected DMC
        try {
          const params = new URLSearchParams();
          if (enquiryId) params.append('enquiryId', enquiryId);
          const sharedRes = await fetch(`/api/share-dmc?${params.toString()}`);
          if (sharedRes.ok) {
            const data = await sharedRes.json();
            const list = Array.isArray(data?.data) ? data.data : [];

           const customerItinerary = list.find((it: CustomerItinerary) =>
  it.activeStatus && (it.enquiryId === enquiryId || it.customerId === enquiryId)
) || list.find((it: CustomerItinerary) =>
  it.enquiryId === enquiryId || it.customerId === enquiryId
);

          if (customerItinerary?.selectedDMCs?.length) {
  const activeDmc = customerItinerary.selectedDMCs.find((dmc: { status: string }) =>
    dmc.status === 'QUOTATION_RECEIVED' || dmc.status === 'CONFIRMED'
  ) || customerItinerary.selectedDMCs[0];

              if (activeDmc) {
                const name = activeDmc?.dmc?.name || activeDmc?.dmcName || 'Selected DMC';
                setSelectedDmcName(name);
              } else {
                setSelectedDmcName('No DMC Selected');
              }
            } else {
              setSelectedDmcName('No DMC Selected');
            }
          } else {
            setSelectedDmcName('No DMC Selected');
          }
        } catch (error) {
          console.error('Error fetching DMC:', error);
          setSelectedDmcName('DMC Info Unavailable');
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [enquiryId, itineraryId, locationParam, loadItineraryFromMockData, loadProgressData, loadFeedbackData, loadReminderData]);

  const handleAddProgress = async () => {
    if (!newRow.date || !newRow.service.trim()) {
      alert('Date and Service are required');
      return;
    }

    setSaving(true);

    try {
      const params = new URLSearchParams();
      if (enquiryId) params.append('enquiryId', enquiryId);

      const itineraryIdToUse = csvItineraryId || itineraryId;
      if (!itineraryIdToUse) {
        throw new Error('No valid itinerary ID found');
      }

      const response = await fetch(`/api/booking-progress/${itineraryIdToUse}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          date: newRow.date,
          service: newRow.service,
          status: newRow.status || 'PENDING',
          dmcNotes: newRow.dmcNotes || null,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add progress');
      }

      const result = await response.json();

      if (result.success) {
        const newProgress = {
          id: result.data?.id || `temp-${Date.now()}`,
          date: result.data?.date || newRow.date,
          service: newRow.service,
          status: result.data?.status || newRow.status || 'PENDING',
          dmcNotes: result.data?.dmcNotes || newRow.dmcNotes || null,
          createdAt: result.data?.createdAt || new Date().toISOString(),
          updatedAt: result.data?.updatedAt || new Date().toISOString()
        };

        setProgressData(prev => [...prev, newProgress]);
        setNewRow({ date: "", service: "", status: "PENDING", dmcNotes: "" });
        setShowAddProgressModal(false);
      }

    } catch (error) {
      console.error('Error adding progress:', error);
      alert('Failed to add progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (item: ProgressData) => {
    setEditingRow(item.id);
    setEditingValues({
      ...editingValues,
      [item.id]: { ...item }
    });
  };

  const handleUpdateEditingValue = (id: string, field: string, value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

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
          setProgressData(prev => prev.map(p =>
            p.id === id ? {
              ...result.data,
              date: new Date(result.data.date).toISOString().split('T')[0]
            } : p
          ));

          setEditingRow(null);
          const newEditingValues = { ...editingValues };
          delete newEditingValues[id];
          setEditingValues(newEditingValues);
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
    setSaving(false);
  };

  const handleCancelEdit = (id: string) => {
    setEditingRow(null);
    const newEditingValues = { ...editingValues };
    delete newEditingValues[id];
    setEditingValues(newEditingValues);
  };

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
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
    }
    setSaving(false);
  };

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
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
    setSaving(false);
  };

  const selectService = (service: Service) => {
    setNewRow(prev => ({ ...prev, service: service.activity }));
    setShowServiceDropdown(false);
  };

  const AddProgressModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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
            <div className="relative">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Select or type service name"
                value={newRow.service}
                onChange={e => setNewRow(prev => ({ ...prev, service: e.target.value }))}
                onFocus={() => setShowServiceDropdown(true)}
                disabled={saving}
              />
              {showServiceDropdown && availableServices.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableServices.map((service, idx) => (
                    <div
                      key={idx}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectService(service)}
                    >
                      <div className="font-medium text-sm text-gray-800">{service.activity}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Day {service.day} • {service.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Adding...' : 'Add Progress'}
          </button>
        </div>
      </div>
    </div>
  );

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
            onChange={e => setNewFeedback({ note: e.target.value })}
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
            {itineraryData?.package || 'Loading...'} - {csvItineraryId || itineraryId}
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
                                <input
                                  type="text"
                                  value={editedItem.service}
                                  onChange={e => handleUpdateEditingValue(item.id, 'service', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  placeholder="Enter service"
                                  disabled={saving}
                                />
                              ) : (
                                <div className="font-medium">{item.service}</div>
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
                    Start Date: {itineraryData?.startDate ? new Date(itineraryData.startDate).toLocaleDateString() : 'Loading...'}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-600 font-medium">Package:</span>
                      <div className="text-gray-900 mt-0.5">{itineraryData?.name || 'Loading...'}</div>
                    </div>
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

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 flex-shrink-0 mt-0.5">💰</div>
                    <div className="flex-1">
                      <span className="text-gray-600 font-medium">Cost:</span>
                      <div className="text-gray-900 mt-0.5">
                        {itineraryData ? `₹${itineraryData.costINR?.toLocaleString()} / ${itineraryData.costUSD}` : 'Loading...'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">Quote ID:</span>
                    <span className="text-gray-900">{csvItineraryId || itineraryId}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-600 font-medium">DMC:</span>
                      <div className="text-gray-900 mt-0.5">{selectedDmcName || 'Loading...'}</div>
                    </div>
                  </div>
                 <div className="flex items-center gap-2 mt-2">
  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
  <div>
    <span className="text-sm font-medium text-gray-600">Assigned Staff:</span>
    <span className="text-sm text-gray-900 ml-1">{ assignedStaffName}</span>
  </div>
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