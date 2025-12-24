import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { PropertyService } from '../../services/property.service';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './edit-property.component.html',
  styleUrls: ['./edit-property.component.scss']
})
export class EditPropertyComponent implements OnInit {

  form!: FormGroup;
  propertyId!: string;

  loading = true;
  isSaving = false;
  submitted = false;
  error = '';
  successMessage = '';
  selectedFiles: File[] = [];



  /** Existing images already saved in DB */
  existingMedia: {
    id: string;
    url: string;
    isCover?: boolean;
  }[] = [];

  /** Newly added images during edit */
  newFiles: File[] = [];
  previews: string[] = [];

  roadAccessOptions = ['No direct road',
    '20 ft road',
    '30 ft road',
    '40 ft road',
    'On main road'];
  facingOptions = ['East',
    'West',
    'North',
    'South',
    'North-East',
    'South-East',
    'North-West',
    'South-West'];
  plotTypeOptions = ['Residential',
    'Commercial',
    'Agricultural',
    'Farm land',
    'DTCP Approved',
    'CMDA Approved',
    'Industrial'];
  brokerageOptions = ['No brokerage',
    '1%',
    '2%',
    '3%',
    'As per discussion'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: PropertyService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id')!;
    this.buildForm();
    this.loadProperty();
  }

  buildForm() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, Validators.required],
      landSize: [0, Validators.required],
      sizeUnit: [0, Validators.required],
      city: ['', Validators.required],
      locality: ['', Validators.required],
      roadAccess: [''],
      facing: [''],
      plotType: [''],
      brokerage: ['']
    });
  }

  /** Load property + images */
  loadProperty() {
    this.svc.getPropertyById(this.propertyId).subscribe({
      next: (p: any) => {
        this.form.patchValue({
          title: p.title,
          description: p.description,
          price: p.price,
          landSize: p.landSize,
          sizeUnit: p.sizeUnit,
          city: p.city,
          locality: p.locality,
          roadAccess: p.roadAccess ?? '',
          facing: p.facing ?? '',
          plotType: p.plotType ?? '',
          brokerage: p.brokerage ?? ''
        });

        this.existingMedia = (p.media || []).map((m: any) => ({
          id: m.id,
          url: m.publicUrl || m.url,
          isCover: m.isCover
        }));

        this.previews = this.existingMedia.map(m => m.url);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load property';
        this.loading = false;
      }
    });
  }

  /** Back arrow */
  goBack() {
    this.router.navigate(['/dashboard/my-properties']);
  }

  /** Add new image */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.newFiles.push(file);

    const reader = new FileReader();
    reader.onload = () => this.previews.push(reader.result as string);
    reader.readAsDataURL(file);

    input.value = '';
  }

  /** Drag & drop reorder (UI only) */
  drop(event: any) {
    moveItemInArray(this.previews, event.previousIndex, event.currentIndex);
    moveItemInArray(this.existingMedia, event.previousIndex, event.currentIndex);
  }


  /** Save property + upload images */
  async onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isSaving = true;
    this.error='';
    this.successMessage='';
    try {
      // 1️⃣ update property fields
      await firstValueFrom(
        this.svc.updateProperty(this.propertyId, this.form.value)
      );

      // 2️⃣ upload images
      await this.uploadImages();
      
      // ✅ Show success message
      this.successMessage = 'Property updated successfully';
      setTimeout(() => {
        this.router.navigate(['/dashboard/my-properties']); // ⚠️ CHECK PATH
      }, 1200);

      // 3️⃣ done
    // this.router.navigate(['/my-properties']);
    } catch (err) {
      console.error(err);
      this.error = 'Failed to update property';
      this.isSaving = false;
    }
  }


  onImageError(e: Event) {
      (e.target as HTMLImageElement).src =
        'assets/images/property-placeholder.jpg';
  }

  private async uploadImages(): Promise<void> {
    for (let i = 0; i < this.newFiles.length; i++) {
      const file = this.newFiles[i];

      // 1️⃣ get signed URL
      const sign = await firstValueFrom(
        this.svc.signImage(this.propertyId, {
          fileName: file.name,
          contentType: file.type
        })
      );

      if (!sign?.uploadUrl || !sign?.publicUrl) {
        throw new Error('Invalid signed URL response');
      }

      // 2️⃣ upload to GCS
      await fetch(sign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      // 3️⃣ commit metadata to DB
      await firstValueFrom(
        this.svc.commitImage(this.propertyId, {
          url: sign.publicUrl,
          isCover: this.existingMedia.length === 0 && i === 0,
          sortOrder: this.existingMedia.length + i + 1,
          contentType: file.type,
          sizeBytes: file.size
        })
      );
    }
  }

  /** Delete existing image (DB + GCS) */
  removeExistingImage(index: number) {
    // ❌ Prevent deleting last image
    if (this.existingMedia.length <= 1) {
      this.error = 'At least one image is required for a property';
      return;
    }
      const confirmed = confirm('Are you sure you want to delete this image?');
      if (!confirmed) return;

    const media = this.existingMedia[index];

    this.svc.deletePropertyImage(this.propertyId, media.url).subscribe({
      next: () => {
        this.existingMedia.splice(index, 1);
        this.previews.splice(index, 1);
      },
      error: () => {
        alert('Failed to delete image');
      }
    });
  }
}
