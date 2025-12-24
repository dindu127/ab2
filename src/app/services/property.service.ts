// src/app/services/property.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ===== Models used by Home (featured list + search) =====
export interface PropertyCard {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  sizeText: string;
  imageUrl: string;
  images?: string[];
  isFeatured?: boolean;
  isSold?: boolean;
  soldAt?: string | null;
}

// Filters used on the Home search form
export interface PropertySearchFilters {
  // If your UI exposes a "Location" dropdown that selects a city, set `location` here.
  // This service will map it to the `city` query param expected by the API.
  location?: string;

  // numeric filters
  minPrice?: number | null;
  maxPrice?: number | null;

  // free-form land size (text) - server expects minSize/maxSize numeric fields;
  // if you use "size" text input, you might map it to minSize or send to `search`.
  size?: string;

  // sorting key from UI: 'newest'|'priceAsc'|'priceDesc'|'sizeDesc' etc.
  sortBy?: string;
}

// Media DTO used by property detail when we enhance cards
interface PropertyMediaApi {
  id: string;
  url?: string;
  publicUrl?: string;
  contentType?: string;
  isCover?: boolean;
  sortOrder?: number;
}

// Detail DTO so we can call GET /Properties/{id}
interface PropertyDetailApi {
  id: string;
  title: string;
  description?: string;
  price?: number;
  city?: string;
  locality?: string;
  landSize?: number;
  sizeUnit?: number;
  coverImageUrl?: string;
  isFeatured?: boolean;
  media?: PropertyMediaApi[];
}

export interface PropertyListResponseApi {
  total: number;
  page: number;
  pageSize: number;
  items: any[];
}

// ===== Models for create + upload flow =====
export interface CreatePropertyRequest {
  title: string;
  description: string;
  price: number;
  city: string;
  locality: string;
  landSize: number;
  sizeUnit: number;
  roadAccess?: string | null;
  facing?: string | null;
  plotType?: string | null;
  brokerage?: string | null;
}

export interface UpdatePropertyRequest {
  title: string;
  description: string;
  price: number;
  city: string;
  locality: string;
  landSize: number;
  sizeUnit: number;
  roadAccess?: string | null;
  facing?: string | null;
  plotType?: string | null;
  brokerage?: string | null;
  IsFeatured?: boolean | null;
  CoverImageUrl?: string | null;
}

export interface PropertyCreateResponse {
  id?: string;
  propertyId?: string;
}

interface SignImageResponse {
  uploadUrl: string;
  blobPath?: string;
  objectName?: string;
  publicUrl?: string;
}

interface CommitImageResponse {
  publicUrl?: string;
  url?: string;
}
export interface CommitImageRequest {
  url: string;
  isCover?: boolean;
  sortOrder?: number;
  contentType?: string;
  sizeBytes?: number;   // ✅ ADD THIS
}


@Injectable({ providedIn: 'root' })
export class PropertyService {
  // normalize base URL (no trailing slash)
  private base = (environment.apiUrl || '').replace(/\/$/, '');
  private readonly placeholderImage = 'assets/images/property-placeholder.jpg';

  constructor(private http: HttpClient) {}

  // ----------------------------------------------------
  //  Helpers to build cards and add media[]
  // ----------------------------------------------------
  private mapListItemsToCards(items: any[]): PropertyCard[] {
    return items.map((p: any) => {
      const imageUrl = p?.coverImageUrl || this.placeholderImage;

      const sizeUnitText =
        p?.sizeUnit === 0 ? 'Sqft' :
        p?.sizeUnit === 1 ? 'Cent' :
        p?.sizeUnit === 2 ? 'Acre' : '';

      const sizeText =
        p?.landSize && sizeUnitText
          ? `${p.landSize} ${sizeUnitText}`
          : p?.landSize
            ? `${p.landSize}`
            : '';

      return {
        id: String(p?.id ?? ''),
        title: p?.title ?? '',
        subtitle: `${p?.city || ''}${p?.city && p?.locality ? ', ' : ''}${p?.locality || ''}`,
        price: p?.price ?? 0,
        sizeText,
        imageUrl,
        images: [imageUrl],
        isFeatured: p?.isFeatured,
        isSold: !!p?.isSold,
        soldAt: p?.soldAt ?? null
      } as PropertyCard;
    });
  }

