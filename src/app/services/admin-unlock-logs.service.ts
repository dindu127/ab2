import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UnlockLog {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  unlockedByUserId: string;
  unlockedByUserName?: string;
  unlockedByUserEmail?: string;
  paymentId?: string;
  paymentAmount?: number;
  currency?: string;
  paymentStatus?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUnlockLogsService {
  [x: string]: any;
  private base = '/api/admin/unlock-logs';

  constructor(private http: HttpClient) {}

  getLogs(page = 1, pageSize = 20, filters: any = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    Object.keys(filters || {}).forEach(k => {
      if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') {
        params = params.set(k, filters[k].toString());
      }
    });

    return this.http.get(this.base, { params });
  }

  exportCsv(filters: any = {}, p0: Date | undefined, p1: Date | undefined): Observable<Blob> {
    let params = new HttpParams();
    Object.keys(filters || {}).forEach(k => {
      if (filters[k]) params = params.set(k, filters[k].toString());
    });
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
