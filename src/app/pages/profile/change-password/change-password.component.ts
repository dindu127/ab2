import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  successMessage = '';
  errorMessage = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  save() {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All fields are required';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;

    this.auth.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.successMessage =
          typeof res === 'string'
            ? res
            : 'Password changed successfully';

        // 🔐 Security: logout after password change
        setTimeout(() => {
          this.auth.logout();
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: err => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'Failed to change password';

        this.loading = false;
      }
    });
  }

  close() {
    this.router.navigate(['/profile/info']);
  }
}
