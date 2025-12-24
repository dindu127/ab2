import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private redirecting = false;

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // read token from the same key AuthService saves to
    const token = localStorage.getItem('lp_token');
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          const url = (req.url || '').toLowerCase();
          const isAuthEndpoint = url.includes('/auth/login') ||
                                 url.includes('/auth/register') ||
                                 url.includes('/auth/refresh') ||
                                 url.includes('/auth/me');

          if (err.status === 401 && !isAuthEndpoint && !this.redirecting) {
            this.redirecting = true;
            try { localStorage.removeItem('lp_token'); } catch {}
            try {
              // navigate to login
              this.router.navigate(['/auth/login']).finally(() => { this.redirecting = false; });
            } catch {
              window.location.href = '/auth/login';
            }
          }
        }
        return throwError(() => err);
      })
    );
  }
}
