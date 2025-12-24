import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  message = '';
  error = '';
  email = '';

  attemptsLeft = 3;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}
 
  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    this.form = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  resetPassword() {
    if (this.form.invalid || this.attemptsLeft <= 0) return;

    this.loading = true;
    this.error = '';
    this.message = '';

    const payload = {
      email: this.email,
      otp: this.form.value.otp,
      newPassword: this.form.value.newPassword
    };

    this.http.post(
     `${environment.apiUrl}/Auth/reset-password`,
      payload,
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Password reset successful';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.attemptsLeft--;
        this.error = err?.error || 'Invalid or expired OTP';
      }
    });
  }
}
