import { Itinerary } from "@/lib/schema";

export interface PDFVersion {
  id: string;
  url: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  metadata?: {
    regeneratedAt: string;
    editedData?: any;
  };
}

export interface ItineraryWithPDF extends Itinerary {
  pdfVersions?: PDFVersion[];
  activePdfVersion?: string;
  lastPdfRegeneratedAt?: string;
}

export interface PDFUploadResult {
  url: string;
  key: string;
  version?: number;
  isActive?: boolean;
}