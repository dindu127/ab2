// src/app/pages/auth/login/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  submitted = false;
  loading = false;
  serverError = '';
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      emailOrPhone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.form.controls; }

  submit() {
    this.submitted = true;
    this.error = '';
    this.serverError = '';

    if (this.form.invalid) return;

    const val = this.form.value;
    // Build payload matching backend LoginRequest shape
    const payload: any = { password: val.password };
    // attempt to treat value as email (contains @) else phone
    if (typeof val.emailOrPhone === 'string' && val.emailOrPhone.includes('@')) {
      payload.email = val.emailOrPhone.trim();
    } else {
      payload.phone = (val.emailOrPhone || '').toString().trim();
    }

    this.loading = true;
    console.log('[LoginComponent] sending login body ->', payload);
    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading = false;
        // token saved in service; fetch profile and then navigate
        this.auth.getProfile().subscribe({
          next: () => this.router.navigateByUrl('/'),
          error: () => this.router.navigateByUrl('/') // even if profile fails
        });
      },
      error: (err) => {
        this.loading = false;
        try {
          if (err?.error) {
            // case 1: { message: '...' }
            if (typeof err.error === 'object' && err.error.message) {
              this.error = err.error.message;
            }
            // case 2: validation object
            else if (typeof err.error === 'object' && err.error.errors) {
              // flatten first validation message
              const errs = err.error.errors;
              const keys = Object.keys(errs);
              if (keys.length) {
                const first = errs[keys[0]];
                this.error = Array.isArray(first) ? first.join(' ') : String(first);
              } else {
                this.error = err.error.title ?? 'Validation error';
              }
            }
            // case 3: plain text
            else if (typeof err.error === 'string') {
              // swagger sometimes returns a JSON string, try parse
              try {
                const parsed = JSON.parse(err.error);
                this.error = parsed?.message ?? parsed?.title ?? err.error;
              } catch {
                this.error = err.error;
              }
            } else {
              this.error = 'Login failed. Please try again.';
            }
          } else {
            this.error = err?.message ?? 'Login failed';
          }
        } catch (ex) {
          console.error('error parsing auth error', ex, err);
          this.error = 'Login failed. Please try again.';
        }

        console.error('[LoginComponent] login error full ->', err);
      }
    });
  }
}
