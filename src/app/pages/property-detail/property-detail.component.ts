import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactService, OwnerContactResponse } from '../../services/contact.service';
import { ToastService } from '../../services/toast.service';
import { PropertyUpdatesService } from '../../services/property-updates.service';
import { Location } from '@angular/common';

interface PropertyMediaApi {
  id: string;
  url?: string;
  publicUrl?: string;
  contentType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  sortOrder?: number;
  createdAt?: string;
  isCover?: boolean;
  path?: string;
}

interface PropertyDetailApi {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  price?: number;
  city?: string;
  locality?: string;
  landSize?: number;
  sizeUnit?: number;
  coverImageUrl?: string;
  isFeatured?: boolean;
  listedAt?: string;
  updatedAt?: string;
  status?: string;
  media?: PropertyMediaApi[];
  roadAccess?: string;
  facing?: string;
  plotType?: string;
  brokerage?: string;
  isSold?: boolean;
  soldAt?: string | null;
}

interface PropertyDetail {
  id: string;
  title: string;
  location: string;
  price: number;
  size: string;
  description?: string;
  premium?: boolean;
  images: string[];
  coverImageUrl: string;
  status?: string | null;
  listedOn?: string | null;
  roadAccess?: string | null;
  facing?: string | null;
  plotType?: string | null;
  brokerage?: string | null;
  isSold?: boolean;
  soldAt?: string | null;
  ownerId?: string | null;
}

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.scss'],
})
export class PropertyDetailComponent implements OnInit {
  property: PropertyDetail | null = null;
  propertyId: string | null = null;

  loading = false;
  loadError = '';

  selectedImageUrl = 'assets/images/property-placeholder.jpg';
  currentIndex = 0;

  showFreeContact = false;
  showPremiumPrompt = false;
  showOwnerContact = false;
  isProcessing = false;
  ownerContact?: OwnerContactResponse | null;
  unlockInfo?: { price?: number; currency?: string; unlockEndpoint?: string } | null;
  isUnlocking = false;

  isPremiumUser = false;

  isOwner = false;
  isAdmin = false;

  private readonly base = environment.apiUrl;
  private readonly placeholderImage = 'assets/images/property-placeholder.jpg';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private contactService: ContactService,
    public toastService: ToastService,
    private propertyUpdates: PropertyUpdatesService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id');

    if (!this.propertyId) {
      this.loadError = 'Invalid property id.';
      return;
    }

    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { property?: PropertyDetail } | undefined;
    if (state?.property) {
      this.property = state.property;
      this.selectedImageUrl =
        state.property.coverImageUrl ||
        state.property.images?.[0] ||
        this.placeholderImage;
    }

