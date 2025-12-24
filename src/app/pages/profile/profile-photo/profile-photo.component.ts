import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile-photo',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './profile-photo.component.html',
  styleUrls: ['./profile-photo.component.css']
})
export class ProfilePhotoComponent {

  imageChangedEvent: any = '';
  croppedImage: Blob | null = null;

  uploading = false;
  deleting = false;
  loading = true;
  successMessage = '';
  errorMessage = '';

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  currentPhoto: string | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.auth.currentUser$.subscribe(user => {
      this.currentPhoto = user?.profilePhotoUrl || null;
      this.loading = false;
    });
  }

  onFileSelected(event: Event) {
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.croppedImage = event.blob;
    }
  }

  upload() {
    if (!this.croppedImage) return;

    const formData = new FormData();
    formData.append('file', this.croppedImage, 'profile.jpg');

    this.uploading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.post(`${environment.apiUrl}/auth/profile-photo`, formData)
      .subscribe({
        next: () => {
          this.successMessage = '✅ Profile photo uploaded successfully';
          this.auth.refreshProfile().subscribe();
          this.reset();
          this.loading = false;          
        },
        error: () => {
        this.errorMessage = '❌ Failed to upload photo';
        this.loading = false;
        }
      });
        setTimeout(() => {this.reset();}, 1500);
  }

  deletePhoto() {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    this.deleting = true;
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.delete(`${environment.apiUrl}/auth/profile-photo`)
      .subscribe({
        next: () => {
          this.auth.refreshProfile().subscribe();
          this.deleting = false;
          this.successMessage = '✅ Profile photo deleted successfully';
          this.loading = false;
        },
        error: () => {
          this.errorMessage = '❌ Failed to delete photo';
          this.deleting = false;
          this.loading = false;
        }
      });
  }

  reset() {
    this.imageChangedEvent = '';
    this.croppedImage = null;
    this.uploading = false;
  }

  
}
