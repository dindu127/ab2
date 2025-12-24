// src/app/admin/admin-properties/admin-properties.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminService, AdminPropertyDto, PagedResult } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyGridComponent } from '../../shared/property-grid/property-grid.component';

@Component({
  selector: 'app-admin-properties',
  templateUrl: './admin-properties.component.html',
  styleUrls: ['./admin-properties.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule,  PropertyGridComponent ],
})

export class AdminPropertiesComponent implements OnInit {
  status = 'Pending';
  page = 1;
  pageSize = 20;
  /** options shown in the page-size select */
  pageSizes = [10, 20, 50, 100];
  isAdmin = false;
  total = 0;
  properties: AdminPropertyDto[] = [];
  loading = false;
  error: string | null = null;

  constructor(private admin: AdminService, private router: Router) {}

  ngOnInit(): void {
      const role = localStorage.getItem('role'); // or from AuthService
  this.isAdmin = role === 'Admin';

  this.load();
  }

  load() {
    this.loading = true;
    this.error = null;

    this.admin.getPropertiesByStatus(this.status, this.page, this.pageSize).subscribe({
      next: (res: PagedResult<AdminPropertyDto>) => {
        // Defensive: ensure total is a proper number
        this.total = typeof res.total === 'number' ? res.total : Number(res.total) || 0;
        this.properties = res.items ?? [];

        // If server-side data changed and current page is now beyond max, clamp and reload once
        if (this.page > this.maxPage) {
          this.page = this.maxPage;
          this.admin.getPropertiesByStatus(this.status, this.page, this.pageSize).subscribe({
            next: (r) => {
              this.total = typeof r.total === 'number' ? r.total : Number(r.total) || 0;
              this.properties = r.items ?? [];
              this.loading = false;
            },
            error: (err) => {
              console.error(err);
              this.error = 'Failed to load properties';
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load properties';
        this.loading = false;
      }
    });
  }

  approve(id: string) {
    if (!confirm('Approve this property?')) return;
    this.admin.approveProperty(id).subscribe({
      next: () => this.load(),
      error: (err) => { console.error(err); alert('Failed to approve'); }
    });
  }

  reject(id: string) {
    if (!confirm('Reject this property?')) return;
    this.admin.rejectProperty(id).subscribe({
      next: () => this.load(),
      error: (err) => { console.error(err); alert('Failed to reject'); }
    });
  }

  changeStatus(s: string) {
    this.status = s;
    this.page = 1;
    this.load();
  }

  changePageSize(size: number) {
    // ensure numeric
    this.pageSize = Number(size) || 20;
    this.page = 1;
    this.load();
  }

  get maxPage(): number {
    if (!this.pageSize || this.pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  prev() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  next() {
    if (this.page < this.maxPage) {
      this.page++;
      this.load();
    }
  }

  trackById(_: number, item: AdminPropertyDto) {
    return item.id;
  }

  toggleFeatured(p: AdminPropertyDto) {
    this.admin.setFeatured(p.id, !p.isFeatured).subscribe({
      next: () => {
        p.isFeatured = !p.isFeatured;
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update featured status');
      }
    });
  }


  edit(id: string) {
  console.log('EDIT ID', id);
  this.router.navigate(['/admin/properties', id, 'edit']);}

  reload() {
  this.loading = false;
  this.load(); // your existing fetch method
  }
}
