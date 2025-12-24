import { Component, OnInit } from '@angular/core';
import { UnlockLogDto } from '../../models/unlock-log.model'; // adjust path if needed
import { AdminUnlockLogsService } from '../../services/admin-unlock-logs.service'; // your service
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-unlock-logs',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-unlock-logs.component.html',
  styleUrls: ['./admin-unlock-logs.component.scss']
})
export class AdminUnlockLogsComponent implements OnInit {
  // paging / filter state
  page = 1;
  pageSize = 20;
  total = 0;

  // filter inputs bound with ngModel
  search = '';
  from?: string; // ISO date string used by <input type="date">
  to?: string;

  loading = false;
  items: UnlockLogDto[] = [];

  constructor(private svc: AdminUnlockLogsService) { }

  ngOnInit(): void {
    this.load();
  }

  get totalPages(): number {
    if (!this.pageSize) return 0;
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  async load() {
    this.loading = true;
    try {
      const res = await this.svc['get'](this.page, this.pageSize, this.search, this.from ? new Date(this.from) : undefined, this.to ? new Date(this.to) : undefined);
      // expected svc returns { total, page, pageSize, items }
      this.total = res.total ?? 0;
      this.page = res.page ?? this.page;
      this.pageSize = res.pageSize ?? this.pageSize;
      this.items = res.items ?? [];
    } catch (err) {
      console.error('Failed to load unlock logs', err);
      // show toast / message as needed
    } finally {
      this.loading = false;
    }
  }

  onSearch() {
    this.page = 1;
    this.load();
  }

  async exportCsv() {
    try {
      this.loading = true;
      // call API endpoint that returns CSV (server-side)
      await this.svc.exportCsv(this.search, this.from ? new Date(this.from) : undefined, this.to ? new Date(this.to) : undefined);
      // svc.exportCsv should trigger a download or return bytes for you to download
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      this.loading = false;
    }
  }

  // pagination helpers
  prevPage() {
    if (this.page > 1) { this.page--; this.load(); }
  }
  nextPage() {
    if (this.page < this.totalPages) { this.page++; this.load(); }
  }
}
