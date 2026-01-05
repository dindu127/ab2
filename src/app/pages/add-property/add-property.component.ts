import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

interface SignImageResponse {
  uploadUrl: string;  // signed PUT URL
  publicUrl: string;  // final public url
}

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss']
})
export class AddPropertyComponent {
  form: FormGroup;

  error: string | null = null;
  submitted = false;
  isSaving = false;

  selectedFiles: File[] = [];
  previews: string[] = [];

  // keep using same base as before (no /api here)
  private readonly apiBaseUrl = environment.apiUrl;

  // dropdown options
  roadAccessOptions = [
    'No direct road',
    '20 ft road',
    '30 ft road',
    '40 ft road',
    'On main road'
  ];

  facingOptions = [
    'East',
    'West',
    'North',
    'South',
    'North-East',
    'South-East',
    'North-West',
    'South-West'
  ];

  plotTypeOptions = [
    'Residential',
    'Commercial',
    'Agricultural',
    'Farm land',
    'DTCP Approved',
    'CMDA Approved',
    'Industrial'
  ];

  brokerageOptions = [
    'No brokerage',
    '1%',
    '2%',
    '3%',
    'As per discussion'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(4000)]],
      price: [0, [Validators.required, Validators.min(1)]],
      landSize: [0, [Validators.required, Validators.min(0.01)]],
      // enum numeric: 0 = Sqft, 1 = Cent, 2 = Acre
      sizeUnit: [0, Validators.required],
      city: ['', [Validators.required, Validators.maxLength(120)]],
      locality: ['', [Validators.required, Validators.maxLength(200)]],

      // new optional fields
      roadAccess: [''],
      facing: [''],
      plotType: [''],
      brokerage: ['']
    });
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Add ONE image per selection.
   * Each time user picks a file, we append it to arrays.
   */
  onSingleFileSelected(event: Event, input: HTMLInputElement) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    // push file
    this.selectedFiles.push(file);

    // create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previews.push(reader.result as string);
    };
    reader.readAsDataURL(file);

    // reset input so same file can be picked again if needed
    input.value = '';
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  setAsCover(index: number) {
    if (index === 0) return;

    const [file] = this.selectedFiles.splice(index, 1);
    const [preview] = this.previews.splice(index, 1);

    this.selectedFiles.unshift(file);
    this.previews.unshift(preview);
  }

  private extractErrorMessage(err: any): string {
    console.error('Save property failed:', err);
    const e = err?.error;

    if (e) {
      const errorsObj = e.errors ?? e.Errors;
      if (errorsObj && typeof errorsObj === 'object') {
        const messages: string[] = [];
        for (const key of Object.keys(errorsObj)) {
          const arr = errorsObj[key];
          if (Array.isArray(arr)) {
            for (const msg of arr) {
              messages.push(`${key}: ${msg}`);
            }
          }
        }
        if (messages.length) return messages.join(' | ');
      }

      if (e.title) return e.title;
      if (e.detail) return e.detail;
      if (e.message) return e.message;
    }

    if (err?.status && err?.statusText) {
      return `Request failed: ${err.status} ${err.statusText}`;
    }

    return 'Failed to save property. Please check the console for details.';
  }

async onSubmit() {
  this.submitted = true;
  this.error = null;

  if (this.form.invalid || this.isSaving) {
    this.form.markAllAsTouched();
    return;
  }

  this.isSaving = true;

  try {
    // 🔐 Get JWT token
    const token = localStorage.getItem('lp_token');
    if (!token) throw new Error('User not logged in');

    const authHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });



    // 1️⃣ Create property
    const raw = this.form.value;

    const payload: any = {
      title: raw.title,
      description: raw.description,
      price: raw.price,
      landSize: raw.landSize,
      sizeUnit: raw.sizeUnit,
      city: raw.city,
      locality: raw.locality,
      roadAccess: raw.roadAccess || null,
      facing: raw.facing || null,
      plotType: raw.plotType || null,
      brokerage: raw.brokerage || null
    };

    const property: any = await lastValueFrom(
      this.http.post(
        `${this.apiBaseUrl}/properties`,
        payload,
        { headers: authHeaders }
      )
    );


    const propertyId = property?.id ?? property?.propertyId;
    if (!propertyId) throw new Error('Property ID not returned from API');

    // 2️⃣ Upload images (OPTIONAL)
    if (this.selectedFiles?.length) {
      for (const file of this.selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        await lastValueFrom(
          this.http.post(
            `${this.apiBaseUrl}/properties/${propertyId}/images/upload`,
            formData,
            { headers: authHeaders }
          )
        );
      }
    }

    // ✅ Success
    this.router.navigate(['/dashboard']);

  } catch (err: any) {
    console.error(err);
    this.error = this.extractErrorMessage(err);
  } finally {
    this.isSaving = false;
  }
}



}
