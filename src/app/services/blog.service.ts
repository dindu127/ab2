import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  // 🔴 CHANGE THIS to your real API base URL if needed
  private apiUrl = 'https://landportal-api-a5c6hdcdaaqwemas.centralindia-01.azurewebsites.net/api/blogs';

  constructor(private http: HttpClient) {}

  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${slug}`);
  }
}
