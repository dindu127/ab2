import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OwnerContactResponse {
  propertyId: string;
  ownerId: string;
  ownerName: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  isUnlocked?: boolean;
}

export interface UnlockContactRequest {
  paymentToken?: string | null;
  amount?: number | null;
}

export interface UnlockContactResponse {
  message?: string;
  contact?: OwnerContactResponse;
  recordId?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Try to fetch owner contact (will return 402 if locked) */
  getOwnerContact(propertyId: string): Observable<OwnerContactResponse> {
    return this.http.get<OwnerContactResponse>(`${this.base}/properties/${propertyId}/contact-owner`);
  }

  /**
   * Unlock contact (payment flow).
   * backend accepts a payment token or amount==0 for simulation.
   * Returns UnlockContactResponse with contact + record id.
   */
  unlockContact(propertyId: string, paymentToken?: string | null, amount?: number | null): Observable<UnlockContactResponse> {
    const body: UnlockContactRequest = {
      paymentToken: paymentToken ?? null,
      amount: amount ?? null
    };
    return this.http.post<UnlockContactResponse>(`${this.base}/properties/${propertyId}/contact-owner/unlock`, body);
  }

  getUnlockedContacts() {return this.http.get<any[]>(
      `${this.base}/dashboard/unlocked-contacts`
    );
  }

}
