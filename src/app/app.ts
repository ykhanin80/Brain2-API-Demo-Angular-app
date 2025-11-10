import { Component, signal, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './auth';
import { ApiConfig } from './api-config';
import { UserService, Brain2Right } from './user.service';

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

  // Check if user has specific rights for menu visibility
  canViewMasterData(): boolean {
    return this.userService.canViewMasterData();
  }
  
  canViewOrders(): boolean {
    return this.userService.canViewOrders();
  }
  
  canViewCapture(): boolean {
    return this.userService.canViewCapture();
  }
  
  canViewLabelDesigner(): boolean {
    return this.userService.canViewLabelDesigner();
  }
  
  canViewActions(): boolean {
    return this.userService.canViewActions();
  }
  
  canConfigureActions(): boolean {
    return this.userService.hasRight('SystemConfigurationEdit');
  }
  
  canEditMasterData(): boolean {
    return this.userService.canEditMasterData();
  }
  
  canEditOrders(): boolean {
    return this.userService.canEditOrders();
  }

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
