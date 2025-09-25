import { Prisma } from '@prisma/client';

export type ItineraryUpdateInput = Prisma.itinerariesUpdateInput;

export interface ItineraryUpdateRequest {
  id: string;
  editedContent?: string;
  isEdited?: boolean;
  editedAt?: Date;
  updatedAt?: Date;
}