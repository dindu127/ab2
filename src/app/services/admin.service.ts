import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSummaryDto {
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  createdAt: string;
}


export interface UnlockedContactDto {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  // owner (property owner)
  ownerName?: string;
  ownerPhone?: string;
  // who unlocked
  unlockedByUserId?: string;
  unlockedByUserEmail?: string;
  unlockedByUserName?: string;
  // payment fields (server may use different names)
  paymentId?: string;
  transactionId?: string;
  paymentAmount?: number;
  amount?: number;
  currency?: string;
  paymentStatus?: string;
  // timestamps
  createdAt?: string;   // server uses CreatedAt
  unlockedOn?: string;  // alternative name
  notes?: string;
}

export interface AdminPropertyDto {
  isFeatured: boolean;
  ownerEmail?: string;
  id: string;
  title: string;
  city?: string | null;
  locality?: string | null;
  price: number;
  ownerId: string;
  ownerName?: string | null;
  status: string;
  updatedAt: string;
  listedAt?: string | null;
  roadAccess?: string | null;
  facing?: string | null;
  plotType?: string | null;
  brokerage?: string | null;
}

export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private rawBase = (environment.apiUrl || '').trim();

  constructor(private http: HttpClient) {}

  private apiBase(): string {
    if (!this.rawBase) return '/api';
    let b = this.rawBase.replace(/\/+$/, ''); // remove trailing slashes
    if (!b.toLowerCase().endsWith('/api')) {
      b = `${b}/api`;
    }
    return b;
  }

  private adminBase(): string {
    return `${this.apiBase()}/admin`;
  }

  getUsers(): Observable<UserSummaryDto[]> {
    const url = `${this.adminBase()}/users`;
    // console.debug('AdminService.getUsers ->', url);
    return this.http.get<UserSummaryDto[]>(url);
  }

    getAllUnlockedContacts(page: number = 1, pageSize: number = 50): Observable<PagedResult<UnlockedContactDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PagedResult<UnlockedContactDto>>(`${this.apiBase}/unlocked-contacts`, { params });
  }

    getUnlockedContactsForUser(userId: string): Observable<UnlockedContactDto[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<UnlockedContactDto[]>(`${this.apiBase}/unlocked-contacts-for-user`, { params });
  }

  getPropertiesByStatus(status = 'Pending', page = 1, pageSize = 20): Observable<PagedResult<AdminPropertyDto>> {
    const url = `${this.adminBase()}/properties`;
    let params = new HttpParams()
      .set('status', status)
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PagedResult<AdminPropertyDto>>(url, { params });
  }

  approveProperty(propertyId: string): Observable<void> {
    const url = `${this.adminBase()}/properties/${propertyId}/approve`;
    return this.http.post<void>(url, null);
  }

  rejectProperty(propertyId: string): Observable<void> {
    const url = `${this.adminBase()}/properties/${propertyId}/reject`;
    return this.http.post<void>(url, null);
  }

    setFeatured(id: string, isFeatured: boolean) {
      return this.http.put(
        `${this.apiBase()}/properties/${id}/feature`,
        { isFeatured }
      );
    }

}
