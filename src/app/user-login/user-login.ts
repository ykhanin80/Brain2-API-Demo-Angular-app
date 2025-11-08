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

    // Step 1: Authenticate with Brain2 to get token
    const credentials = {
      authenticationMode: 'credentials' as const,
      userName: username,
      password: password
    };

    this.auth.login(credentials).subscribe({
      next: async (response) => {
        // Brain2 authentication successful - token is now stored in auth service
        console.log('✅ Brain2 authentication successful, token obtained');

        // Step 2: Fetch user rights from Brain2 using the token
        const rightsResult = await this.userService.login(username, username);
        
        if (rightsResult.success) {
          // Rights fetched successfully
          console.log('✅ User rights fetched from Brain2');
          this.isLoading.set(false);
          this.redirectAfterLogin();
        } else {
          // Rights fetch failed
          this.isLoading.set(false);
          this.errorMessage.set(
            `Authenticated but failed to fetch user rights: ${rightsResult.message}`
          );
        }
      },
      error: (error) => {
        // Brain2 authentication failed
        this.isLoading.set(false);
        
        if (error.status === 401) {
          this.errorMessage.set('Invalid username or password');
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
      // Always redirect to dashboard (accessible to all authenticated users)
      this.router.navigate(['/dashboard']);
    }
  }
}
