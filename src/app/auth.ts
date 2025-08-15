import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface LoginRequest {
  authenticationMode: 'credentials' | 'cookie';
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    language?: string;
  };
}

export interface User {
  id: string;
  name: string;
  language?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = 'http://localhost:9997'; // Adjust this to match your API base URL
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  
  private readonly _isAuthenticated = new BehaviorSubject<boolean>(this.hasValidToken());
  private readonly _currentUser = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  
  // Public observables
  public readonly isAuthenticated$ = this._isAuthenticated.asObservable();
  public readonly currentUser$ = this._currentUser.asObservable();
  
  constructor() {
    // Check token validity on service initialization
    this.checkTokenValidity();
  }
  
  /**
   * Authenticate user with credentials
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/v1/token`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Logout user and clear stored data
   */
  logout(): void {
    this.clearAuthData();
  }
  
  /**
   * Refresh the authentication token
   */
  refreshToken(): Observable<LoginResponse> {
    // This API doesn't support refresh tokens
    return throwError(() => new Error('Refresh token not supported by this API'));
  }
  
  /**
   * Get the current bearer token
   */
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Get the refresh token
   */
  getRefreshToken(): string | null {
    // This API doesn't support refresh tokens
    return null;
  }
  
  /**
   * Get current user information
   */
  getCurrentUser(): User | null {
    return this._currentUser.value;
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }
  
  /**
   * Force logout (clear data without server call)
   */
  forceLogout(): void {
    this.clearAuthData();
  }
  
  // Private methods
  
  private setAuthData(response: LoginResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Store token
    localStorage.setItem(this.TOKEN_KEY, response.token);
    
    // Store user data
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this._currentUser.next(response.user);
    
    // Update authentication status
    this._isAuthenticated.next(true);
  }
  
  private clearAuthData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this._isAuthenticated.next(false);
      this._currentUser.next(null);
      return;
    }
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this._isAuthenticated.next(false);
    this._currentUser.next(null);
  }
  
  private hasValidToken(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = this.getToken();
    if (!token) return false;
    
    // Basic token validation - you might want to add JWT expiration check
    try {
      // If using JWT, you can decode and check expiration here
      // const payload = JSON.parse(atob(token.split('.')[1]));
      // return payload.exp * 1000 > Date.now();
      
      // For now, just check if token exists
      return true;
    } catch {
      return false;
    }
  }
  
  private getCurrentUserFromStorage(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    try {
      const userJson = localStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }
  
  private checkTokenValidity(): void {
    const isValid = this.hasValidToken();
    this._isAuthenticated.next(isValid);
    
    if (!isValid) {
      this.clearAuthData();
    }
  }
}
