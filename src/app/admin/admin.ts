import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActionsConfigService, ActionButtonConfig } from '../actions-config.service';
import { UserService } from '../user.service';
import { ApiConfig } from '../api-config';
import { Auth } from '../auth';

interface EditingAction {
  id: string;
  buttonLabel: string;
  productionLine?: string;
  jobName: string;
  isNew?: boolean;
}

interface ProductionLine {
  id: string;
  name: string;
}

/**
 * Admin Configuration Page
 * Only accessible to users with SystemConfigurationEdit right
 * Allows configuration of Actions/Jobs button mappings
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit {
  private readonly actionsConfigService = inject(ActionsConfigService);
  private readonly userService = inject(UserService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  private readonly auth = inject(Auth);

  // Action configurations
  actionConfigs = this.actionsConfigService.configs;
  editingAction = signal<EditingAction | null>(null);
  isAddingAction = signal(false);

  // Production lines
  productionLines = signal<ProductionLine[]>([]);
  isLoadingLines = signal(false);

  // Message
  message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  ngOnInit() {
    this.loadActionConfigs();
    this.loadProductionLines();
  }

  /**
   * Check if current user can edit configurations
   */
  canEdit(): boolean {
    return this.userService.hasRight('SystemConfigurationEdit');
  }

  /**
   * Load action configurations from service
   */
  async loadActionConfigs() {
    try {
      await this.actionsConfigService.refreshConfigs();
      this.showMessage('success', 'Action configurations loaded successfully');
    } catch (e) {
      this.showMessage('error', 'Failed to load action configurations');
    }
  }

  /**
   * Start adding a new action button
   */
  startAddAction() {
    if (!this.canEdit()) {
      this.showMessage('error', 'You do not have permission to edit configurations');
      return;
    }

    this.isAddingAction.set(true);
    this.editingAction.set({
      id: '',
      buttonLabel: '',
      productionLine: '',
      jobName: '',
      isNew: true
    });
  }

  /**
   * Start editing an existing action
   */
  startEditAction(action: ActionButtonConfig) {
    if (!this.canEdit()) {
      this.showMessage('error', 'You do not have permission to edit configurations');
      return;
    }

    this.editingAction.set({
      id: action.id,
      buttonLabel: action.buttonLabel,
      productionLine: action.productionLine || '',
      jobName: action.jobName,
      isNew: false
    });
  }

  /**
   * Update action field during editing
   */
  updateActionField(field: keyof EditingAction, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    const current = this.editingAction();
    if (current) {
      this.editingAction.set({
        ...current,
        [field]: field === 'productionLine' && value === '' ? undefined : value
      });
    }
  }

  /**
   * Save action (add new or update existing)
   */
  saveAction() {
    const editing = this.editingAction();
    if (!editing) return;

    // Validation
    if (!editing.buttonLabel.trim()) {
      this.showMessage('error', 'Button label is required');
      return;
    }

    if (!editing.jobName.trim()) {
      this.showMessage('error', 'Job name is required');
      return;
    }

    try {
      if (editing.isNew) {
        // Add new action
        this.actionsConfigService.addConfig({
          buttonLabel: editing.buttonLabel.trim(),
          productionLine: editing.productionLine?.trim() || undefined,
          jobName: editing.jobName.trim()
        });
        this.showMessage('success', 'Action button added successfully');
      } else {
        // Update existing action
        this.actionsConfigService.updateConfig(editing.id, {
          buttonLabel: editing.buttonLabel.trim(),
          productionLine: editing.productionLine?.trim() || undefined,
          jobName: editing.jobName.trim()
        });
        this.showMessage('success', 'Action button updated successfully');
      }

      this.cancelEditAction();
    } catch (e) {
      this.showMessage('error', 'Failed to save action button');
    }
  }

  /**
   * Cancel editing action
   */
  cancelEditAction() {
    this.editingAction.set(null);
    this.isAddingAction.set(false);
  }

  /**
   * Delete an action button
   */
  deleteAction(id: string) {
    if (!this.canEdit()) {
      this.showMessage('error', 'You do not have permission to delete configurations');
      return;
    }

    if (confirm('Are you sure you want to delete this action button?')) {
      try {
        this.actionsConfigService.deleteConfig(id);
        this.showMessage('success', 'Action button deleted successfully');
      } catch (e) {
        this.showMessage('error', 'Failed to delete action button');
      }
    }
  }

  /**
   * Move action up in order
   */
  moveActionUp(index: number) {
    if (index === 0) return;

    const configs = [...this.actionConfigs()];
    const temp = configs[index];
    configs[index] = configs[index - 1];
    configs[index - 1] = temp;

    this.actionsConfigService.reorderConfigs(configs);
    this.showMessage('success', 'Action order updated');
  }

  /**
   * Move action down in order
   */
  moveActionDown(index: number) {
    const configs = [...this.actionConfigs()];
    if (index === configs.length - 1) return;

    const temp = configs[index];
    configs[index] = configs[index + 1];
    configs[index + 1] = temp;

    this.actionsConfigService.reorderConfigs(configs);
    this.showMessage('success', 'Action order updated');
  }

  /**
   * Load production lines from Brain2 API
   */
  async loadProductionLines() {
    try {
      this.isLoadingLines.set(true);
      const baseUrl = this.apiConfig.getBaseUrl();
      const token = this.auth.getToken();

      if (!token) {
        console.error('❌ No authentication token available for loading production lines');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await firstValueFrom(
        this.http.get<ProductionLine[]>(
          `${baseUrl}/api/v1/production-lines`,
          { headers }
        )
      );

      this.productionLines.set(response);
      console.log(`✅ Loaded ${response.length} production lines`);
    } catch (e) {
      console.error('❌ Failed to load production lines:', e);
      this.productionLines.set([]);
    } finally {
      this.isLoadingLines.set(false);
    }
  }

  /**
   * Show message to user
   */
  private showMessage(type: 'success' | 'error', text: string) {
    this.message.set({ type, text });
    setTimeout(() => this.message.set(null), 5000);
  }
}

