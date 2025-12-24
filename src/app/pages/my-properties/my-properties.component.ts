import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property.service';
import { PropertyGridComponent } from '../../shared/property-grid/property-grid.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [
    CommonModule,
    PropertyGridComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './my-properties.component.html',
  styleUrls: ['./my-properties.component.scss'],
})
export class MyPropertiesComponent implements OnInit {

  /* ================= DATA ================= */

  allProperties: any[] = [];   // 🔥 MASTER (never touch)
  properties: any[] = [];      // UI list
  loading = true;

  /* ================= UI STATE ================= */

  sortBy: 'newest' | 'oldest' | 'priceHigh' | 'priceLow' = 'newest';
  filter: 'featured' | 'active' | 'sold' | null = null;

  constructor(private propertySvc: PropertyService) {}

  /* ================= INIT ================= */

  ngOnInit(): void {
    this.propertySvc.getMyProperties().subscribe({
      next: res => {
        this.allProperties = res || [];
        this.properties = [...this.allProperties]; // clone
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  /* ================= SORT ================= */

  applySort(): void {
    this.applySortAndFilter();
  }

  /* ================= FILTER ================= */

  setFilter(type: 'featured' | 'active' | 'sold'): void {
    this.filter = this.filter === type ? null : type;
    this.applySortAndFilter();
  }

  clearFilter(): void {
    this.filter = null;
    this.sortBy = 'newest'; // optional UX reset
    this.applySortAndFilter(); // 🔥 REQUIRED
  }

  /* ================= CORE LOGIC ================= */

  applySortAndFilter(): void {
    let list = [...this.allProperties]; // ✅ ALWAYS start from master

    /* ---------- FILTER ---------- */

    if (this.filter === 'active') {
      list = list.filter(p => !p.isSold);
    }

    if (this.filter === 'sold') {
      list = list.filter(p => p.isSold);
    }

    if (this.filter === 'featured') {
      list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }

    /* ---------- SORT ---------- */

    switch (this.sortBy) {
      case 'priceHigh':
        list.sort((a, b) => b.price - a.price);
        break;

      case 'priceLow':
        list.sort((a, b) => a.price - b.price);
        break;

      case 'oldest':
        list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );
        break;

      default: // newest
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
    }

    this.properties = list;
  }
}
