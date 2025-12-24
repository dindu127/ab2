import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `<footer class="app-footer"><small>© LandPortal</small></footer>`,
  styles: [`.app-footer{padding:10px;text-align:center;color:#666}`]
})
export class FooterComponent {}
