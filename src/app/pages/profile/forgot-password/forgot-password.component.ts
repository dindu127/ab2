import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnDestroy {

  form: FormGroup;
  loading = false;
  message = '';
  error = '';
  resendCooldown = 0;
  timer: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  sendOtp() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';
    this.message = '';

    const email = this.form.value.email;

    this.http.post(
      `${environment.apiUrl}/Auth/forgot-password`,
      { email },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'OTP sent successfully';
        this.startCooldown();

        this.router.navigate(['/profile/reset-password'], {
          queryParams: { email }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error || 'Email not registered';
      }
    });
  }



  startCooldown() {
    // 🔒 clear existing timer
    if (this.timer) clearInterval(this.timer);

    this.resendCooldown = 30;

    this.timer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
