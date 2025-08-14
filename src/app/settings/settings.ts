import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export enum AuthenticationType {
  SQL = 'sql',
  Windows = 'windows'
}

export interface DatabaseConnection {
  serverName: string;
  instanceName: string;
  databaseName: string;
  authenticationType: AuthenticationType;
  username: string;
  password: string;
}

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  // Expose enum to template
  AuthenticationType = AuthenticationType;
  
  connectionSettings: DatabaseConnection = {
    serverName: 'localhost',
    instanceName: 'SQLEXPRESS',
    databaseName: 'BIZERBA_BRAIN2_Process',
    authenticationType: AuthenticationType.Windows,
    username: '',
    password: ''
  };
  
  isTestingConnection = false;
  testResult: { success: boolean; message: string } | null = null;
  isSaving = false;
  saveMessage = '';
  showTroubleshooting = false;
  
  testConnection(): void {
    this.isTestingConnection = true;
    this.testResult = null;
    
    // Validate connection parameters first
    const validationResult = this.validateConnectionSettings();
    if (!validationResult.isValid) {
      this.isTestingConnection = false;
      this.testResult = {
        success: false,
        message: validationResult.message
      };
      return;
    }
    
    // Simulate connection test with validation
    setTimeout(() => {
      this.isTestingConnection = false;
      
      // Check if this looks like a valid SQL Server configuration
      const { serverName, instanceName, databaseName } = this.connectionSettings;
      
      // Basic validation for SQL Server naming conventions
      if (this.isValidSqlServerConfig()) {
        this.testResult = {
          success: true,
          message: `Connection string validated successfully! Format: ${this.connectionStringPreview}`
        };
      } else {
        this.testResult = {
          success: false,
          message: this.getConnectionTroubleshootingMessage()
        };
      }
    }, 1500); // Simulate network delay
  }
  
  private validateConnectionSettings(): { isValid: boolean; message: string } {
    const { serverName, instanceName, databaseName, authenticationType, username, password } = this.connectionSettings;
    
    if (!serverName.trim()) {
      return { isValid: false, message: 'Server name is required' };
    }
    
    if (!databaseName.trim()) {
      return { isValid: false, message: 'Database name is required' };
    }
    
    if (authenticationType === AuthenticationType.SQL) {
      if (!username.trim()) {
        return { isValid: false, message: 'Username is required for SQL Authentication' };
      }
      if (!password.trim()) {
        return { isValid: false, message: 'Password is required for SQL Authentication' };
      }
    }
    
    return { isValid: true, message: '' };
  }
  
  private isValidSqlServerConfig(): boolean {
    const { serverName, instanceName } = this.connectionSettings;
    
    // Check for common SQL Server patterns
    const validServerPatterns = [
      /^localhost$/i,
      /^\./,
      /^\(local\)$/i,
      /^[\w\-\.]+$/,
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
    ];
    
    const isValidServer = validServerPatterns.some(pattern => pattern.test(serverName));
    
    if (instanceName) {
      const validInstancePatterns = [
        /^SQLEXPRESS$/i,
        /^MSSQLSERVER$/i,
        /^[\w\-]+$/
      ];
      const isValidInstance = validInstancePatterns.some(pattern => pattern.test(instanceName));
      return isValidServer && isValidInstance;
    }
    
    return isValidServer;
  }
  
  private getConnectionTroubleshootingMessage(): string {
    const { serverName, instanceName } = this.connectionSettings;
    
    let message = 'Connection validation failed. ';
    
    if (serverName.toLowerCase() === 'localhost' || serverName === '.') {
      message += 'For localhost connections, ensure SQL Server is running and accepting connections. ';
    }
    
    if (instanceName && instanceName.toUpperCase() === 'SQLEXPRESS') {
      message += 'For SQLEXPRESS: Check if SQL Server Express is installed and the SQL Server Browser service is running. ';
    }
    
    message += 'Common troubleshooting steps: ';
    message += '1. Verify SQL Server is running ';
    message += '2. Check Windows Firewall settings ';
    message += '3. Ensure TCP/IP is enabled in SQL Server Configuration Manager ';
    message += '4. Verify the instance name is correct';
    
    return message;
  }
  
  saveSettings(): void {
    this.isSaving = true;
    this.saveMessage = '';
    
    // Save to localStorage (or send to your API)
    try {
      localStorage.setItem('databaseConnection', JSON.stringify(this.connectionSettings));
      this.isSaving = false;
      this.saveMessage = 'Settings saved successfully!';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.saveMessage = '';
      }, 3000);
    } catch (error) {
      this.isSaving = false;
      this.saveMessage = 'Failed to save settings';
      console.error('Failed to save settings:', error);
    }
  }
  
  loadSettings(): void {
    try {
      const saved = localStorage.getItem('databaseConnection');
      if (saved) {
        this.connectionSettings = { ...this.connectionSettings, ...JSON.parse(saved) };
        console.log('Settings loaded:', this.connectionSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  ngOnInit(): void {
    this.loadSettings();
  }
  
  goBack(): void {
    this.router.navigate(['/orders']);
  }
  
  showTroubleshootingSteps(): void {
    this.showTroubleshooting = !this.showTroubleshooting;
  }
  
  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Unable to connect to server - check network connection';
    } else if (error.status === 401) {
      return 'Authentication failed - check username and password';
    } else if (error.status === 404) {
      return 'Server not found - check server name and instance';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'Connection failed - please check your settings';
    }
  }
  
  // Helper method to check if SQL auth is selected
  get isSqlAuthentication(): boolean {
    return this.connectionSettings.authenticationType === AuthenticationType.SQL;
  }
  
  // Generate connection string preview
  get connectionStringPreview(): string {
    const { serverName, instanceName, databaseName, authenticationType } = this.connectionSettings;
    
    let dataSource = serverName;
    if (instanceName) {
      dataSource += `\\${instanceName}`;
    }
    
    let connectionString = `Data Source=${dataSource};Initial Catalog=${databaseName};`;
    
    if (authenticationType === AuthenticationType.Windows) {
      connectionString += 'Integrated Security=True;TrustServerCertificate=True;';
    } else {
      connectionString += `User Id=${this.connectionSettings.username};Password=${this.connectionSettings.password};TrustServerCertificate=True;`;
    }
    
    return connectionString;
  }
}
