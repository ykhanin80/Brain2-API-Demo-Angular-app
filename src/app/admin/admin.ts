import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService, UserRole, PagePermission } from '../user.service';
import { ActionsConfigService, ActionButtonConfig } from '../actions-config.service';
import { ApiConfig } from '../api-config';

interface UserEdit {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  permissions?: PagePermission[];
  isNew?: boolean;
}

interface ProductionLine {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  activeTab = signal<'users' | 'actions'>('users');
  
  // Available pages for permission checkboxes
  readonly availablePages: { key: PagePermission; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { key: 'data-maintenance', label: 'Data Maintenance', icon: '🗄️' },
    { key: 'all-orders', label: 'Order Management', icon: '📋' },
    { key: 'capture', label: 'Capture', icon: '📸' },
    { key: 'actions', label: 'Actions', icon: '⚡' },
    { key: 'package-record', label: 'Package Records', icon: '📦' },
    { key: 'label-preview', label: 'Label Preview', icon: '🏷️' }
  ];
  
  // User Management
  users = signal<UserEdit[]>([]);
  editingUser = signal<UserEdit | null>(null);
  isAddingUser = signal(false);
  
  // Actions Configuration
  actionConfigs = signal<ActionButtonConfig[]>([]);
  editingAction = signal<ActionButtonConfig | null>(null);
  isAddingAction = signal(false);
  productionLines = signal<ProductionLine[]>([]);
  isLoadingLines = signal(false);
  
