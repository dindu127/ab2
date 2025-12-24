import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProfilePhotoComponent } from "../profile-photo/profile-photo.component";

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePhotoComponent, RouterLink],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {

  user: any = null;

  fullName = '';
  phone = '';
  email = '';

  loading = false;
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.user = u;
        this.fullName = u.fullName ?? '';
        this.phone = u.phone ?? '';
        this.email = u.email ?? '';
      }
    });
  }

  save() {
    this.loading = true;
    this.message = '';

    const body = {
      fullName: this.fullName?.trim(),
      phone: this.phone?.trim(),
      email: this.email?.trim().toLowerCase()
    };

    this.auth.updateProfile(body).subscribe({
      next: () => {
        this.message = 'Profile updated successfully!';
        this.loading = false;

        this.router.navigate(['/profile/info']);
      },
      error: (err) => {
        this.loading = false;

        // ✅ SHOW BACKEND ERROR MESSAGE
        if (typeof err?.error === 'string') {
          this.message = err.error;
        }
        else if (err?.error?.message) {
          this.message = err.error.message;
        }
        else {
          this.message = 'Update failed. Try again.';
        }

        console.error('Update profile error:', err);
      }
    });
  }

}
