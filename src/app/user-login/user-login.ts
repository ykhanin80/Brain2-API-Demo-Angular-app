import { Component, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';

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

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // If already logged in, redirect
    if (this.userService.isAuthenticated()) {
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

    // Simulate slight delay for better UX
    setTimeout(() => {
      const result = this.userService.login(username, password);
      this.isLoading.set(false);

      if (result.success) {
        this.redirectAfterLogin();
      } else {
        this.errorMessage.set(result.message);
        this.password.set(''); // Clear password on failed login
      }
    }, 300);
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
