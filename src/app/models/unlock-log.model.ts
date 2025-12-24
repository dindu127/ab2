export interface UnlockLogDto {
  id: string;
  propertyId: string;
  propertyTitle?: string | null;
  unlockedByUserId: string;
  unlockedByUserName?: string | null;
  unlockedByUserEmail?: string | null;
  paymentId?: string | null;
  paymentAmount?: number | null;
  currency?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
  notes?: string | null; // <-- make sure this exists
}


