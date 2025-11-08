import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

// Brain2 User Rights
export type Brain2Right = 
  | 'MasterDataDisplay'
  | 'MasterDataEdit'
  | 'OrderDisplay'
  | 'OrderEdit'
  | 'SystemConfigurationDisplay'
  | 'SystemConfigurationEdit'
  | 'CaptureDisplay'
  | 'LabelDesignerDisplay'
  | 'OeeDisplay'
  | 'CustomerDisplay'
  | 'CustomerEdit'
  | 'DeviceParametersDisplay'
  | 'DeviceParametersEdit';

export interface Brain2UserRights {
  username: string;
  rights: Record<Brain2Right, boolean>;
}

export interface AuthSession {
  username: string;
  displayName: string;
  rights: Record<Brain2Right, boolean>;
  loginTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * User authentication now relies entirely on Brain2 User Rights API
   * 
   * Rights are checked via: /extensions/api/UserRights/CheckMultipleRights
   * 
   * Available Rights:
   * - MasterDataDisplay: View PLU articles, texts
   * - MasterDataEdit: Edit PLU, texts
   * - OrderDisplay: View orders
   * - OrderEdit: Edit/start/stop/delete orders
   * - CaptureDisplay: Access capture page
   * - LabelDesignerDisplay: Access label preview
   * - SystemConfigurationDisplay: Future use
   * - SystemConfigurationEdit: Future use
   * - OeeDisplay: Future use
   * - CustomerDisplay: Future use
   * - CustomerEdit: Future use
   * - DeviceParametersDisplay: Future use
   * - DeviceParametersEdit: Future use
   */
  private http = inject(HttpClient);
  private brain2ApiUrl = 'http://localhost:9997'; // Brain2 API base URL
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
   * Check user rights from Brain2 API
   */
  async checkUserRights(username: string, rights: Brain2Right[]): Promise<Record<Brain2Right, boolean>> {
    try {
      const response = await firstValueFrom(
        this.http.post<Record<Brain2Right, boolean>>(
          `${this.brain2ApiUrl}/extensions/api/UserRights/CheckMultipleRights`,
          { username, rights }
        )
      );
      return response;
    } catch (error) {
      console.error('Error checking user rights:', error);
      // Return all rights as false on error
      const result: any = {};
      rights.forEach(right => result[right] = false);
      return result;
    }
  }

  /**
   * Login user - authenticate with Brain2 and fetch their rights
   */
  async login(username: string, displayName?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Fetch all available rights for the user
      const allRights: Brain2Right[] = [
        'MasterDataDisplay',
        'MasterDataEdit',
        'OrderDisplay',
        'OrderEdit',
        'SystemConfigurationDisplay',
        'SystemConfigurationEdit',
        'CaptureDisplay',
        'LabelDesignerDisplay',
        'OeeDisplay',
        'CustomerDisplay',
        'CustomerEdit',
        'DeviceParametersDisplay',
        'DeviceParametersEdit'
      ];

      const rights = await this.checkUserRights(username, allRights);

      const session: AuthSession = {
        username,
        displayName: displayName || username,
        rights,
        loginTime: Date.now()
      };

      this.currentUserSignal.set(session);
      this.saveSession(session);

      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Failed to fetch user rights'
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
   * Check if user has a specific right
   */
  hasRight(right: Brain2Right): boolean {
    const user = this.currentUserSignal();
    return user?.rights[right] === true;
  }

  /**
   * Check if user can edit (has any edit rights)
   */
  canEdit(): boolean {
    return this.hasRight('MasterDataEdit') || this.hasRight('OrderEdit');
  }

  /**
   * Check if user can view master data
   */
  canViewMasterData(): boolean {
    return this.hasRight('MasterDataDisplay');
  }

  /**
   * Check if user can edit master data
   */
  canEditMasterData(): boolean {
    return this.hasRight('MasterDataEdit');
  }

  /**
   * Check if user can view orders
   */
  canViewOrders(): boolean {
    return this.hasRight('OrderDisplay');
  }

  /**
   * Check if user can edit orders
   */
  canEditOrders(): boolean {
    return this.hasRight('OrderEdit');
  }

  /**
   * Check if user can view capture
   */
  canViewCapture(): boolean {
    return this.hasRight('CaptureDisplay');
  }

  /**
   * Check if user can view label designer
   */
  canViewLabelDesigner(): boolean {
    return this.hasRight('LabelDesignerDisplay');
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
}
