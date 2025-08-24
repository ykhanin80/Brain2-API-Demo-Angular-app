import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, LoginRequest } from '../auth';
import { ApiConfig } from '../api-config';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiConfig = inject(ApiConfig);
  
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      host: [this.apiConfig.state.host, [Validators.required]],
      port: [this.apiConfig.state.port, [Validators.required]],
      useHttps: [this.apiConfig.state.useHttps]
    });
    
    // Redirect if already authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.redirectAfterLogin();
      }
    });
    // Auto-toggle HTTPS by common port selection
    this.loginForm.get('port')?.valueChanges.subscribe((val) => {
      const portNum = Number(val);
      if (portNum === 9997) {
        this.loginForm.get('useHttps')?.setValue(false, { emitEvent: false });
      } else if (portNum === 9998) {
        this.loginForm.get('useHttps')?.setValue(true, { emitEvent: false });
      }
    });
  }
  
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
  // Persist API config
  const host: string = this.loginForm.value.host?.trim() || 'localhost';
  const port: number = Number(this.loginForm.value.port) || 9997;
  const useHttps: boolean = !!this.loginForm.value.useHttps;
  this.apiConfig.setAll(host, port, useHttps);
      
      const credentials: LoginRequest = {
        authenticationMode: 'credentials',
        userName: this.loginForm.value.username,
        password: this.loginForm.value.password
      };
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Authenticated and token obtained!', {
            token: response.token.substring(0, 20) + '...',
            user: response.user
          });
          this.redirectAfterLogin();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
          console.error('❌ Authentication failed:', error);
        }
      });
    }
  }
  
  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigate([returnUrl]);
  }
  
  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Invalid username or password';
    } else if (error.status === 0) {
      return 'Unable to connect to server';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
