import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import {
  PropertyService,
  PropertyCard,
  PropertySearchFilters
} from '../../services/property.service';
import { PropertyUpdatesService } from '../../services/property-updates.service';
import { PropertyGridComponent } from '../../shared/property-grid/property-grid.component';




@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PropertyGridComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  searchForm!: FormGroup;

  readonly placeholderImage = 'assets/images/property-placeholder.jpg';
  properties: PropertyCard[] = [];
  page = 1;
  pageSize = 12;
  total = 0;
  loading = false;
  loadingMore = false;

  searchMode = false;
  currentFilters: PropertySearchFilters = {};

  currentIndex: { [id: string]: number } = {};

  locations: string[] = [];
  loadingCities = false;

  private fallbackLocations = ['Chennai', 'Bengaluru', 'Coimbatore', 'Madurai'];

  private updatesSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private svc: PropertyService,
    private propertyUpdates: PropertyUpdatesService
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      location: [''],
      minPrice: [''],
      maxPrice: [''],
      size: [''],
      sortBy: ['listedDesc']
    });

    this.loadCities();
    this.loadPage(1);

    // subscribe to property updates and reload page 1 when a property changes
    this.updatesSub = this.propertyUpdates.onPropertyUpdated().subscribe((propertyId) => {
      // simple behavior: reload page 1 to reflect changes
      this.loadPage(1);
    });
  }

  ngOnDestroy(): void {
    this.updatesSub?.unsubscribe();
  }

  private loadCities() {
    this.loadingCities = true;
    this.svc.getCities()
      .pipe(
        take(1),
        catchError((err) => {
          console.error('[Home] getCities error', err);
          return of(this.fallbackLocations);
        })
      )
      .subscribe({
        next: (list) => {
          const normalized = Array.from(new Set((list || []).map(x => (x || '').trim()))).filter(Boolean);
          if (!normalized.length) {
            this.locations = [...this.fallbackLocations];
          } else {
            this.locations = normalized.sort((a,b) => a.localeCompare(b));
          }
          this.loadingCities = false;
        },
        error: () => {
          this.locations = [...this.fallbackLocations];
          this.loadingCities = false;
        }
      });
  }

  private loadPage(page: number) {
    this.loading = page === 1;
    this.loadingMore = page > 1;

    const f = this.currentFilters || {};
    const sortFromForm = this.searchForm.get('sortBy')?.value;
    this.svc.searchPropertiesPaged(f as PropertySearchFilters, page, this.pageSize, sortFromForm).subscribe({
      next: (res) => {
        const items = res.items ?? [];
        if (page === 1) this.properties = items;
        else this.properties = [...this.properties, ...items];

        this.total = typeof res.total === 'number' ? res.total : Number(res.total) || 0;
        this.page = res.page ?? page;

        this.loading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('[Home] loadPage error', err);
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  submitSearch() {
    const v = this.searchForm.value;
    this.currentFilters = {
      location: v.location || '',
      minPrice: v.minPrice !== '' && v.minPrice != null ? Number(v.minPrice) : null,
      maxPrice: v.maxPrice !== '' && v.maxPrice != null ? Number(v.maxPrice) : null,
      size: v.size || '',
      sortBy: v.sortBy || ''
    } as PropertySearchFilters;

    this.searchMode = true;
    this.loadPage(1);
  }

  resetSearch() {
    this.searchForm.reset({ location: '', minPrice: '', maxPrice: '', size: '', sortBy: 'listedDesc' });
    this.searchMode = false;
    this.currentFilters = {};
    this.loadPage(1);
  }

  public changePageSize(value: string | number) {
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n) || n <= 0) return;
    this.pageSize = n;
    this.loadPage(1);
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (this.loadingMore || this.loading) return;

    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.body.scrollHeight;

    if (position + threshold >= height) {
      if (this.properties.length < this.total) {
        this.loadPage(this.page + 1);
      }
    }
  }

  getCurrentImage(p: PropertyCard): string {
    const idx = this.currentIndex[p.id] ?? 0;
    if (!p.images || p.images.length === 0) return p.imageUrl || this.placeholderImage;
    return p.images[idx] || p.images[0] || this.placeholderImage;
  }

  nextImage(p: PropertyCard, e?: Event) {
    e?.stopPropagation();
    if (!p.images || p.images.length <= 1) return;
    const len = p.images.length;
    const idx = this.currentIndex[p.id] ?? 0;
    this.currentIndex[p.id] = (idx + 1) % len;
  }

  prevImage(p: PropertyCard, e?: Event) {
    e?.stopPropagation();
    if (!p.images || p.images.length <= 1) return;
    const len = p.images.length;
    const idx = this.currentIndex[p.id] ?? 0;
    this.currentIndex[p.id] = (idx - 1 + len) % len;
  }

  selectImage(p: PropertyCard, idx: number, e?: Event) {
    e?.stopPropagation();
    if (!p.images || idx < 0 || idx >= p.images.length) return;
    this.currentIndex[p.id] = idx;
  }

  onCardImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImage;
  }

  viewDetails(p: PropertyCard) {
    this.router.navigate(['/property', p.id]);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
