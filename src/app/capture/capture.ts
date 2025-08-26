import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiConfig } from '../api-config';

@Component({
  selector: 'app-capture',
  imports: [CommonModule, FormsModule, JsonPipe],
  templateUrl: './capture.html',
  styleUrl: './capture.scss'
})
export class Capture implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  
  // Form properties for filtering package records
  articleNumber = '';
  articleName = '';
  batchNumber = '';
  orderNumber = '';
  deviceName = '';
  startDate = '';
  endDate = '';
  take = 100; // Default limit
  
  // Response handling
  cumulatedRecords: any[] = [];
  oeeRecords: any[] = [];
  packageRecords: any[] = [];
  responseData: any = null;
  lastEndpoint = '';
  lastMethod = '';
  lastKind: '' | 'package' | 'cumulated' | 'oee' = '';
  responseStatus = '';
  isSuccess = false;
  isLoading = false;
  errorMessage = '';
  
  // Devices data
  devices: any[] = [];
  isLoadingDevices = false;
  
  // Sorting functionality
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // JSON display functionality
  isJsonExpanded = false;
  
  ngOnInit() {
    // Component initialization - ensure clean state
    this.errorMessage = '';
    this.isLoading = false;
    this.clearError();
    this.clearResponse();
    
    // Set default end date to current date and time
    this.setDefaultEndDate();
    
    // Load available devices for dropdown
    this.loadDevices();
  }
  
  private setDefaultEndDate(): void {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.endDate = `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  private loadDevices(): void {
    this.isLoadingDevices = true;
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No auth token found, cannot load devices');
      this.isLoadingDevices = false;
      return;
    }
    
  const url = `${this.apiConfig.getBaseUrl()}/api/v1/devices`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.isLoadingDevices = false;
        if (Array.isArray(response)) {
          this.devices = response;
        } else if (response && Array.isArray(response.data)) {
          this.devices = response.data;
        } else {
          this.devices = [];
          console.warn('Unexpected devices response format:', response);
        }
        console.log('Devices loaded:', this.devices);
      },
      error: (error) => {
        this.isLoadingDevices = false;
        console.error('Failed to load devices:', error);
        // Don't show error message to user as this is a background operation
        this.devices = [];
      }
    });
  }
  
  private checkAuthenticationStatus(): boolean {
    const token = localStorage.getItem('auth_token');
    console.log('Capture component - Auth status:', {
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    
    return !!token;
  }
  
  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Package Records API Method
  getPackageRecords(): void {
    let endpoint = '/api/v1/package-records';
    
    // Build query parameters
    const queryParams: string[] = [];
    
    // Add Take parameter (required)
    if (this.take > 0) {
      queryParams.push(`take=${this.take}`);
    } else {
      queryParams.push('take=100'); // Default value
    }
    
    // Add optional filters
    if (this.articleNumber.trim()) {
      queryParams.push(`articleNumber=${encodeURIComponent(this.articleNumber.trim())}`);
    }
    if (this.articleName.trim()) {
      queryParams.push(`articleName=${encodeURIComponent(this.articleName.trim())}`);
    }
    if (this.batchNumber.trim()) {
      queryParams.push(`batchNumber=${encodeURIComponent(this.batchNumber.trim())}`);
    }
    if (this.orderNumber.trim()) {
      queryParams.push(`orderNumber=${encodeURIComponent(this.orderNumber.trim())}`);
    }
    if (this.deviceName.trim()) {
      queryParams.push(`deviceName=${encodeURIComponent(this.deviceName.trim())}`);
    }
    if (this.startDate.trim()) {
      queryParams.push(`startDate=${encodeURIComponent(this.startDate.trim())}`);
    }
    if (this.endDate.trim()) {
      queryParams.push(`endDate=${encodeURIComponent(this.endDate.trim())}`);
    }
    
    // Append query parameters to endpoint
    if (queryParams.length > 0) {
      endpoint += '?' + queryParams.join('&');
    }
    
    console.log('Making API call to:', endpoint);
    this.makeApiCall('GET', endpoint, undefined, 'package');
  }

  // Cumulated Package Records API Method
  getCumulatedPackageRecords(): void {
    let endpoint = '/api/v1/cumulated-package-records';
    const queryParams: string[] = [];
    // Required take
    queryParams.push(`take=${this.take > 0 ? this.take : 100}`);
    // Optional filters (same as page filters where applicable)
    if (this.articleNumber.trim()) queryParams.push(`articleNumber=${encodeURIComponent(this.articleNumber.trim())}`);
    if (this.deviceName.trim()) queryParams.push(`deviceName=${encodeURIComponent(this.deviceName.trim())}`);
    if (this.startDate.trim()) queryParams.push(`startTimestamp=${encodeURIComponent(this.normalizeDateTimeParam(this.startDate))}`);
    if (this.endDate.trim()) queryParams.push(`endTimestamp=${encodeURIComponent(this.normalizeDateTimeParam(this.endDate))}`);
    // Default sort from example
    queryParams.push(`sort=${encodeURIComponent('StartTimestamp-,ArticleNumber+')}`);
    endpoint += `?${queryParams.join('&')}`;
    console.log('Making API call to:', endpoint);
    this.makeApiCall('GET', endpoint, undefined, 'cumulated');
  }

  // OEE Records API Method
  getOeeRecords(): void {
    let endpoint = '/api/v1/oee-records';
    const queryParams: string[] = [];
    // Required take
    queryParams.push(`take=${this.take > 0 ? this.take : 10}`);
    // Optional filters mapped to API param names
    if (this.articleNumber.trim()) queryParams.push(`articleNumber=${encodeURIComponent(this.articleNumber.trim())}`);
    if (this.articleName.trim()) queryParams.push(`articleName=${encodeURIComponent(this.articleName.trim())}`);
    if (this.deviceName.trim()) queryParams.push(`masterDeviceName=${encodeURIComponent(this.deviceName.trim())}`);
    if (this.startDate.trim()) queryParams.push(`startDate=${encodeURIComponent(this.normalizeDateTimeParam(this.startDate))}`);
    if (this.endDate.trim()) queryParams.push(`endDate=${encodeURIComponent(this.normalizeDateTimeParam(this.endDate))}`);
    // Default sort from example
    queryParams.push(`sort=${encodeURIComponent('Start-,ArticleNumber+')}`);
    endpoint += `?${queryParams.join('&')}`;
    console.log('Making API call to:', endpoint);
    this.makeApiCall('GET', endpoint, undefined, 'oee');
  }

  // Utility Methods
  private makeApiCall(method: string, endpoint: string, body?: any, kind?: 'package'|'cumulated'|'oee'): void {
    this.isLoading = true;
    this.clearError();
    this.clearResponse();
    
    this.lastMethod = method;
    this.lastEndpoint = endpoint;
  this.lastKind = kind || '';
    
  const url = `${this.apiConfig.getBaseUrl()}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      this.showError('No authentication token found. Please login first.');
      this.isLoading = false;
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    let request;
    
    switch (method) {
      case 'GET':
        request = this.http.get(url, { headers });
        break;
      case 'POST':
        request = this.http.post(url, body || {}, { headers });
        break;
      default:
        this.showError(`Unsupported HTTP method: ${method}`);
        this.isLoading = false;
        return;
    }
    
    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.responseStatus = 'Success';
        this.responseData = response;
  this.lastKind = kind || this.lastKind;
        
        // Route known response types
        if (kind === 'package') {
          this.packageRecords = Array.isArray(response) ? response : [];
        } else if (kind === 'cumulated') {
          this.cumulatedRecords = Array.isArray(response) ? response : (response ? [response] : []);
        } else if (kind === 'oee') {
          this.oeeRecords = Array.isArray(response) ? response : (response ? [response] : []);
        } else if (endpoint.includes('/package-records')) {
          this.packageRecords = Array.isArray(response) ? response : [];
        }
        
        console.log(`${method} ${endpoint} - Success:`, response);
      },
      error: (error) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.responseStatus = `Error ${error.status || 'Unknown'}`;
        this.responseData = error.error || error.message || error;
  // Keep lastKind set so UI knows which action was attempted
        this.showError(`Failed to ${method} ${endpoint}: ${this.getErrorMessage(error)}`);
        console.error(`${method} ${endpoint} - Error:`, error);
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    if (error.status) {
      return `HTTP ${error.status} - ${error.statusText || 'Unknown Error'}`;
    }
    return 'An unexpected error occurred';
  }

  private showError(message: string): void {
    this.errorMessage = message;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  clearResponse(): void {
    this.responseData = null;
  this.cumulatedRecords = [];
  this.oeeRecords = [];
    this.packageRecords = [];
    this.lastEndpoint = '';
    this.lastMethod = '';
  this.lastKind = '';
    this.responseStatus = '';
    this.isSuccess = false;
    // Reset sorting
    this.sortColumn = '';
    this.sortDirection = 'asc';
  }

  // Helper method to format dates for display
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  // Helper method to format weight values
  formatWeight(weight: any): string {
    if (!weight || !weight.value) return '';
    return `${weight.value} ${weight.unit || ''}`;
  }

  // Format weight using its decimalPlaces if provided
  formatWeightDp(weight: any): string {
    if (!weight || weight.value === undefined || weight.value === null) return '';
    const dp = Math.max(0, Number(weight.decimalPlaces || 0));
    const val = Number(weight.value);
    if (!isFinite(val)) return '';
    return `${val.toFixed(dp)} ${weight.unit || ''}`;
  }

  // Format percentage with optional decimals
  formatPercent(value: any, dp: number = 2): string {
    const n = Number(value);
    if (!isFinite(n)) return '';
    return `${n.toFixed(dp)} %`;
  }

  // Helpers for cumulated records
  private roundToDp(value: any, dp: number): string {
    const num = Number(value);
    if (!isFinite(num)) return '';
    return num.toFixed(Math.max(0, dp || 0));
  }
  formatCumulatedWeight(value: any, dp: number, unit?: string): string {
    if (value === null || value === undefined) return '';
    const rounded = this.roundToDp(value, dp);
    return unit ? `${rounded} (${unit})` : rounded;
  }

  // Normalize date-time local (yyyy-MM-ddTHH:mm) to yyyy-MM-ddTHH:mm:ss for API
  private normalizeDateTimeParam(input: string): string {
    const t = (input || '').trim();
    if (!t) return '';
    if (/T\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    if (/T\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    return t;
  }

  // Sorting functionality
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Sort package records if they exist
    if (this.packageRecords.length > 0) {
      this.packageRecords.sort((a, b) => {
        let aVal = this.getColumnValue(a, column);
        let bVal = this.getColumnValue(b, column);

        // Handle null/undefined values
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Convert to strings for comparison
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();

        let comparison = 0;
        if (aVal < bVal) {
          comparison = -1;
        } else if (aVal > bVal) {
          comparison = 1;
        }

        return this.sortDirection === 'desc' ? comparison * -1 : comparison;
      });
    }
  }

  private getColumnValue(record: any, column: string): any {
    switch (column) {
      case 'timestamp':
        return record.timestamp;
      case 'article':
        return record.articleNumber || record.articleName;
      case 'batch':
        return record.batchNumber;
      case 'order':
        return record.orderNumber;
      case 'device':
        return record.device?.name || record.device?.id;
      case 'grossWeight':
        return record.grossWeight?.value || 0;
      case 'netWeight':
        return record.actualNetWeight?.value || 0;
      case 'packageType':
        return record.packageType;
      default:
        return '';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '⬆️' : '⬇️';
  }

  // JSON display functionality
  toggleJsonExpanded(): void {
    this.isJsonExpanded = !this.isJsonExpanded;
  }

  refreshDevices(): void {
    this.loadDevices();
  }

  shouldShowEmptyState(): boolean {
    return this.responseData !== null && 
           Array.isArray(this.packageRecords) && 
           this.packageRecords.length === 0 && 
           !this.isLoading &&
           this.isSuccess;
  }

  copyJsonToClipboard(): void {
    if (this.responseData) {
      const jsonString = JSON.stringify(this.responseData, null, 2);
      navigator.clipboard.writeText(jsonString).then(() => {
        // You could add a toast notification here
        console.log('JSON copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy JSON to clipboard:', err);
        // Fallback for older browsers
        this.fallbackCopyToClipboard(jsonString);
      });
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('JSON copied to clipboard (fallback)');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  }
}
