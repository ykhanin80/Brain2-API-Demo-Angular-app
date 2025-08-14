import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('order-app');
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  
  // Expose auth observables to template
  readonly isAuthenticated$ = this.authService.isAuthenticated$;
  readonly currentUser$ = this.authService.currentUser$;
  
  logout(): void {
    this.authService.logout();
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }
}
