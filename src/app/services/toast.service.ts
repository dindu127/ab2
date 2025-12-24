import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  // current message or null
  public message$ = new BehaviorSubject<string | null>(null);

  /**
   * Show a transient toast. Duration ~3000ms by default.
   */
  show(message: string, duration = 3000) {
    this.message$.next(message);
    if (duration > 0) {
      setTimeout(() => {
        this.clear();
      }, duration);
    }
  }

  clear() {
    this.message$.next(null);
  }
}
