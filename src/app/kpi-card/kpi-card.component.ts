// src/app/kpi-card/kpi-card.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="kpi-card">
      <div class="kpi-title">{{ title }}</div>
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-sub">{{ sub }}</div>
    </div>
  `,
  styles: [`
    .kpi-card { background:#fff; padding:12px; border-radius:8px; min-width:160px; }
    .kpi-title { font-size:13px; color:#666 }
    .kpi-value { font-size:22px; font-weight:700; color:#222; margin-top:6px }
    .kpi-sub { font-size:12px; color:#999; margin-top:4px }
  `]
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: any = null;
  @Input() sub = '';
}
