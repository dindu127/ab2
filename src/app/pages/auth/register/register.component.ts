import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormGroup,
  FormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const g = group as FormGroup;
    const pass = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pass && confirm && pass !== confirm ? { mismatch: true } : null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']   // corrected property name
})
export class RegisterComponent {
  form!: FormGroup;
  submitted = false;
  loading = false;
  serverError = '';
  otp = '';
  otpSent = false;
  otpLoading = false;
  emailVerified = false;
  otpVerified = false;
  photoFile: File | null = null;
  photoPreview: string | null = null;
  emailError: string = '';
  otpError: string = '';


  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    // create the form here (fb is available)
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator() });
  }

  // getter used in template: f['name'], f['email'], etc.
  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.submitted = true;
    this.serverError = '';

    if (this.form.invalid) return;

    this.loading = true;

    const raw = this.form.value;
    const payload = {
      fullName: raw.name?.trim(),
      phone: raw.phone?.toString().replace(/[^0-9]/g, ''),
      email: raw.email?.trim().toLowerCase(),
      password: raw.password
    };

    this.auth.register(payload).pipe(take(1)).subscribe({
      next: () => {
       // ✅ STEP 1: upload profile photo if selected
      if (this.photoFile) {
        this.auth.uploadProfilePhoto(this.photoFile).pipe(take(1)).subscribe({
          next: () => this.loadProfileAndNavigate(),
          error: () => this.loadProfileAndNavigate() // don't block user
        });
        } else {
          this.loadProfileAndNavigate();
        }
      },
          error: (err) => {
          this.loading = false;

          // 🔥 robust backend error handling
          if (typeof err?.error === 'string') {
            this.serverError = err.error;
          } else if (err?.error?.message) {
            this.serverError = err.error.message;
          } else if (err?.error?.errors) {
            const firstKey = Object.keys(err.error.errors)[0];
            this.serverError = err.error.errors[firstKey][0];
          } else {
            this.serverError = 'Registration failed. Please try again.';
          }
        }
      });
    }

sendOtp() {
  if (this.f['email'].invalid) return;

  // reset all errors
  this.emailError = '';
  this.otpError = '';
  this.serverError = '';

  this.otpLoading = true;

  this.auth.sendEmailOtp(this.f['email'].value).subscribe({
    next: () => {
      this.otpSent = true;
      this.otpLoading = false;
    },
    error: err => {
      this.otpLoading = false;

      // ✅ EMAIL ERROR ONLY
      if (err.status === 409) {
        this.emailError = err.error?.message || 'Email already registered';
      } else {
        this.emailError = 'Failed to send OTP';
      }
    }
  });
}

verifyOtp(): void {
  if (!this.otp || this.otp.length !== 6) {
    this.otpError = 'Please enter a valid 6-digit OTP';
    return;
  }

  this.otpLoading = true;
  this.otpError = '';

  this.auth.verifyEmailOtp(this.form.value.email, this.otp).subscribe({
    next: () => {
      this.otpLoading = false;
      this.emailVerified = true;
      this.otpSent = false;
      this.otpError = '';
    },
    error: err => {
      this.otpLoading = false;

      // ✅ OTP ERROR ONLY
      this.otpError = err?.error || 'Invalid OTP';
    }
  });
}

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];

    // validation
    if (!file.type.startsWith('image/')) {
      this.serverError = 'Only image files allowed';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.serverError = 'Max image size is 2MB';
      return;
    }

    this.photoFile = file;

    // preview
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private loadProfileAndNavigate() {
  this.auth.getProfile().pipe(take(1)).subscribe({
    next: () => this.goDashboard(),
    error: () => this.goDashboard()
  });
  }

  private goDashboard() {
    this.loading = false;
    this.router.navigateByUrl('/dashboard')
      .catch(() => (window.location.href = '/dashboard'));
  }

}
