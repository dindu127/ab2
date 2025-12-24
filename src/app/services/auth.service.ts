import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  userId: string | null;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  role?: string | null;
  profilePhotoUrl?: string| null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  // storage keys
  private readonly TOKEN_KEY = 'lp_token';
  private readonly USER_ID_KEY = 'userId';
  private readonly ROLE_KEY = 'role';

  private _currentUser = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this._currentUser.asObservable();


  constructor(private http: HttpClient) {
    const token = this.getToken();
    if (token) {
      // warm fetch profile (silent). If it fails we ignore.
      this.getProfile().pipe(take(1)).subscribe({ next: () => {}, error: () => {} });
    }
  }

  // ---------------- TOKEN HELPERS ----------------
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveToken(t: string | null) {
    if (t) localStorage.setItem(this.TOKEN_KEY, t);
    else localStorage.removeItem(this.TOKEN_KEY);
  }

  // ---------------- PUBLIC HELPERS ----------------
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const role = localStorage.getItem(this.ROLE_KEY);
    if (!role) return false;
    return role.toLowerCase() === 'admin';
  }

  getCurrentUserSnapshot(): UserProfile | null {
    return this._currentUser.value;
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY) ?? null;
  }

  // ---------------- LOGIN ----------------
  login(payload: { email?: string; phone?: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/Auth/login`, payload).pipe(
      tap(res => {
        const token = res?.accessToken ?? res?.token ?? null;

        if (token) {
          this.saveToken(token);
        try {
          // STORE USER DATA IN LOCALSTORAGE (so other parts of the app can read)
          localStorage.setItem(this.USER_ID_KEY, (res?.userId ?? res?.user?.id ?? '')?.toString?.() ?? '');
          localStorage.setItem(this.ROLE_KEY, (res?.role ?? res?.user?.role ?? '')?.toString?.() ?? '');
         } catch { 
          // update BehaviorSubject if response includes user details
          const mapped: UserProfile = {
            userId: res?.userId?.toString?.() ?? res?.user?.id ?? null,
            email: res?.email ?? res?.user?.email ?? null,
            fullName: res?.fullName ?? res?.user?.fullName ?? null,
            phone: res?.phone ?? res?.user?.phone ?? null,
            role: res?.role ?? res?.user?.role ?? null
          };

          this._currentUser.next(mapped);}
        }
      })
    );
  }

  // ---------------- REGISTER ----------------
  register(payload: { email: string; phone: string; password: string; fullName: string }) {
    return this.http.post<any>(`${this.base}/Auth/register`, payload).pipe(
      tap(res => {
        const token = res?.accessToken ?? res?.token ?? null;

        if (token) {
          this.saveToken(token);

          localStorage.setItem(this.USER_ID_KEY, (res?.userId ?? res?.user?.id ?? '')?.toString?.() ?? '');
          localStorage.setItem(this.ROLE_KEY, (res?.role ?? res?.user?.role ?? '')?.toString?.() ?? '');

          const mapped: UserProfile = {
            userId: res?.userId?.toString?.() ?? res?.user?.id ?? null,
            email: res?.email ?? res?.user?.email ?? null,
            fullName: res?.fullName ?? res?.user?.fullName ?? null,
            phone: res?.phone ?? res?.user?.phone ?? null,
            role: res?.role ?? res?.user?.role ?? null
          };

          this._currentUser.next(mapped);
        }
      })
    );
  }

  // ---------------- LOGOUT ----------------
  logout(): void {
    this.saveToken(null);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this._currentUser.next(null);
  }

  refreshProfile() {
    return this.http.get<any>(`${environment.apiUrl}/auth/me`).pipe(
      tap(profile => {
        const mapped: UserProfile = {
          userId: profile?.id ?? profile?.userId ?? null,
          email: profile?.email ?? null,
          fullName: profile?.fullName ?? null,
          phone: profile?.phone ?? null,
          role: profile?.role ?? null,
          profilePhotoUrl: profile?.profilePhotoUrl ?? null
        };

        this._currentUser.next(mapped); // ⭐ THIS FIXES HEADER
      })
    );
  }

  updateProfile(data: any) {
    return this.http.put(`${environment.apiUrl}/auth/update-profile`, data).pipe(
      switchMap(() => this.refreshProfile())
    );
  }

  // ---------------- FETCH PROFILE ----------------
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.base}/Auth/me`).pipe(
      tap(profile => {
        if (!profile) return;

        // Save from profile endpoint
        localStorage.setItem(this.USER_ID_KEY, (profile?.id ?? profile?.userId ?? '')?.toString?.() ?? '');
        localStorage.setItem(this.ROLE_KEY, (profile?.role ?? '')?.toString?.() ?? '');

        const mapped: UserProfile = {
          userId: profile?.id?.toString?.() ?? profile?.userId ?? null,
          email: profile?.email ?? null,
          fullName: profile?.fullName ?? null,
          phone: profile?.phone ?? null,
          role: profile?.role ?? null,
          profilePhotoUrl: profile?.profilePhotoUrl ?? null
        };

        this._currentUser.next(mapped);
      })
    );
  }
 
  changePassword(data: {
  currentPassword: string;
  newPassword: string;}) {return this.http.put(`${this.base}/auth/change-password`,data,
  { responseType: 'text' } );}
 
  forgotPassword(data: { email?: string; phone?: string }) {
  return this.http.post(
    `${this.base}/auth/forgot-password`,
    data,
    { responseType: 'text' }  ); }

  resetPassword(data: { otp: string; newPassword: string }) {
    return this.http.post(
      `${this.base}/auth/reset-password`,
      data,  { responseType: 'text' }  );}

  sendEmailOtp(email: string) {
    return this.http.post(`${this.base}/auth/send-email-otp`, { email });
  }

  verifyEmailOtp(email: string, otp: string) {
    return this.http.post(`${this.base}/auth/verify-email-otp`, { email, otp });
  }

  uploadProfilePhoto(file: File) {
    const form = new FormData();
    form.append('file', file); // MUST be 'file'

    return this.http.post<any>(
      `${this.base}/Auth/profile-photo`,
      form
    );
  }
}