    this.fetchFromApi(this.propertyId);
  }

  private fetchFromApi(id: string) {
    this.loading = true;
    this.loadError = '';

    this.http
      .get<PropertyDetailApi>(`${this.base}/Properties/${id}`)
      .pipe(
        take(1),
        catchError((err) => {
          this.loading = false;
          console.error('[PropertyDetail] API error', err);
          this.loadError = err?.error?.message || 'Failed to load property details.';
          return of(null);
        })
      )
      .subscribe((api) => {
        this.loading = false;
        if (!api) return;

        const locationParts = [api.locality, api.city].filter(Boolean);
        const location = locationParts.join(', ') || 'Location not specified';

        let unit = '';
        switch (api.sizeUnit) {
          case 0: unit = 'Sqft'; break;
          case 1: unit = 'Cent'; break;
          case 2: unit = 'Acre'; break;
          default: unit = ''; break;
        }

        const size = api.landSize && unit ? `${api.landSize} ${unit}` : api.landSize ? `${api.landSize}` : '-';

        const media = api.media ?? [];
        const allMediaUrls = (media.map((m) => m.publicUrl || m.url).filter((u): u is string => !!u)) || [];

        const coverFromMedia = media.find((m) => m.isCover && (m.publicUrl || m.url)) ?? null;
        const coverImageUrl =
          (coverFromMedia && (coverFromMedia.publicUrl || coverFromMedia.url)) ||
          api.coverImageUrl ||
          allMediaUrls[0] ||
          this.placeholderImage;

        const images: string[] = [];
        if (allMediaUrls.length) images.push(...allMediaUrls);
        else if (api.coverImageUrl) images.push(api.coverImageUrl);
        else images.push(this.placeholderImage);

        const listedOn = api.listedAt ? this.formatListedOn(api.listedAt) : null;

        const mapped: PropertyDetail = {
          id: api.id,
          title: api.title || `Property #${api.id}`,
          location,
          price: api.price ?? 0,
          size,
          description: api.description || 'Description not available.',
          premium: api.isFeatured ?? false,
          images,
          coverImageUrl,
          status: api.status || 'Approved',
          listedOn,
          roadAccess: api.roadAccess ?? null,
          facing: api.facing ?? null,
          plotType: api.plotType ?? null,
          brokerage: api.brokerage ?? null,
          isSold: api.isSold ?? false,
          soldAt: api.soldAt ?? null,
          ownerId: api.ownerId ?? null
        };

        this.property = mapped;
        this.currentIndex = 0;
        this.selectedImageUrl = images[0] || this.placeholderImage;

        // === determine current user and roles ===
        // Prefer parsing token stored under lp_token (your interceptor uses lp_token)
        const token = localStorage.getItem('lp_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || null;
        const claims = this.parseJwt(token);
        const currentUserId = claims?.sub || claims?.uid || localStorage.getItem('userId') || null;

        // normalize roles (token may contain 'role' or 'roles', or you may have saved role in localStorage)
        let rolesRaw = claims?.role ?? claims?.roles ?? localStorage.getItem('role') ?? '';
        let rolesStr = '';
        if (Array.isArray(rolesRaw)) rolesStr = rolesRaw.join(',').toLowerCase();
        else rolesStr = String(rolesRaw).toLowerCase();

        this.isOwner = !!(currentUserId && mapped.ownerId && currentUserId.toString().toLowerCase() === mapped.ownerId.toString().toLowerCase());
        this.isAdmin = rolesStr.includes('admin');

        // debug info
        console.log('Property loaded (debug):', {
          ownerId: mapped.ownerId,
          isSold: mapped.isSold,
          currentUserId,
          rolesStr
        });

        // check contact access
        this.checkContactAccess();
      });
  }

  // decode JWT payload (very small, tolerant decoder)
  private parseJwt(token?: string | null) {
    if (!token) return null;
    try {
      const base64 = token.split('.')[1];
      const json = decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/'))));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private formatListedOn(raw: string): string {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      return raw;
    }
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private checkContactAccess() {
    if (!this.property?.id) return;

    this.contactService.getOwnerContact(this.property.id)
      .pipe(
        catchError((err) => {
          if (err?.status === 402 && err?.error) {
            this.unlockInfo = {
              price: err.error?.price ?? 0,
              currency: err.error?.currency ?? 'INR',
              unlockEndpoint: err.error?.unlockEndpoint
            };
            this.showPremiumPrompt = true;
            this.showOwnerContact = false;
            this.showFreeContact = false;
            return of(null);
          }

          if (err?.status === 401 || err?.status === 403) {
            this.showFreeContact = false;
            this.showPremiumPrompt = false;
            this.showOwnerContact = false;
            return of(null);
          }

          console.error('checkContactAccess error', err);
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.ownerContact = res as OwnerContactResponse;
          this.showOwnerContact = true;
          this.showPremiumPrompt = false;
          this.showFreeContact = false;
        }
      });
  }

  nextImage() {
    if (!this.property || this.property.images.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.property.images.length;
    this.selectedImageUrl = this.property.images[this.currentIndex];
  }

  prevImage() {
    if (!this.property || this.property.images.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.property.images.length) % this.property.images.length;
    this.selectedImageUrl = this.property.images[this.currentIndex];
  }

  goToImage(i: number) {
    if (!this.property || i < 0 || i >= this.property.images.length) return;
    this.currentIndex = i;
    this.selectedImageUrl = this.property.images[i];
  }

  onFreeContactClick() {
    if (!this.property?.id) return;
    this.ownerContact = {
      propertyId: this.property.id,
      ownerId: '',
      ownerName: 'LandPortal Support',
      phone: '+91 99414 82833',
      email: 'support@absquare.com',
      whatsapp: '+91 99414 82833',
      isUnlocked: true
    };
    this.showFreeContact = true;
    this.showPremiumPrompt = false;
    this.showOwnerContact = false;
  }

  onPremiumContactClick() {
    if (!this.property?.id) return;

    this.showFreeContact = false;
    this.showPremiumPrompt = false;
    this.showOwnerContact = false;
    this.ownerContact = null;

    this.contactService.getOwnerContact(this.property.id)
      .pipe(
        catchError((err) => {
          if (err?.status === 402 && err?.error) {
            this.unlockInfo = {
              price: err.error?.price ?? 0,
              currency: err.error?.currency ?? 'INR',
              unlockEndpoint: err.error?.unlockEndpoint
            };
            this.showPremiumPrompt = true;
            return of(null);
          }
          console.error('getOwnerContact failed', err);
          this.unlockInfo = { price: 199, currency: 'INR', unlockEndpoint: undefined };
          this.showPremiumPrompt = true;
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.ownerContact = res as OwnerContactResponse;
          this.showOwnerContact = true;
          this.showPremiumPrompt = false;
          this.showFreeContact = false;
        }
      });
  }

  onUpgradeToPremium() {
    if (!this.property?.id) return;
    this.isUnlocking = true;

    const fakeToken = `sim-${Date.now()}`;

    this.contactService.unlockContact(this.property.id, fakeToken, this.unlockInfo?.price ?? 0)
      .pipe(
        catchError((err) => {
          console.error('unlock failed', err);
          this.toastService.show('Unlock failed. See console.');
          this.isUnlocking = false;
          return of(null);
        }),
        finalize(() => {
          this.isUnlocking = false;
        })
      )
      .subscribe((res: any) => {
        if (!res) return;
        const contact = (res.contact as OwnerContactResponse) ?? res;
        this.ownerContact = contact;
        this.showOwnerContact = true;
        this.showPremiumPrompt = false;
        this.showFreeContact = false;

        try {
          const arrRaw = localStorage.getItem('landportal_unlocked_contacts') || '[]';
          const arr = JSON.parse(arrRaw) as any[];
          const exists = arr.find(a => a.propertyId === this.property!.id);
          if (!exists) arr.push({ propertyId: this.property!.id, recordId: res.recordId, unlockedAt: new Date().toISOString() });
          localStorage.setItem('landportal_unlocked_contacts', JSON.stringify(arr));
        } catch (e) { }

        this.toastService.show('Owner contact unlocked ✔');
      });
  }

  fmtPrice(p: number) {
    if (!p) return 'Price on request';
    return '₹' + p.toLocaleString('en-IN');
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {this.router.navigate(['/']);}}


  private markPropertySoldRequest(id: string) {
  return this.http.put(`${this.base}/Properties/${id}/mark-sold`, {}, { observe: 'response' as 'body' });
  }

  private markPropertyAvailableRequest(id: string) {
  return this.http.put(`${this.base}/Properties/${id}/mark-available`, {}, { observe: 'response' as 'body' });
  }

  markAsSold() {
    if (!this.property?.id) return;
    if (!confirm('Mark this property as SOLD?')) return;

    this.isProcessing = true;
    this.markPropertySoldRequest(this.property.id)
      .pipe(
        take(1),
        catchError(err => {
          console.error('markAsSold error', err);
          this.toastService.show(err?.error?.message ?? 'Failed to mark property as sold');
          this.isProcessing = false;
          return of(null);
        }),
        finalize(() => {
          // don't clear isProcessing here if you rely on refetch finishing —
          // we'll also clear in the subscribe success/error handling below.
        })
      )
      .subscribe((resp: any) => {
        this.isProcessing = false;
        // If resp is null -> we already handled error in catchError
        if (!resp) return;

        const status = resp.status ?? (resp as any).status;
        if (status >= 200 && status < 300) {
          // Success — re-fetch fresh property data from API so UI matches server
          if (this.propertyId) {
            this.fetchFromApi(this.propertyId);
          } else {
            // fallback: set local flag and update UI reliably
            if (this.property) {
              this.property = { ...this.property, isSold: true, soldAt: new Date().toISOString() };
            }
          }
          this.propertyUpdates.notifyPropertyUpdated(this.property!.id);
          this.toastService.show('Property marked as SOLD');
        } else {
          this.toastService.show('Unexpected response from server');
        }
      });
  }

  markAsAvailable() {
  if (!this.property?.id) return;
  if (!confirm('Mark this property as AVAILABLE again?')) return;

  this.isProcessing = true;
  this.markPropertyAvailableRequest(this.property.id)
    .pipe(
      take(1),
      catchError(err => {
        console.error('markAsAvailable error', err);
        this.toastService.show(err?.error?.message ?? 'Failed to update property');
        this.isProcessing = false;
        return of(null);
      })
    )
    .subscribe((resp: any) => {
      this.isProcessing = false;
      if (!resp) return;

      const status = resp.status ?? (resp as any).status;
      if (status >= 200 && status < 300) {
        if (this.propertyId) {
          this.fetchFromApi(this.propertyId);
        } else {
          if (this.property) {
            this.property = { ...this.property, isSold: false, soldAt: null };
          }
        }
        this.propertyUpdates.notifyPropertyUpdated(this.property!.id);
        this.toastService.show('Property marked as AVAILABLE');
      } else {
        this.toastService.show('Unexpected response from server');
      }
    });
  }

  isFullscreen = false;
fullscreenImage: string | null = null;

openFullscreen(img: string) {
  this.fullscreenImage = img;
  this.isFullscreen = true;
  document.body.style.overflow = 'hidden';
}

closeFullscreen() {
  this.isFullscreen = false;
  this.fullscreenImage = null;
  document.body.style.overflow = '';
}

  
}
