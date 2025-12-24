// src/app/admin/admin-unlock-logs/admin-unlock-logs.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UnlockedContactDto, PagedResult } from '../../services/admin.service';

@Component({
  selector: 'app-admin-unlock-logs',
  templateUrl: './admin-unlock-logs.component.html',
  styleUrls: ['./admin-unlock-logs.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminUnlockLogsComponent implements OnInit {
  unlocks: UnlockedContactDto[] = [];
  loading = false;
  error: string | null = null;

  // pagination
  page = 1;
  pageSize = 50;
  total = 0;
  pageSizes = [10, 20, 50, 100];

  // filters
  searchTerm = '';
  searchStartDate: string | null = null;
  searchEndDate: string | null = null;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.admin.getAllUnlockedContacts(this.page, this.pageSize).subscribe({
      next: (res: PagedResult<UnlockedContactDto>) => {
        this.unlocks = res.items || [];
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load unlock logs', err);
        this.error = 'Failed to load unlock logs';
        this.loading = false;
      }
    });
  }


  // client-side filtered view of current page
  get filteredUnlocks(): UnlockedContactDto[] {
    const q = this.searchTerm?.trim().toLowerCase();
    let items = this.unlocks.slice();

    // date filter on unlockedOn/createdAt if set
    const start = this.searchStartDate ? new Date(this.searchStartDate) : null;
    const end = this.searchEndDate ? new Date(this.searchEndDate) : null;

    if (start || end) {
      items = items.filter(i => {
        const when = i.unlockedOn || i.createdAt || '';
        if (!when) return false;
        const d = new Date(when);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    if (!q) return items;
    return items.filter(u =>
      (u.propertyTitle && u.propertyTitle.toLowerCase().includes(q)) ||
      (u.ownerName && u.ownerName.toLowerCase().includes(q)) ||
      (u.unlockedByUserEmail && u.unlockedByUserEmail.toLowerCase().includes(q)) ||
      (u.unlockedByUserName && u.unlockedByUserName.toLowerCase().includes(q)) ||
      (u.transactionId && u.transactionId.toLowerCase().includes(q)) ||
      (u.paymentId && u.paymentId.toLowerCase().includes(q)) ||
      (u.ownerPhone && u.ownerPhone.toLowerCase().includes(q))
    );
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.load();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage() {
    if (this.page * this.pageSize < this.total) {
      this.page++;
      this.load();
    }
  }

  refresh() {
    this.load();
  }

  onSearch() {
    // we already load full page and filter on client; for now just re-run load to get server page and then client filter
    this.load();
  }

  onClearSearch() {
    this.searchTerm = '';
    this.searchStartDate = null;
    this.searchEndDate = null;
    this.load();
  }

  exportCsv() {
    if (!this.unlocks || !this.unlocks.length) return;

    const items = this.filteredUnlocks;
    const headers = [
      'PropertyId',
      'PropertyTitle',
      'UnlockedOn',
      'PaymentId',
      'TransactionId',
      'PaymentAmount',
      'Currency',
      'PaymentStatus',
      'OwnerName',
      'OwnerPhone',
      'UnlockedByUserId',
      'UnlockedByUserEmail',
      'UnlockedByUserName',
      'Notes'
    ];
    const rows = items.map(i => [
      i.propertyId || '',
      i.propertyTitle || '',
      i.unlockedOn || i.createdAt || '',
      i.paymentId || i.transactionId || '',
      i.transactionId || i.paymentId || '',
      (i.paymentAmount ?? i.amount ?? ''),
      i.currency || '',
      i.paymentStatus || '',
      i.ownerName || '',
      i.ownerPhone || '',
      i.unlockedByUserId || '',
      i.unlockedByUserEmail || '',
      i.unlockedByUserName || '',
      i.notes || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlock-logs-page-${this.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
