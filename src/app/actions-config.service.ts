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

// Brain2 GeneralTexts number for action configurations
const BRAIN2_CONFIG_NUMBER = 999999999;

@Injectable({
  providedIn: 'root'
})
export class ActionsConfigService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  private readonly auth = inject(Auth);
  
  // Signal to hold all action button configurations
  private configSignal = signal<ActionButtonConfig[]>([]);
  
  constructor() {
    this.loadConfigs();
  }

  /**
   * Get all action button configurations
   */
  configs = this.configSignal.asReadonly();

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
   * Load configurations from Brain2 GeneralTexts
   */
  private async loadConfigs(): Promise<void> {
    try {
      const baseUrl = this.apiConfig.getBaseUrl();
      const token = this.auth.getToken();
      
      if (!token) {
        console.error('❌ No authentication token available for loading action configs');
        this.configSignal.set([]);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Read from Brain2 GeneralTexts API
      console.log(`📖 Loading from Brain2 GeneralTexts number: ${BRAIN2_CONFIG_NUMBER}`);
      
      const response = await firstValueFrom(
        this.http.get<any>(
          `${baseUrl}/extensions/api/GeneralTexts/Read?textNumber=${BRAIN2_CONFIG_NUMBER}`,
          { headers }
        )
      );

      console.log('✅ Loaded action configs from Brain2:', response);

      // Parse the textValue which contains the JSON configuration
      if (response && response.textValue) {
        const configs = JSON.parse(response.textValue) as ActionButtonConfig[];
        this.configSignal.set(configs);
        console.log(`✅ Parsed ${configs.length} action configurations`);
      } else {
        // No configuration exists yet, start with empty array
        console.log('ℹ️ No existing configuration, starting with empty array');
        this.configSignal.set([]);
      }
    } catch (e: any) {
      // If 404, it means no text exists yet - this is normal for first time
      if (e.status === 404) {
        console.log('ℹ️ No configuration exists yet (404), starting with empty array');
        this.configSignal.set([]);
      } else {
        console.error('❌ Failed to load action configs from Brain2:', e);
        this.configSignal.set([]);
      }
    }
  }

  /**
   * Manually refresh configurations from server (public method)
   */
  async refreshConfigs(): Promise<void> {
    await this.loadConfigs();
  }

  /**
   * Save configurations to Brain2 GeneralTexts
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

      console.log(`💾 Saving ${configs.length} configurations to Brain2 GeneralTexts number: ${BRAIN2_CONFIG_NUMBER}`);

      // Save to Brain2 GeneralTexts API
      await firstValueFrom(
        this.http.post(
          `${baseUrl}/extensions/api/GeneralTexts/CreateOrOverwrite`,
          {
            number: BRAIN2_CONFIG_NUMBER,
            textValue: configJson,
            sendFormat: false
          },
          { headers }
        )
      );

      console.log('✅ Saved action configs to Brain2 successfully');
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
