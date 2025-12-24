import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnlockLogDto } from '../models/unlock-log.model';

@Injectable({ providedIn: 'root' })
export class UnlockLogsService {
  private base = '/api/admin/unlock-logs';

  constructor(private http: HttpClient) {}

  getLogs(
    page = 1,
    pageSize = 20,
    search?: string,
    propertyId?: string,
    userId?: string,
    from?: string,
    to?: string
  ): Observable<{ total: number; page: number; pageSize: number; items: UnlockLogDto[] }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) params = params.set('search', search);
    if (propertyId) params = params.set('propertyId', propertyId);
    if (userId) params = params.set('userId', userId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<{ total: number; page: number; pageSize: number; items: UnlockLogDto[] }>(
      this.base,
      { params }
    );
  }

  exportCsv(search?: string, from?: string, to?: string): Observable<Blob> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