  // Success/Error messages
  message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private actionsConfigService: ActionsConfigService,
    private http: HttpClient,
    private apiConfig: ApiConfig
  ) {}

  ngOnInit(): void {
    // Check for tab query param
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'actions') {
        this.activeTab.set('actions');
      }
    });
    
    // Load users (in real app, this would come from backend)
    this.loadUsers();
    
    // Load action configurations
    this.loadActionConfigs();
    
    // Load production lines from API
    this.loadProductionLines();
  }

  // Tab Management
  switchTab(tab: 'users' | 'actions'): void {
    this.activeTab.set(tab);
  }

  // User Management Methods
  async loadUsers(): Promise<void> {
    // Load actual users from UserService
    const allUsers = await this.userService.getAllUsers();
    this.users.set(allUsers.map(u => ({
      username: u.username,
      password: '••••••••', // Mask password in UI
      role: u.role,
      displayName: u.displayName,
      permissions: u.permissions || this.userService.getDefaultPermissions(u.role)
    })));
  }

  startAddUser(): void {
    this.isAddingUser.set(true);
    this.editingUser.set({
      username: '',
      password: '',
      role: 'viewer',
      displayName: '',
      permissions: [],
      isNew: true
    });
  }

  startEditUser(user: UserEdit): void {
    console.log('🔧 startEditUser - Original user:', JSON.stringify(user, null, 2));
    const editUser = { 
      ...user,
      permissions: user.permissions ? [...user.permissions] : []
    };
    console.log('🔧 startEditUser - Edit user:', JSON.stringify(editUser, null, 2));
    this.editingUser.set(editUser);
  }

  togglePermission(permission: PagePermission): void {
    const user = this.editingUser();
    if (!user) return;
    
    console.log('🔧 togglePermission - Current user:', JSON.stringify(user, null, 2));
    console.log('🔧 togglePermission - Toggling permission:', permission);
    
    const permissions = user.permissions || [];
    const index = permissions.indexOf(permission);
    
    let newPermissions: PagePermission[];
    if (index > -1) {
      // Remove permission
      newPermissions = permissions.filter(p => p !== permission);
      console.log('🔧 togglePermission - REMOVING permission');
    } else {
      // Add permission
      newPermissions = [...permissions, permission];
      console.log('🔧 togglePermission - ADDING permission');
    }
    
    console.log('🔧 togglePermission - New permissions:', newPermissions);
    
    // Automatically set role to 'custom' when manually changing permissions
    // unless it's already admin and has all permissions
    const allPermissions = this.availablePages.map(p => p.key);
    const hasAllPermissions = allPermissions.every(p => newPermissions.includes(p));
    
    const newRole = !hasAllPermissions && user.role !== 'custom' ? 'custom' : user.role;
    
    console.log('🔧 togglePermission - New role:', newRole);
    
    this.editingUser.set({ 
      ...user, 
      permissions: newPermissions,
      role: newRole
    });
  }

  hasPermission(permission: PagePermission): boolean {
    const user = this.editingUser();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  getPermissionsText(permissions?: PagePermission[]): string {
    if (!permissions || permissions.length === 0) return 'None';
    return permissions.map(p => {
      const page = this.availablePages.find(ap => ap.key === p);
      return page ? page.icon : '';
    }).join(' ');
  }

  getPermissionsCount(permissions?: PagePermission[]): number {
    return permissions?.length || 0;
  }

  cancelEdit(): void {
    this.editingUser.set(null);
    this.isAddingUser.set(false);
  }

  async saveUser(): Promise<void> {
    const user = this.editingUser();
    if (!user) return;

    console.log('🔧 saveUser - Saving user:', JSON.stringify(user, null, 2));

    // Validation
    if (!user.username.trim()) {
      this.showMessage('error', 'Username is required');
      return;
    }
    if (!user.displayName.trim()) {
      this.showMessage('error', 'Display name is required');
      return;
    }
    if (user.isNew && !user.password.trim()) {
      this.showMessage('error', 'Password is required for new users');
      return;
    }

    // Save to UserService
    if (user.isNew) {
      // Add new user
      const result = await this.userService.addUser({
        username: user.username,
        password: user.password,
        role: user.role,
        displayName: user.displayName,
        permissions: user.permissions
      });
      
      if (result.success) {
        await this.loadUsers(); // Reload from service
        this.showMessage('success', `User "${user.username}" created successfully`);
        this.cancelEdit();
      } else {
        this.showMessage('error', result.message);
      }
    } else {
      // Update existing user
      const updates: any = {
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions
      };
      
      // Only update password if it was changed
      if (user.password && user.password !== '••••••••') {
        updates.password = user.password;
      }
      
      const result = await this.userService.updateUser(user.username, updates);
      
      if (result.success) {
        await this.loadUsers(); // Reload from service
        this.showMessage('success', `User "${user.username}" updated successfully`);
        this.cancelEdit();
      } else {
        this.showMessage('error', result.message);
      }
    }
  }

  async deleteUser(username: string): Promise<void> {
    if (username === 'admin') {
      this.showMessage('error', 'Cannot delete admin user');
      return;
    }

    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      const result = await this.userService.deleteUser(username);
      
      if (result.success) {
        await this.loadUsers(); // Reload from service
        this.showMessage('success', `User "${username}" deleted successfully`);
      } else {
        this.showMessage('error', result.message);
      }
    }
  }

  showMessage(type: 'success' | 'error', text: string): void {
    this.message.set({ type, text });
    setTimeout(() => this.message.set(null), 5000);
  }

  // Field update handlers
  updateField(field: keyof UserEdit, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const value = input.value;
    this.editingUser.update(user => {
      if (!user) return null;
      const updated = { ...user, [field]: value };
      
      // If role changed, update permissions to defaults for that role
      if (field === 'role' && value !== 'custom') {
        updated.permissions = this.userService.getDefaultPermissions(value as UserRole);
      }
      
      return updated;
    });
  }

  // ============================================
  // Actions Configuration Methods
  // ============================================

  async loadActionConfigs(): Promise<void> {
    await this.actionsConfigService.refreshConfigs();
    this.actionConfigs.set(this.actionsConfigService.getConfigs());
  }

  loadProductionLines(): void {
    this.isLoadingLines.set(true);
    const baseUrl = this.apiConfig.getBaseUrl();
    
    this.http.get<any>(`${baseUrl}/api/v1/production-lines`).subscribe({
      next: (response) => {
        this.isLoadingLines.set(false);
        // Handle response - adjust based on actual API response structure
        if (Array.isArray(response)) {
          this.productionLines.set(response.map((line: any) => ({
            id: line.id || line.name,
            name: line.name || line.id
          })));
        } else if (response.data && Array.isArray(response.data)) {
          this.productionLines.set(response.data.map((line: any) => ({
            id: line.id || line.name,
            name: line.name || line.id
          })));
        } else {
          // Fallback to example data if API structure is different
          this.showMessage('error', 'Unable to parse production lines from API');
          this.setExampleProductionLines();
        }
      },
      error: (error) => {
        this.isLoadingLines.set(false);
        console.error('Failed to load production lines:', error);
        this.showMessage('error', 'Failed to load production lines. Using example data.');
        this.setExampleProductionLines();
      }
    });
  }

  setExampleProductionLines(): void {
    this.productionLines.set([
      { id: 'line1', name: 'Line 1' },
      { id: 'line2', name: 'Line 2' },
      { id: 'whole-birds-1', name: 'Whole Birds Line1' },
      { id: 'line3', name: 'Line 3' },
      { id: 'line4', name: 'Line 4' }
    ]);
  }

  startAddAction(): void {
    this.isAddingAction.set(true);
    this.editingAction.set({
      id: '',
      buttonLabel: '',
      productionLine: '',
      jobName: '',
      order: this.actionConfigs().length
    });
  }

  startEditAction(action: ActionButtonConfig): void {
    this.editingAction.set({ ...action });
  }

  cancelEditAction(): void {
    this.editingAction.set(null);
    this.isAddingAction.set(false);
  }

  saveAction(): void {
    const action = this.editingAction();
    if (!action) return;

    // Validation
    if (!action.buttonLabel.trim()) {
      this.showMessage('error', 'Button label is required');
      return;
    }
    // Production line is now optional
    if (!action.jobName.trim()) {
      this.showMessage('error', 'Job name is required');
      return;
    }

    // Save logic
    if (!action.id || this.isAddingAction()) {
      // Add new
      this.actionsConfigService.addConfig({
        buttonLabel: action.buttonLabel,
        productionLine: action.productionLine || undefined,
        jobName: action.jobName
      });
      this.showMessage('success', `Action button "${action.buttonLabel}" created successfully`);
    } else {
      // Update existing
      this.actionsConfigService.updateConfig(action.id, action);
      this.showMessage('success', `Action button "${action.buttonLabel}" updated successfully`);
    }

    this.loadActionConfigs();
    this.cancelEditAction();
  }

  deleteAction(id: string): void {
    const action = this.actionConfigs().find(a => a.id === id);
    if (!action) return;

    if (confirm(`Are you sure you want to delete action button "${action.buttonLabel}"?`)) {
      this.actionsConfigService.deleteConfig(id);
      this.loadActionConfigs();
      this.showMessage('success', `Action button "${action.buttonLabel}" deleted successfully`);
    }
  }

  updateActionField(field: keyof ActionButtonConfig, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const value = input.value;
    this.editingAction.update(action => {
      if (!action) return null;
      return { ...action, [field]: value };
    });
  }

  moveActionUp(index: number): void {
    if (index === 0) return;
    const configs = [...this.actionConfigs()];
    [configs[index - 1], configs[index]] = [configs[index], configs[index - 1]];
    this.actionsConfigService.reorderConfigs(configs);
    this.loadActionConfigs();
  }

  moveActionDown(index: number): void {
    const configs = [...this.actionConfigs()];
    if (index === configs.length - 1) return;
    [configs[index], configs[index + 1]] = [configs[index + 1], configs[index]];
    this.actionsConfigService.reorderConfigs(configs);
    this.loadActionConfigs();
  }
}
