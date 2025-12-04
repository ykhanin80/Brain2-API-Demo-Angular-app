import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from './api-config';
import { Auth } from './auth';

export interface ActionButtonConfig {
  id: string;
  buttonLabel: string;
  productionLine?: string; // Optional - e.g., "Line 1", "Whole Birds Line1"
  jobName: string; // The custom job name created in Brain2
  order: number; // Display order on Actions page
}

// Brain2 Configuration API settings for action configurations
const CONFIG_NAME = 'DemoApp';
const CONFIG_KEY = 'ActionButtons';
const CONFIG_SUBKEY = 'Setting1';

@Injectable({
  providedIn: 'root'
})
export class ActionsConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  private readonly auth = inject(Auth);
  
  // Signal to hold all action button configurations
  private configSignal = signal<ActionButtonConfig[]>([]);
  
  // Signal to track if initial load is complete
  private loadingSignal = signal<boolean>(true);
  
  constructor() {
    // Subscribe to auth state and load configs when authenticated
    this.auth.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        // Add small delay to ensure token is fully set
        setTimeout(() => this.loadConfigs(), 50);
      } else {
        // Clear configs when logged out
        this.configSignal.set([]);
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Get all action button configurations
   */
  configs = this.configSignal.asReadonly();

  /**
   * Check if initial load is complete
   */
  isLoading = this.loadingSignal.asReadonly();

  /**
   * Get configurations as array (for non-reactive use)
   */
  getConfigs(): ActionButtonConfig[] {
    return this.configSignal();
  }

  /**
   * Add a new action button configuration
   */
  addConfig(config: Omit<ActionButtonConfig, 'id' | 'order'>): void {
    const newConfig: ActionButtonConfig = {
      ...config,
      id: this.generateId(),
      order: this.configSignal().length
    };

    this.configSignal.update(configs => [...configs, newConfig]);
    this.saveConfigs();
  }

  /**
   * Update an existing configuration
   */
  updateConfig(id: string, updates: Partial<ActionButtonConfig>): void {
    this.configSignal.update(configs =>
      configs.map(config => 
        config.id === id ? { ...config, ...updates } : config
      )
    );
    this.saveConfigs();
  }

  /**
   * Delete a configuration
   */
  deleteConfig(id: string): void {
    this.configSignal.update(configs => 
      configs.filter(config => config.id !== id)
    );
    this.saveConfigs();
  }

  /**
   * Reorder configurations
   */
  reorderConfigs(configs: ActionButtonConfig[]): void {
    const reordered = configs.map((config, index) => ({
      ...config,
      order: index
    }));
    this.configSignal.set(reordered);
    this.saveConfigs();
  }

  /**
   * Load configurations from Brain2 Configuration API
   */
  private async loadConfigs(): Promise<void> {
    try {
      this.loadingSignal.set(true);
      const baseUrl = this.apiConfig.getBaseUrl();
      const token = this.auth.getToken();
      
      if (!token) {
        console.log('ℹ️ No authentication token available, skipping action config load');
        this.configSignal.set([]);
        this.loadingSignal.set(false);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Read from Brain2 Configuration API
      console.log(`📖 Loading from Brain2 Configuration: ${CONFIG_NAME}/${CONFIG_KEY}/${CONFIG_SUBKEY}`);
      
      const params = {
        name: CONFIG_NAME,
        key: CONFIG_KEY,
        subkey: CONFIG_SUBKEY
      };
      
      const response = await firstValueFrom(
        this.http.get<any>(
          `${baseUrl}/extensions/api/configuration`,
          { headers, params }
        )
      );

      console.log('✅ Loaded action configs from Brain2:', response);

      // Parse the configurations array from the response
      if (response && response.configurations && response.configurations.length > 0) {
        const configValue = response.configurations[0].value;
        if (configValue) {
          const configs = JSON.parse(configValue) as ActionButtonConfig[];
          this.configSignal.set(configs);
          console.log(`✅ Parsed ${configs.length} action configurations`);
        } else {
          console.log('ℹ️ Configuration exists but value is empty, starting with empty array');
          this.configSignal.set([]);
        }
      } else {
        // No configuration exists yet, start with empty array
        console.log('ℹ️ No existing configuration, starting with empty array');
        this.configSignal.set([]);
      }
      this.loadingSignal.set(false);
    } catch (e: any) {
      // If 404, it means no configuration exists yet - this is normal for first time
      if (e.status === 404) {
        console.log('ℹ️ No configuration exists yet (404), starting with empty array');
        this.configSignal.set([]);
      } else if (e.status === 400) {
        // 400 often means user doesn't have permission to access Configuration
        console.log('ℹ️ User does not have permission to read action configurations (400). This is normal for users without SystemConfigurationDisplay rights.');
        this.configSignal.set([]);
      } else if (e.status === 401 || e.status === 403) {
        // Auth error - token might be invalid
        console.warn('⚠️ Authentication error (status ' + e.status + '). Please re-login.');
        this.configSignal.set([]);
        // Trigger re-authentication by clearing the token
        console.log('🔄 Clearing invalid token to trigger re-login');
        this.auth.logout();
      } else {
        console.error('❌ Failed to load action configs from Brain2:', e);
        this.configSignal.set([]);
      }
      this.loadingSignal.set(false);
    }
  }

  /**
   * Manually refresh configurations from server (public method)
   */
  async refreshConfigs(): Promise<void> {
    await this.loadConfigs();
  }

  /**
   * Save configurations to Brain2 Configuration API
   */
  private async saveConfigs(): Promise<void> {
    try {
      const baseUrl = this.apiConfig.getBaseUrl();
      const token = this.auth.getToken();
      
      if (!token) {
        console.error('❌ No authentication token available for saving action configs');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const configs = this.configSignal();
      const configJson = JSON.stringify(configs);

      console.log(`💾 Saving ${configs.length} configurations to Brain2 Configuration: ${CONFIG_NAME}/${CONFIG_KEY}/${CONFIG_SUBKEY}`);

      // Save to Brain2 Configuration API
      await firstValueFrom(
        this.http.post(
          `${baseUrl}/extensions/api/configuration`,
          {
            name: CONFIG_NAME,
            key: CONFIG_KEY,
            subkey: CONFIG_SUBKEY,
            value: configJson
          },
          { headers }
        )
      );

      console.log('✅ Saved action configs to Brain2 Configuration successfully');
    } catch (e) {
      console.error('❌ Failed to save action configs to Brain2:', e);
      throw e; // Re-throw so caller knows it failed
    }
  }



  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all configurations
   */
  clearAllConfigs(): void {
    this.configSignal.set([]);
    this.saveConfigs();
  }
}
