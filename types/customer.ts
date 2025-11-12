// types/customer.ts

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerBase {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
}

export interface PDFVersion {
  id: string;
  url: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  metadata?: {
    isEdited?: boolean;
    regeneratedAt?: string;
    editedData?: any;
    s3Key?: string;
    filename?: string;
  };
}

export interface Itinerary {
  id: string;
  dateGenerated: string;
  pdf: string;
  pdfStatus: string;
  activeStatus: boolean;
  itinerary: string;
  status: string;
  customerName: string;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  currency: string | null;
  pdfUrl: string | null;
  editedPdfUrl: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  // New properties for version handling
  displayVersion: string;
  versionNumber: number;
  activePdfUrl: string | null;
  pdfVersions: PDFVersion[];
  lastPdfRegeneratedAt?: string;
  editedData?: any;
}

export interface CustomerFeedback {
  id: string;
  customerId: string | null;
  itineraryId: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  documentUrl: string | null;
  documentName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SentItinerary {
  isManualUpload?: boolean;        
  manualPdfS3Key?: string | null;
  pdfVersion: string;
  id: string;
  date: string;
  customerId: string | null;
  enquiryId: string | null;
  itineraryId: string | null;
  customerName: string;
  email: string;
  whatsappNumber: string | null;
  notes: string | null;
  status: string;
  pdfUrl: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormData {
  name: string;
  email: string;
  whatsappNumber: string;
  notes: string;
  supportingDocument: File | null;
}

export interface NewNote {
  title: string;
  description: string;
  type: string;
  document: File | null;
}

export interface CustomerDashboardData {
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    whatsappNumber?: string;
  } | null;
  itineraries: Itinerary[];
  feedbacks: CustomerFeedback[];
  sentItineraries: SentItinerary[];
}