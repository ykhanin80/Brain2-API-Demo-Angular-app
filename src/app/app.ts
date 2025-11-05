import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './auth';
import { ApiConfig } from './api-config';
import { UserService } from './user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('order-app');
  private readonly authService = inject(Auth);
  private readonly userService = inject(UserService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  private readonly router = inject(Router);
  readonly darkMode = signal(true);
  readonly apiConnected = signal<boolean | null>(null);
  readonly menuOpen = signal(false);
  private connSub?: Subscription;
  // Token countdown
  readonly tokenSecondsLeft = signal<number | null>(null);
  private tokenTimer?: any;

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
  
  // Expose local user info
  readonly localUser = this.userService.currentUser;
  
  ngOnInit(): void {
    // Periodically check API connectivity (every 30s) and immediately on load
    this.connSub = interval(30000).pipe(startWith(0)).subscribe(() => this.checkApiConnection());
    // Start token countdown ticker
    this.startTokenTicker();
  }
  ngOnDestroy(): void { this.connSub?.unsubscribe(); if (this.tokenTimer) clearInterval(this.tokenTimer); }

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
  private startTokenTicker(){
    if (this.tokenTimer) clearInterval(this.tokenTimer);
    const update = () => {
      const expiry = this.authService.getTokenExpiryMs();
      if (!expiry) { this.tokenSecondsLeft.set(null); return; }
      const s = Math.max(0, Math.floor((expiry - Date.now())/1000));
      this.tokenSecondsLeft.set(s);
    };
    update();
    this.tokenTimer = setInterval(update, 1000);
  }
  
  // Format seconds as HH:MM:SS
  formatSeconds(total: number): string {
    const s = Math.max(0, Math.floor(total));
    const hh = Math.floor(s / 3600).toString().padStart(2, '0');
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  logoutUser(): void {
    this.userService.logout();
    this.authService.logout();
    this.router.navigate(['/user-login']);
  }
  
  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }
  
  closeMenu(): void {
    this.menuOpen.set(false);
  }
  
  toggleDarkMode(){ this.darkMode.update(v => !v); }
  
}
