import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BlogService } from '../services/blog.service';

@Component({
  standalone: true,
  imports: [CommonModule,  HttpClientModule],
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  
})
export class BlogComponent implements OnInit {
  blog: any;
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
    this.blogService.getBlogBySlug(slug).subscribe({
      next: (res) => this.blog = res,
      error: (err) => console.error('Blog load error', err)
    });
  }
}
