import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Auth } from './auth';

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
  | 'DeviceParametersEdit'
  | 'SchedulerConfiguration'; // For Actions/Jobs page

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
   * User authentication now relies on JWT token claims for user rights
   * 
   * Rights are extracted from JWT token payload instead of API endpoint
   * 
   * Available Rights:
   * - MasterDataDisplay: View PLU articles, texts
   * - MasterDataEdit: Edit PLU, texts
   * - OrderDisplay: View orders
   * - OrderEdit: Edit/start/stop/delete orders
   * - CaptureDisplay: Access capture page
   * - LabelDesignerDisplay: Access label preview
   * - SchedulerConfiguration: Access Actions/Jobs page
   * - SystemConfigurationDisplay: Future use
   * - SystemConfigurationEdit: Future use
   * - OeeDisplay: Future use
   * - CustomerDisplay: Future use
   * - CustomerEdit: Future use
   * - DeviceParametersDisplay: Future use
   * - DeviceParametersEdit: Future use
   */
  private http = inject(HttpClient);
  private auth = inject(Auth);
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
   * Extract user rights from JWT token
   */
  private extractRightsFromToken(allRights: Brain2Right[]): Record<Brain2Right, boolean> {
    try {
      // Get the Bearer token from auth service
      const token = this.auth.getToken();
      if (!token) {
        console.error('No authentication token available');
        const result: any = {};
        allRights.forEach(right => result[right] = false);
        return result;
      }

      // Decode JWT token to extract rights
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format');
        const result: any = {};
        allRights.forEach(right => result[right] = false);
        return result;
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log('✅ JWT payload decoded:', payload);

      // Extract rights from JWT payload
      // Check multiple possible property names (case-insensitive)
      const tokenRights = payload.Rights || payload.rights || payload.permissions || payload.Permissions || payload.role || payload.Role;
      console.log('📦 Extracted rights from JWT:', tokenRights);

      // Build the rights object
      const result: any = {};
      
      if (Array.isArray(tokenRights)) {
        // If rights are stored as an array of strings, check if each right is in the array
        console.log('📦 Rights is an array with', tokenRights.length, 'items');
        allRights.forEach(right => {
          result[right] = tokenRights.includes(right);
        });
      } else if (typeof tokenRights === 'object' && tokenRights !== null) {
        // If rights are stored as an object with boolean values
        console.log('📦 Rights is an object');
        allRights.forEach(right => {
          result[right] = tokenRights[right] === true || tokenRights[right] === 'true';
        });
      } else {
        // No rights found or unsupported format
        console.warn('⚠️ Rights not found or unsupported format in JWT token');
        allRights.forEach(right => {
          result[right] = false;
        });
      }

      console.log('📦 Final rights object:', result);
      return result as Record<Brain2Right, boolean>;
    } catch (error) {
      console.error('❌ Error extracting rights from JWT token:', error);
      // Return all rights as false on error
      const result: any = {};
      allRights.forEach(right => result[right] = false);
      return result;
    }
  }

  /**
   * Login user - authenticate with Brain2 and extract rights from JWT token
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
        'DeviceParametersEdit',
        'SchedulerConfiguration' // For Actions/Jobs page
      ];

      // Extract rights from JWT token instead of API call
      const rights = this.extractRightsFromToken(allRights);
      console.log('📦 Rights extracted from JWT token:', rights);
      console.log('📦 Rights type:', typeof rights);
      console.log('📦 Rights keys:', Object.keys(rights));

      const session: AuthSession = {
        username,
        displayName: displayName || username,
        rights,
        loginTime: Date.now()
      };

      console.log('📦 Session created:', session);
      console.log('📦 Session rights:', session.rights);

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
   * Check if user can access Actions/Jobs page
   */
  canViewActions(): boolean {
    return this.hasRight('SchedulerConfiguration');
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
    console.log('🔄 Restoring session from localStorage:', stored);
    if (stored) {
      try {
        const session = JSON.parse(stored) as AuthSession;
        console.log('🔄 Parsed session:', session);
        console.log('🔄 Session rights:', session.rights);
        
        // Optional: Check if session is expired (e.g., 8 hours)
        const maxAge = 8 * 60 * 60 * 1000; // 8 hours
        const age = Date.now() - session.loginTime;
        
        if (age < maxAge) {
          this.currentUserSignal.set(session);
          console.log('✅ Session restored successfully');
        } else {
          // Session expired
          console.log('⏰ Session expired');
          localStorage.removeItem('authSession');
        }
      } catch (e) {
        // Invalid session data
        console.error('❌ Failed to restore session:', e);
        localStorage.removeItem('authSession');
      }
    } else {
      console.log('ℹ️ No session in localStorage');
    }
  }
}
