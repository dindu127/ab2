import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Kpi, DashboardSummary } from '../models/dashboard.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly BASE_URL = environment.apiUrl.replace(/\/$/, '') + '/api';

  constructor(private http: HttpClient) {}

  getKpis(): Observable<Kpi[]> {
    const url = `${this.BASE_URL}/dashboard/kpis`;
    return this.http.get<Kpi[]>(url).pipe(
      catchError(err => {
        console.warn('KPI fetch failed, returning fallback', err);
        return of([
          { title: 'Total Properties', value: 432, sub: 'Active' },
          { title: 'Pending Approvals', value: 12, sub: 'Needs review' },
          { title: 'Premium Users', value: 63, sub: 'Monthly' },
          { title: 'Total Revenue', value: 124000, sub: 'This month' }
        ] as Kpi[]);
      })
    );
  }

  getRecentActivities(): Observable<string[]> {
    const url = `${this.BASE_URL}/dashboard/activities`;
    return this.http.get<string[]>(url).pipe(
      catchError(err => {
        console.warn('Activities fetch failed, returning fallback', err);
        return of([
          'User John registered (2 days ago)',
          'Property #234 submitted for approval',
          'Payment received from user Alice'
        ]);
      })
    );
  }

  getSummary(): Observable<DashboardSummary> {
    const url = `${this.BASE_URL}/dashboard/summary`;
    return this.http.get<any>(url).pipe(
      map(s => {
        // Defensive mapping: backend might use different field names
        const totalRevenue = s.totalRevenue ?? s.revenue ?? s.total_revenue ?? 0;
        return {
          totalProperties: s.totalProperties ?? s.total_properties ?? 0,
          pendingApprovals: s.pendingApprovals ?? s.pending_approvals ?? 0,
          premiumUsers: s.premiumUsers ?? s.premium_users ?? 0,
          totalRevenue,
          revenue: totalRevenue
        } as DashboardSummary;
      }),
      catchError(err => {
        console.warn('Summary fetch failed, returning fallback', err);
        return of({
          totalProperties: 432,
          pendingApprovals: 12,
          premiumUsers: 63,
          totalRevenue: 124000,
          revenue: 124000
        } as DashboardSummary);
      })
    );
  }

  getPropertiesMonthlySeries(): Observable<{ labels: string[]; data: number[] }> {
    const url = `${this.BASE_URL}/dashboard/properties/monthly`;
    return this.http.get<{ labels: string[]; data: number[] }>(url).pipe(
      catchError(err => {
        console.warn('Properties monthly series failed, using fallback', err);
        return of({
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          data: [5,12,9,14,20,11,16,18,22,15,10,8]
        });
      })
    );
  }

  getUsersMonthlySeries(): Observable<{ labels: string[]; data: number[] }> {
    const url = `${this.BASE_URL}/dashboard/users/monthly`;
    return this.http.get<{ labels: string[]; data: number[] }>(url).pipe(
      catchError(err => {
        console.warn('Users monthly series failed, using fallback', err);
        return of({
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          data: [2,4,6,8,5,7,10,6,9,11,3,4]
        });
      })
    );
  }
}
