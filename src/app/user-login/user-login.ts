import { Component, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';
import { Auth } from '../auth';
import { ApiConfig } from '../api-config';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-login.html',
  styleUrl: './user-login.scss'
})
export class UserLoginComponent {
  username = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  private readonly userService = inject(UserService);
  private readonly auth = inject(Auth);
  private readonly apiConfig = inject(ApiConfig);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    // If already logged in, redirect
    if (this.userService.isAuthenticated() && this.auth.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }

  onUsernameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.username.set(input.value);
    this.errorMessage.set(''); // Clear error on input
  }

  onPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
    this.errorMessage.set(''); // Clear error on input
  }

  onSubmit(): void {
    const username = this.username().trim();
    const password = this.password().trim();

    if (!username || !password) {
      this.errorMessage.set('Please enter username and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Step 1: Authenticate with Brain2 first
    const credentials = {
      authenticationMode: 'credentials' as const,
      userName: username,
      password: password
    };

    this.auth.login(credentials).subscribe({
      next: async (response) => {
        // Brain2 authentication successful
        console.log('Brain2 authentication successful');

        // Step 2: Automatically login locally with same credentials
        const localResult = await this.userService.login(username, password);
        
        if (localResult.success) {
          // Both logins successful
          this.isLoading.set(false);
          this.redirectAfterLogin();
        } else {
          // Brain2 worked but local user not found - show helpful message
          this.isLoading.set(false);
          this.errorMessage.set(
            `Brain2 authentication successful, but local user "${username}" not found. ` +
            `Please contact admin to create local user account.`
          );
        }
      },
      error: (error) => {
        // Brain2 authentication failed
        this.isLoading.set(false);
        
        if (error.status === 401) {
          this.errorMessage.set('Invalid username or password for Brain2');
        } else if (error.status === 0) {
          this.errorMessage.set(
            `Cannot connect to Brain2 server at ${this.apiConfig.getBaseUrl()}. ` +
            `Please check server configuration.`
          );
        } else {
          this.errorMessage.set(
            `Brain2 login failed: ${error.statusText || error.message || 'Unknown error'}`
          );
        }
        
        this.password.set(''); // Clear password on failed login
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }

  private redirectAfterLogin(): void {
    // Check for return URL
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      // Redirect to first accessible page
      const pages = this.userService.getAccessiblePages();
      const redirectTo = pages.length > 0 ? `/${pages[0]}` : '/dashboard';
      this.router.navigate([redirectTo]);
    }
  }
}
