import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-property-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-grid.component.html',
  styleUrls: ['./property-grid.component.css']
})
export class PropertyGridComponent {

  @Input() properties: any[] = [];
  @Input() loading = false;
  @Input() showFeatured = false;   // Home = true, others = false
  @Input() showEdit = false;
  @Input() isAdmin = false;       // Admin = true

  @Output() approve = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();
  @Output() toggleFeature = new EventEmitter<any>();


  placeholderImage = 'assets/images/property-placeholder.jpg';

  constructor(private router: Router) {}

  /** 🔥 UNIVERSAL IMAGE PICKER */
  getImage(p: any): string {
    if (p.imageUrl) return p.imageUrl;                 // Home
    if (p.images?.length) return p.images[0].url;     // Home alt
    if (p.media?.length) {                             // My / Admin
      const cover = p.media.find((m: any) => m.isCover);
      return (cover ?? p.media[0]).url;
    }
    return this.placeholderImage;
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = this.placeholderImage;
  }

  viewDetails(p: any) {
    this.router.navigate(['/property', p.id]);
  }

  editProperty(p: any, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/dashboard/edit-property', p.id]);
  }
}
