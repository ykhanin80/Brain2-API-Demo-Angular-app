import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

export interface ActionButtonConfig {
  id: string;
  buttonLabel: string;
  productionLine?: string; // Optional - e.g., "Line 1", "Whole Birds Line1"
  jobName: string; // The custom job name created in Brain2
  order: number; // Display order on Actions page
}

@Injectable({
  providedIn: 'root'
})
export class ActionsConfigService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/action-configurations`;
  
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
   * Load configurations from server
   */
  private async loadConfigs(): Promise<void> {
    try {
      const configs = await firstValueFrom(
        this.http.get<ActionButtonConfig[]>(this.API_URL)
      );
      this.configSignal.set(configs);
    } catch (e) {
      console.error('Failed to load action configs from server:', e);
      // On error, keep empty array or try to load from localStorage as fallback
      this.loadFromLocalStorageFallback();
    }
  }

  /**
   * Manually refresh configurations from server (public method)
   */
  async refreshConfigs(): Promise<void> {
    await this.loadConfigs();
  }

  /**
   * Fallback to localStorage if server is not available
   */
  private loadFromLocalStorageFallback(): void {
    try {
      const stored = localStorage.getItem('actions_button_config');
      if (stored) {
        const configs = JSON.parse(stored) as ActionButtonConfig[];
        this.configSignal.set(configs);
        console.warn('Loaded from localStorage fallback');
      }
    } catch (e) {
      console.error('Failed to load from localStorage fallback:', e);
    }
  }

  /**
   * Save configurations to server
   */
  private async saveConfigs(): Promise<void> {
    try {
      const configs = this.configSignal();
      await firstValueFrom(
        this.http.post(this.API_URL, configs)
      );
      // Also save to localStorage as backup
      localStorage.setItem('actions_button_config', JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save action configs to server:', e);
      // Still save to localStorage as fallback
      try {
        const configs = this.configSignal();
        localStorage.setItem('actions_button_config', JSON.stringify(configs));
      } catch (localError) {
        console.error('Failed to save to localStorage:', localError);
      }
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
