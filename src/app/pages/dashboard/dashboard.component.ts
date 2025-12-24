import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { Kpi, DashboardSummary } from '../../models/dashboard.model';
import { KpiCardComponent } from "../../kpi-card/kpi-card.component";
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

Chart.register(...registerables);

@Component({
   selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,         // only if your component is actually standalone
  imports: [
    CommonModule,
    RouterModule,
    KpiCardComponent          // add child standalone components here if used in template
  ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // data
  kpis: Kpi[] = [];
  recentActivities: string[] = [];
  summary: DashboardSummary | null = null;
  totalRevenueFormatted = '';

  // charts
  private propertiesChart: Chart | null = null;
  private usersChart: Chart | null = null;

  // loading & error states
  loadingSummary = false;
  loadingKpis = false;
  loadingCharts = false;
  errorMessage = '';

  // view refs for canvas
  @ViewChild('propertiesCanvas', { static: false }) propertiesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usersCanvas', { static: false }) usersCanvas!: ElementRef<HTMLCanvasElement>;

  // subscriptions
  private subs: Subscription[] = [];

  constructor(private dashboardSvc: DashboardService, public router: Router) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadKpis();
    this.loadRecentActivities();
  }

  ngAfterViewInit(): void {
    // after view init we can render charts
    this.loadCharts();
  }

  private loadSummary() {
    this.loadingSummary = true;
    this.errorMessage = '';
    const sub = this.dashboardSvc.getSummary().subscribe({
      next: s => {
        this.summary = s;
        const amount = (s.totalRevenue ?? s.revenue) ?? 0;
        this.totalRevenueFormatted = this.formatRupee(amount);
        this.loadingSummary = false;
      },
      error: err => {
        this.errorMessage = 'Failed to load summary';
        console.error('Summary load error', err);
        this.loadingSummary = false;
      }
    });
    this.subs.push(sub);
  }

  private loadKpis() {
    this.loadingKpis = true;
    const sub = this.dashboardSvc.getKpis().subscribe({
      next: list => {
        this.kpis = list;
        this.loadingKpis = false;
      },
      error: err => {
        console.error('Kpis load error', err);
        this.kpis = [];
        this.loadingKpis = false;
        this.errorMessage = this.errorMessage || 'Failed to load KPIs';
      }
    });
    this.subs.push(sub);
  }

  private loadRecentActivities() {
    const sub = this.dashboardSvc.getRecentActivities().subscribe({
      next: acts => {
        this.recentActivities = acts;
      },
      error: err => {
        console.error('Activities load error', err);
        this.recentActivities = [];
      }
    });
    this.subs.push(sub);
  }

  private loadCharts() {
    this.loadingCharts = true;
    // properties series
    const s1 = this.dashboardSvc.getPropertiesMonthlySeries().subscribe({
      next: res => {
        this.createPropertiesChart(res.labels, res.data);
        // once properties built, request users
        const s2 = this.dashboardSvc.getUsersMonthlySeries().subscribe({
          next: res2 => {
            this.createUsersChart(res2.labels, res2.data);
            this.loadingCharts = false;
          },
          error: e2 => {
            console.error('Users series error', e2);
            this.loadingCharts = false;
            this.errorMessage = this.errorMessage || 'Failed to load chart data';
          }
        });
        this.subs.push(s2);
      },
      error: e => {
        console.error('Properties series error', e);
        this.loadingCharts = false;
        this.errorMessage = this.errorMessage || 'Failed to load chart data';
      }
    });
    this.subs.push(s1);
  }

  private createPropertiesChart(labels: string[], data: number[]) {
    if (!this.propertiesCanvas) return;
    const ctx = this.propertiesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.propertiesChart) {
      this.propertiesChart.destroy();
    }

    this.propertiesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Properties Listed',
            data,
            tension: 0.35,
            fill: false,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: true } },
          y: { beginAtZero: true }
        }
      }
    });
  }

  private createUsersChart(labels: string[], data: number[]) {
    if (!this.usersCanvas) return;
    const ctx = this.usersCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.usersChart) {
      this.usersChart.destroy();
    }

    this.usersChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'New Users',
            data,
            backgroundColor: 'rgba(54,162,235,0.6)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: true } },
          y: { beginAtZero: true }
        }
      }
    });
  }

  formatRupee(amount: number | undefined): string {
    const n = amount ?? 0; // fallback to 0
    // simple formatting — adapt to your locale if needed
    return '₹' + n.toLocaleString('en-IN');
  }

  retryAll() {
    // clear error and reload everything
    this.errorMessage = '';
    this.loadSummary();
    this.loadKpis();
    this.loadRecentActivities();
    this.loadCharts();
  }

  ngOnDestroy(): void {
    // destroy charts & unsubscribe
    if (this.propertiesChart) {
      this.propertiesChart.destroy();
      this.propertiesChart = null;
    }
    if (this.usersChart) {
      this.usersChart.destroy();
      this.usersChart = null;
    }
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
  }
  
}
async function loadChartJs() {
  const chartModule = await import('chart.js');
  chartModule.Chart.register(...chartModule.registerables);
  return chartModule.Chart;
}
