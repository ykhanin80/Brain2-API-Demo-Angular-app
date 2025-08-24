import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './auth';
import { ApiConfig } from './api-config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('order-app');
  private readonly authService = inject(Auth);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  readonly darkMode = signal(false);
  readonly apiConnected = signal<boolean | null>(null);
  private connSub?: Subscription;

  constructor(){
    effect(() => {
      if (this.darkMode()) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });
  }
  
  // Expose auth observables to template
  readonly isAuthenticated$ = this.authService.isAuthenticated$;
  readonly currentUser$ = this.authService.currentUser$;
  
  ngOnInit(): void {
    // Periodically check API connectivity (every 30s) and immediately on load
    this.connSub = interval(30000).pipe(startWith(0)).subscribe(() => this.checkApiConnection());
  }
  ngOnDestroy(): void { this.connSub?.unsubscribe(); }

  private checkApiConnection(): void {
    // Treat any HTTP response with a status code (>0) as reachable; status 0 => network error
  const baseUrl = this.apiConfig.getBaseUrl();
  this.http.get(baseUrl, { observe: 'response', responseType: 'text' as 'json' }).subscribe({
      next: () => this.apiConnected.set(true),
      error: (err: HttpErrorResponse) => {
        this.apiConnected.set(err.status > 0);
      }
    });
  }
  
  logout(): void {
    this.authService.logout();
  }
  toggleDarkMode(){ this.darkMode.update(v => !v); }
  
}
