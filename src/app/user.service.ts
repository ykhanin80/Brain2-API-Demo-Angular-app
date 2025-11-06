import { Injectable, signal } from '@angular/core';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  username: string;
  password: string; // In production, this would be hashed
  role: UserRole;
  displayName: string;
}

export interface AuthSession {
  username: string;
  role: UserRole;
  displayName: string;
  loginTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * Predefined users - in production, this would come from a backend
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
   */
  private users: User[] = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      displayName: 'Administrator'
    },
    {
      username: 'operator',
      password: 'operator123',
      role: 'operator',
      displayName: 'Actions Operator'
    },
    {
      username: 'viewer',
      password: 'viewer123',
      role: 'viewer',
      displayName: 'Viewer'
    }
  ];

  private currentUserSignal = signal<AuthSession | null>(null);
  
  constructor() {
    // Load users from localStorage (if any were saved)
    this.loadUsersFromStorage();
    
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
   * admin > operator > viewer
   */
  hasMinimumRole(minimumRole: UserRole): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      'admin': 3,
      'operator': 2,
      'viewer': 1
    };

    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  }

  /**
   * Attempt to login with username and password
   */
  login(username: string, password: string): { success: boolean; message: string } {
    const user = this.users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const session: AuthSession = {
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      loginTime: Date.now()
    };

    this.currentUserSignal.set(session);
    this.saveSession(session);

    return { success: true, message: 'Login successful' };
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
      'viewer': 'Viewer'
    };
    return names[role];
  }

  /**
   * Get list of pages accessible to current user
   */
  getAccessiblePages(): string[] {
    const user = this.currentUserSignal();
    if (!user) return [];

    switch (user.role) {
      case 'admin':
        return ['dashboard', 'create-order', 'all-orders', 'actions', 'data-maintenance', 'settings'];
      case 'operator':
        return ['actions'];
      case 'viewer':
        return ['dashboard', 'all-orders'];
      default:
        return [];
    }
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
  getAllUsers(): User[] {
    return [...this.users];
  }

  /**
   * Add a new user
   */
  addUser(user: User): { success: boolean; message: string } {
    // Check if username already exists
    if (this.users.some(u => u.username === user.username)) {
      return { success: false, message: 'Username already exists' };
    }

    this.users.push({ ...user });
    this.saveUsersToStorage();
    return { success: true, message: 'User created successfully' };
  }

  /**
   * Update an existing user
   */
  updateUser(username: string, updates: Partial<User>): { success: boolean; message: string } {
    const index = this.users.findIndex(u => u.username === username);
    if (index === -1) {
      return { success: false, message: 'User not found' };
    }

    // Don't allow changing username
    if (updates.username && updates.username !== username) {
      return { success: false, message: 'Cannot change username' };
    }

    this.users[index] = { ...this.users[index], ...updates };
    this.saveUsersToStorage();
    return { success: true, message: 'User updated successfully' };
  }

  /**
   * Delete a user
   */
  deleteUser(username: string): { success: boolean; message: string } {
    if (username === 'admin') {
      return { success: false, message: 'Cannot delete admin user' };
    }

    const index = this.users.findIndex(u => u.username === username);
    if (index === -1) {
      return { success: false, message: 'User not found' };
    }

    this.users.splice(index, 1);
    this.saveUsersToStorage();
    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Save users to localStorage
   */
  private saveUsersToStorage(): void {
    try {
      localStorage.setItem('localUsers', JSON.stringify(this.users));
    } catch (e) {
      console.error('Failed to save users to storage:', e);
    }
  }

  /**
   * Load users from localStorage
   */
  private loadUsersFromStorage(): void {
    try {
      const stored = localStorage.getItem('localUsers');
      if (stored) {
        this.users = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load users from storage:', e);
    }
  }
}
