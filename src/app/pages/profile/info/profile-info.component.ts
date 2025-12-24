import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';



@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, RouterModule,RouterLink],
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.css']
})
export class ProfileInfoComponent implements OnInit {

  user: any = null;
  loading = true;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // 🔥 ALWAYS load fresh profile from backend
    this.auth.getProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });}

  goEdit() {
    this.router.navigate(['/profile/edit']);
  }
}
