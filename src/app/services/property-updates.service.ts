// src/app/services/property-updates.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PropertyUpdatesService {
  private updates$ = new Subject<string>();

  notifyPropertyUpdated(propertyId: string) {
    if (!propertyId) return;
    try {
      this.updates$.next(propertyId);
    } catch { /* no-op */ }
  }

  onPropertyUpdated(): Observable<string> {
    return this.updates$.asObservable();
  }
}
