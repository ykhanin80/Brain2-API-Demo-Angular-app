import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'admin' | 'operator' | 'viewer' | 'custom';

export type PagePermission = 
  | 'dashboard' 
  | 'create-order' 
  | 'all-orders' 
  | 'capture' 
  | 'actions' 
  | 'data-maintenance' 
  | 'package-record' 
  | 'label-preview' 
  | 'settings';

export interface User {
  username: string;
  password?: string; // Only used when creating/updating
  role: UserRole;
  displayName: string;
  permissions?: PagePermission[]; // Custom permissions for each user
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  username: string;
  role: UserRole;
  displayName: string;
  permissions: PagePermission[];
  loginTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * Users are now stored server-side in data/users.json
   * 
   * DEFAULT CREDENTIALS:
   * -------------------
   * Admin (full access):
   *   Username: admin
   *   Password: admin123
   *   Access: All pages (Dashboard, Orders, Actions, Data Maintenance, Settings)
   * 
   * Operator (actions only):
   *   Username: operator
   *   Password: operator123
   *   Access: Actions page only
   * 
   * Viewer (read-only):
   *   Username: viewer
   *   Password: viewer123
   *   Access: Dashboard and All Orders (view only)
   * 
   * CHANGE THESE PASSWORDS BEFORE DEPLOYMENT!
   * 
   * Passwords are stored as SHA-256 hashes on the server.
   */
  private http = inject(HttpClient);
  private currentUserSignal = signal<AuthSession | null>(null);
  
  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  /**
   * Get the current authenticated user
   */
  currentUser = this.currentUserSignal.asReadonly();

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: UserRole): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  /**
   * Check if current user has at least the specified role level
   * admin > operator > viewer > custom (custom is checked by permissions)
   */
  hasMinimumRole(minimumRole: UserRole): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      'admin': 4,
      'operator': 3,
      'viewer': 2,
      'custom': 1
    };

    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  }

  /**
   * Attempt to login with username and password
   */
  async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message?: string; user?: Omit<User, 'password'> }>(
          '/api/users/validate',
          { username, password }
        )
      );

      if (response.success && response.user) {
        const session: AuthSession = {
          username: response.user.username,
          role: response.user.role,
          displayName: response.user.displayName,
          permissions: response.user.permissions || this.getDefaultPermissions(response.user.role),
          loginTime: Date.now()
        };

        this.currentUserSignal.set(session);
        this.saveSession(session);

        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error?.error?.message || 'Login failed - server error' 
      };
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('authSession');
  }

  /**
   * Save session to localStorage
   */
  private saveSession(session: AuthSession): void {
    localStorage.setItem('authSession', JSON.stringify(session));
  }

  /**
   * Restore session from localStorage
   */
  private restoreSession(): void {
    const stored = localStorage.getItem('authSession');
    if (stored) {
      try {
        const session = JSON.parse(stored) as AuthSession;
        
        // Optional: Check if session is expired (e.g., 8 hours)
        const maxAge = 8 * 60 * 60 * 1000; // 8 hours
        const age = Date.now() - session.loginTime;
        
        if (age < maxAge) {
          this.currentUserSignal.set(session);
        } else {
          // Session expired
          localStorage.removeItem('authSession');
        }
      } catch (e) {
        // Invalid session data
        localStorage.removeItem('authSession');
      }
    }
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
      'admin': 'Administrator',
      'operator': 'Operator',
      'viewer': 'Viewer',
      'custom': 'Custom'
    };
    return names[role];
  }

  /**
   * Get default permissions based on role
   */
  getDefaultPermissions(role: UserRole): PagePermission[] {
    switch (role) {
      case 'admin':
        return ['dashboard', 'create-order', 'all-orders', 'capture', 'actions', 'data-maintenance', 'package-record', 'label-preview', 'settings'];
      case 'operator':
        return ['actions'];
      case 'viewer':
        return ['dashboard', 'all-orders'];
      case 'custom':
        return [];
      default:
        return [];
    }
  }

  /**
   * Get list of pages accessible to current user
   */
  getAccessiblePages(): PagePermission[] {
    const user = this.currentUserSignal();
    if (!user) return [];

    // If user has custom permissions, use those
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    // Otherwise use role-based defaults
    return this.getDefaultPermissions(user.role);
  }

  /**
   * Check if user has permission to access a specific page
   */
  hasPermission(page: PagePermission): boolean {
    const permissions = this.getAccessiblePages();
    return permissions.includes(page);
  }

  /**
   * Check if user can access a specific route
   */
  canAccessRoute(route: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;

    const accessiblePages = this.getAccessiblePages();
    return accessiblePages.some(page => route.includes(page));
  }

  /**
   * Get all users (for admin management)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await firstValueFrom(
        this.http.get<User[]>('/api/users')
      );
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  /**
   * Add a new user
   */
  async addUser(user: User): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          '/api/users',
          user
        )
      );
      return response;
    } catch (error: any) {
      console.error('Error adding user:', error);
      return { 
        success: false, 
        message: error?.error?.message || 'Failed to add user' 
      };
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(username: string, updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ success: boolean; message: string }>(
          `/api/users/${username}`,
          updates
        )
      );
      return response;
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { 
        success: false, 
        message: error?.error?.message || 'Failed to update user' 
      };
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(username: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{ success: boolean; message: string }>(
          `/api/users/${username}`
        )
      );
      return response;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { 
        success: false, 
        message: error?.error?.message || 'Failed to delete user' 
      };
    }
  }
}
