import { Injectable, signal } from '@angular/core';

export interface ActionButtonConfig {
  id: string;
  buttonLabel: string;
  productionLine: string; // e.g., "Line 1", "Whole Birds Line1"
  jobName: string; // The custom job name created in Brain2
  order: number; // Display order on Actions page
}

@Injectable({
  providedIn: 'root'
})
export class ActionsConfigService {
  private readonly STORAGE_KEY = 'actions_button_config';
  
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
   * Load configurations from localStorage
   */
  private loadConfigs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const configs = JSON.parse(stored) as ActionButtonConfig[];
        this.configSignal.set(configs);
      } else {
        // Initialize with example configurations
        this.initializeDefaultConfigs();
      }
    } catch (e) {
      console.error('Failed to load action configs:', e);
      this.initializeDefaultConfigs();
    }
  }

  /**
   * Save configurations to localStorage
   */
  private saveConfigs(): void {
    try {
      const configs = this.configSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save action configs:', e);
    }
  }

  /**
   * Initialize with default example configurations
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: ActionButtonConfig[] = [
      {
        id: this.generateId(),
        buttonLabel: 'Line 1',
        productionLine: 'Line 1',
        jobName: 'SendToLine1',
        order: 0
      },
      {
        id: this.generateId(),
        buttonLabel: 'Line 2',
        productionLine: 'Line 2',
        jobName: 'SendToLine2',
        order: 1
      },
      {
        id: this.generateId(),
        buttonLabel: 'Whole Birds Line1',
        productionLine: 'Whole Birds Line1',
        jobName: 'SendWholeBirdsLine1',
        order: 2
      }
    ];
    this.configSignal.set(defaultConfigs);
    this.saveConfigs();
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
