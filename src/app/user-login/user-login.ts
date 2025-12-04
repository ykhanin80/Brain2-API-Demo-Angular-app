import { Component, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';
import { Auth } from '../auth';
import { ApiConfig } from '../api-config';
import { HttpClient } from '@angular/common/http';

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
  host = signal('');
  port = signal(0);
  useHttps = signal(false);
  brain2Version = signal<'v2' | 'v3'>('v3');
  errorMessage = signal('');
  isLoading = signal(false);
  isTestingConnection = signal(false);
  testStatus = signal('');

  private readonly userService = inject(UserService);
  private readonly auth = inject(Auth);
  private readonly apiConfig = inject(ApiConfig);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    // If already logged in, redirect
    if (this.userService.isAuthenticated() && this.auth.isAuthenticated()) {
      this.redirectAfterLogin();
    }

    // Load current API config
    this.host.set(this.apiConfig.state.host);
    this.port.set(this.apiConfig.state.port);
    this.useHttps.set(this.apiConfig.state.useHttps);
    this.brain2Version.set(this.apiConfig.getBrain2Version());
  }

  toggleBrain2Version(): void {
    const newVersion = this.brain2Version() === 'v2' ? 'v3' : 'v2';
    this.brain2Version.set(newVersion);
    this.apiConfig.setBrain2Version(newVersion);
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

  onHostInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.host.set(input.value);
    this.testStatus.set(''); // Clear test status
  }

  onPortInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const portNum = Number(input.value);
    this.port.set(portNum);
    
    // Auto-toggle HTTPS by common port selection
    if (portNum === 9997) {
      this.useHttps.set(false);
    } else if (portNum === 9998) {
      this.useHttps.set(true);
    }
    
    this.testStatus.set(''); // Clear test status
  }

  onHttpsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.useHttps.set(input.checked);
    this.testStatus.set(''); // Clear test status
  }

  async testConnection(): Promise<void> {
    if (this.isTestingConnection()) return;
    
    this.isTestingConnection.set(true);
    this.testStatus.set('');
    
    try {
      const host = this.host().trim() || 'localhost';
      const port = this.port() || 9997;
      const protocol = this.useHttps() ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}:${port}`;

      // Try swagger endpoints
      const candidates = [
        `${baseUrl}/swagger.json`,
        `${baseUrl}/swagger/v1/swagger.json`,
        `${baseUrl}/swagger`,
        `${baseUrl}/health`,
      ];

      let lastError: any = null;
      for (const url of candidates) {
        try {
          await this.http.get(url, { responseType: 'text' }).toPromise();
          this.testStatus.set(`✅ Connected: ${url}`);
          this.isTestingConnection.set(false);
          return;
        } catch (e) {
          lastError = e;
        }
      }

      // If none succeeded, show error
      const hint = this.getConnectionHint(lastError);
      this.testStatus.set(`❌ Cannot connect to ${baseUrl}. ${hint}`);
    } catch (e) {
      this.testStatus.set('❌ Test failed unexpectedly.');
    } finally {
      this.isTestingConnection.set(false);
    }
  }

  private getConnectionHint(err: any): string {
    if (!err) return '';
    const status = err?.status;
    if (status === 0) {
      return 'Possible TLS trust or CORS issue. Open the API URL in this browser to trust certificate, or enable CORS on the server.';
    }
    if (status === 404) return 'Endpoint not found (try a different base path or check swagger availability).';
    if (status === 401 || status === 403) return 'Server reachable but requires authentication or disallowed. Login may still work.';
    return `HTTP ${status ?? 'unknown'} ${err?.statusText ?? ''}`.trim();
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

    // Persist API config
    const host = this.host().trim() || 'localhost';
    const port = this.port() || 9997;
    const useHttps = this.useHttps();
    this.apiConfig.setAll(host, port, useHttps);

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
