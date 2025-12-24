import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, UserSummaryDto } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-user-list',
  templateUrl: './admin-user-list.component.html',
  styleUrls: ['./admin-user-list.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class AdminUserListComponent implements OnInit {
  users: UserSummaryDto[] = [];
  loading = false;
  error: string | null = null;

  constructor(private admin: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    this.admin.getUsers()
      .pipe(
        catchError(err => {
          console.error('[AdminUserList] loadUsers error', err);
          // Show useful error text
          if (err?.status) {
            this.error = `Failed to load users (${err.status})`;
          } else {
            this.error = 'Failed to load users';
          }
          this.loading = false;
          return of([] as UserSummaryDto[]);
        })
      )
      .subscribe(u => {
        this.users = u || [];
        this.loading = false;
      });
  }

  viewUnlocks(user: UserSummaryDto) {
    this.router.navigate(['/admin/users', user.userId, 'unlocked']).catch(() => {});
  }
}