  private enhanceCardsWithMedia(baseCards: PropertyCard[]): Observable<PropertyCard[]> {
    if (!baseCards.length) {
      return of([] as PropertyCard[]);
    }

    const detailCalls = baseCards.map((card) =>
      this.http.get<PropertyDetailApi>(`${this.base}/Properties/${card.id}`)
    );

    return forkJoin(detailCalls).pipe(
      map((details) =>
        baseCards.map((card, index) => {
          const detail = details[index];
          const media = detail?.media || [];

          const urls = media
            .map((m) => m.publicUrl || m.url)
            .filter((u): u is string => !!u);

          if (urls.length) {
            card.images = urls;
            card.imageUrl = urls[0];
          } else {
            card.images = [card.imageUrl || this.placeholderImage];
          }

          return card;
        })
      )
    );
  }

  // ----------------------------------------------------
  //  FEATURED PROPERTIES (paged) — returns items + total
  // ----------------------------------------------------
  getFeaturedPaged(page = 1, pageSize = 12, sortFromForm: any): Observable<{ items: PropertyCard[]; total: number; page: number; pageSize: number }> {
    const url = `${this.base}/Properties`;
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize))
      .set('onlyFeatured', 'true');

    return this.http.get<PropertyListResponseApi>(url, { params }).pipe(
      switchMap(res => {
        const rawItems = res.items || [];
        const baseCards = this.mapListItemsToCards(rawItems);
        if (!baseCards.length) {
          return of({ items: [] as PropertyCard[], total: res.total ?? 0, page: res.page ?? page, pageSize: res.pageSize ?? pageSize });
        }
        return this.enhanceCardsWithMedia(baseCards).pipe(
          map((cards) => ({ items: cards, total: res.total ?? 0, page: res.page ?? page, pageSize: res.pageSize ?? pageSize }))
        );
      })
    );
  }

  // ----------------------------------------------------
  //  SEARCH PROPERTIES (Home search bar) — reuse API
  //  NOTE: returns cards only (no paging)
  // ----------------------------------------------------
  searchProperties(filters: PropertySearchFilters | null, page = 1, pageSize = 50): Observable<PropertyCard[]> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    // Map `location` to backend `city` (your UI location dropdown selects a city)
    if (filters?.location) {
      params = params.set('city', filters.location.trim());
    }

    if (filters?.minPrice != null) {
      params = params.set('minPrice', String(filters.minPrice));
    }
    if (filters?.maxPrice != null) {
      params = params.set('maxPrice', String(filters.maxPrice));
    }

    // If the UI sends a size string, map it to minSize (or send it as `search` if you prefer free-text)
    if (filters?.size) {
      // try numeric parse first
      const n = Number(filters.size);
      if (!Number.isNaN(n)) params = params.set('minSize', String(n));
      else params = params.set('search', filters.size.trim());
    }

    // optional: support sending sort if UI provided sortBy
    if (filters?.sortBy) {
      // backend wants `sort` query param
      params = params.set('sort', filters.sortBy);
    }

    const url = `${this.base}/Properties`;

    return this.http.get<PropertyListResponseApi>(url, { params }).pipe(
      switchMap((res) => {
        const items = res.items || [];
        const baseCards = this.mapListItemsToCards(items);
        if (!baseCards.length) {
          return of([] as PropertyCard[]);
        }
        return this.enhanceCardsWithMedia(baseCards);
      })
    );
  }

  // ----------------------------------------------------
  //  SEARCH PROPERTIES (paged server-side) — filters optional
  // ----------------------------------------------------
  searchPropertiesPaged(
    filters?: PropertySearchFilters,
    page = 1,
    pageSize = 12,
    explicitSort?: string
  ): Observable<{ items: PropertyCard[]; total: number; page: number; pageSize: number }> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    // sort precedence: explicitSort argument -> filters.sortBy -> none
    const sortToSend = explicitSort ?? filters?.sortBy;
    if (sortToSend) {
      params = params.set('sort', sortToSend);
    }

    if (filters) {
      // Map known UI filter keys to backend query params
      if (filters.location) {
        // the UI uses "location" for the city dropdown; backend expects `city`
        params = params.set('city', filters.location.trim());
      }
      if (filters.minPrice != null) {
        params = params.set('minPrice', String(filters.minPrice));
      }
      if (filters.maxPrice != null) {
        params = params.set('maxPrice', String(filters.maxPrice));
      }

      if (filters.size) {
        const n = Number(filters.size);
        if (!Number.isNaN(n)) params = params.set('minSize', String(n));
        else params = params.set('search', filters.size.trim());
      }
    }

    return this.http.get<PropertyListResponseApi>(`${this.base}/Properties`, { params }).pipe(
      switchMap(res => {
        const raw = res.items || [];
        const baseCards = this.mapListItemsToCards(raw);
        if (!baseCards.length) {
          return of({ items: [], total: res.total ?? 0, page: res.page ?? page, pageSize: res.pageSize ?? pageSize });
        }
        return this.enhanceCardsWithMedia(baseCards).pipe(
          map(cards => ({
            items: cards,
            total: res.total ?? 0,
            page: res.page ?? page,
            pageSize: res.pageSize ?? pageSize
          }))
        );
      })
    );
  }

  /** Get distinct cities for filters */
  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/Properties/metadata/cities`);
  }

  /** Get distinct localities (optionally filtered by city) */
  getLocalities(city?: string): Observable<string[]> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    return this.http.get<string[]>(`${this.base}/Properties/metadata/localities`, { params });
  }

  // property.service.ts (inside class)
  markPropertySold(propertyId: string, soldAt?: string | null): Observable<void> {
    const url = `${this.base}/Properties/${propertyId}/mark-sold`;
    const body = soldAt ? { soldAt } : {};
    return this.http.put<void>(url, body);
  }

  markPropertyAvailable(propertyId: string): Observable<void> {
    const url = `${this.base}/Properties/${propertyId}/mark-available`;
    return this.http.put<void>(url, {});
  }

  // ----------------------------------------------------
  //  CREATE / UPDATE / UPLOAD helpers (unchanged)
  // ----------------------------------------------------
  createProperty(payload: CreatePropertyRequest): Observable<PropertyCreateResponse> {
    return this.http.post<PropertyCreateResponse>(`${this.base}/Properties`, payload);
  }

  uploadCoverImage(propertyId: string, file: File): Observable<string> {
    const signUrl = `${this.base}/properties/${propertyId}/images/sign`;
    const commitUrl = `${this.base}/properties/${propertyId}/images/commit`;

    return this.http.post<SignImageResponse>(signUrl, {
      fileName: file.name,
      contentType: file.type,
    }).pipe(
      switchMap(sign => {
        const headers = new HttpHeaders({ 'Content-Type': file.type || 'application/octet-stream' });
        return this.http.put<any>(sign.uploadUrl, file, { headers, responseType: 'text' as 'json' }).pipe(
          switchMap(() => {
            const blobPath = sign.blobPath || sign.objectName || sign.uploadUrl;
            return this.http.post<CommitImageResponse>(commitUrl, { blobPath });
          })
        );
      }),
      map(commit => commit.publicUrl || commit.url || '')
    );
  }

  getMyProperties() {
    return this.http.get<any[]>(`${this.base}/properties/my`);
  }

  getPropertyForEdit(id: string) {
    return this.http.get<any>(`${this.base}/properties/${id}/edit`);
  }

  updateProperty(id: string, body: any) {
    return this.http.put(`${this.base}/properties/${id}`,body);
  }
  getPropertyById(id: string) {
  return this.http.get<any>(`${this.base}/properties/${id}`);
  }
  updatePropertyImages(id: string, body: any) {
  return this.http.put(`${this.base}/properties/${id}/images`, body);
  }
  // ---------- IMAGE UPLOAD ----------
  signImage(propertyId: string, body: any) {
    return this.http.post<any>(
      `${this.base}/properties/${propertyId}/images/sign`,
      body
    ).pipe(
      map(res => {
        if (!res.publicUrl) {
          throw new Error('Signed URL missing publicUrl');
        }
        return res;
      })
    );
  }

commitImage(propertyId: string, body: CommitImageRequest) {
  return this.http.post(
    `${this.base}/properties/${propertyId}/images/commit`,
    body
  );
}


  deleteImage(propertyId: string, mediaId: string) {
    return this.http.delete(
      `${this.base}/properties/${propertyId}/images/${mediaId}`
    );
  }

  reorderImages(propertyId: string, orderedIds: string[]) {
    return this.http.patch(
      `${this.base}/properties/${propertyId}/images/reorder`,
      orderedIds
    );
  }
  deletePropertyImage(propertyId: string, url: string) {
    return this.http.delete(
      `${this.base}/properties/${propertyId}/images`,
      { params: { url } }
    );
  }
  
}
