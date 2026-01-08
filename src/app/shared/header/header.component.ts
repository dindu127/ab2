import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  open = false;
  adminOpen = false;
  dashboardOpen = false;
  userMenuOpen = false;
  user: UserProfile | null = null;
  isLoggedIn = false;
  isAdmin = false;
  userName = '';
  otherLinksOpen = false;


  constructor(
    private auth: AuthService,
    private router: Router,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'Admin';
      this.userName = user?.fullName || user?.email || 'User';
    });
  }

 toggleMenu(event: Event) {
  event.stopPropagation();
  this.open = !this.open;
}

  toggleDashboard(event: Event) {
    event.stopPropagation();
    this.dashboardOpen = !this.dashboardOpen;
    this.adminOpen = false;
    this.userMenuOpen = false;
  }

  toggleOtherLinks(event: Event) {
  event.stopPropagation();
  this.otherLinksOpen = !this.otherLinksOpen; }


  toggleAdmin(event: Event) {
    event.stopPropagation();
    this.adminOpen = !this.adminOpen;
    this.dashboardOpen = false;
    this.userMenuOpen = false;
  }


  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
    this.dashboardOpen = false;
    this.adminOpen = false;
  }
    closeDropdowns() {
    this.dashboardOpen = false;
    this.adminOpen = false;
    this.userMenuOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
    this.closeAll();
  }

  closeAll(): void {
    this.open = false;
    this.adminOpen = false;
    this.dashboardOpen = false;
    this.userMenuOpen = false;
    this.otherLinksOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeAll();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }
 
  @HostListener('window:scroll') onScroll() {
  const header = document.querySelector('.header-container');
  if (!header) return;

  window.scrollY > 10
    ? header.classList.add('scrolled')
    : header.classList.remove('scrolled');
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/avatar-placeholder.png';
  }

  goToProfile() {
  this.router.navigate(['/profile/info']);
  }

}
