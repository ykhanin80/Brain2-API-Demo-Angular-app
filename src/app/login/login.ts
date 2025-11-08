import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      displayName: ['']
    });
    
    // Redirect if already authenticated
    if (this.userService.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }
  
  async onSubmit(): Promise<void> {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const username = this.loginForm.value.username;
      const displayName = this.loginForm.value.displayName || username;
      
      const result = await this.userService.login(username, displayName);
      
      this.isLoading = false;
      
      if (result.success) {
        console.log('✅ User logged in and rights fetched from Brain2');
        this.redirectAfterLogin();
      } else {
        this.errorMessage = result.message;
        console.error('❌ Login failed:', result.message);
      }
    }
  }
  
  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigate([returnUrl]);
  }
}
