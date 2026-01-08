import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Component({
  standalone: true,
  imports: [CommonModule,  HttpClientModule],
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
})
export class BlogComponent implements OnInit {

  blogData: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');

    this.http
      .get(`assets/blogs/${slug}.json`)
      .subscribe(data => {
        this.blogData = data;
      });
  }
}
