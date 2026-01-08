import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { CommonModule } from '@angular/common';

@Component({
  imports:[CommonModule],
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {

  blog: any = null;
blogData: any;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadBlog(slug);
      }
    });
  }

  loadBlog(slug: string): void {
    this.blog = null;

    this.blogService.getBlogBySlug(slug).subscribe({
      next: res => this.blog = res,
      error: err => console.error('Blog load error', err)
    });
  }
}
