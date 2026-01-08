import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  imports:[CommonModule],
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {

  htmlContent = '';
blogData: any;
  blog: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadStaticBlog(slug);
      }
    });
  }

    loadStaticBlog(slug: string): void {
      const path = `assets/blogs/${slug}.json`;

      this.http.get<any>(path).subscribe({
        next: data => this.blog = data,
        error: () => this.blog = null
      });
    }

}