import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminService, UnlockedContactDto } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-user-unlocks',
  templateUrl: './admin-user-unlocks.component.html',
  styleUrls: ['./admin-user-unlocks.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class AdminUserUnlocksComponent implements OnInit {
  userId!: string;
  unlocks: UnlockedContactDto[] = [];
  loading = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private admin: AdminService) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.userId) {
      this.error = 'Invalid user id';
      return;
    }
    this.loadUnlocks();
  }

  loadUnlocks() {
    this.loading = true;
    this.error = null;
    this.admin.getUnlockedContactsForUser(this.userId).subscribe({
      next: data => { this.unlocks = data; this.loading = false; },
      error: err => { this.error = 'Failed to load unlock logs'; this.loading = false; console.error(err); }
    });
  }
}
