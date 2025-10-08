import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiConfig } from '../api-config';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-capture',
  imports: [CommonModule, FormsModule, JsonPipe],
  templateUrl: './capture.html',
  styleUrl: './capture.scss'
})
export class Capture implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  
  // Chart instance
  private chart: Chart | null = null;
  
  // Form properties for filtering package records
  articleNumber = '';
  articleName = '';
  batchNumber = '';
  orderNumber = '';
  deviceName = ''; // Keep for backward compatibility
  selectedDeviceNames: string[] = [];
  startDate = '';
  endDate = '';
  take = 10; // Default page size
  skip = 0;   // Pagination offset for package records
  hasNext = false; // Whether there might be a next page for package records
  
  // Response handling
  cumulatedRecords: any[] = [];
  oeeRecords: any[] = [];
  packageRecords: any[] = [];
  packageRecordsByDevice: Map<string, any[]> = new Map();
  responseData: any = null;
  lastEndpoint = '';
  lastMethod = '';
  lastKind: '' | 'package' | 'cumulated' | 'oee' | 'errorRate' = '';
  responseStatus = '';
  isSuccess = false;
  isLoading = false;
  errorMessage = '';
  
  // Devices data
  devices: any[] = [];
  isLoadingDevices = false;
  
  // Package Types data
  packageTypes: string[] = [];
  selectedPackageType = 'All';
  
  // Weight display preferences
  showActualWeight = true;
  showPrintedWeight = false;
  
  // Sorting functionality
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // JSON display functionality
  isJsonExpanded = false;
  
  // UI state for collapsible sections
  isDeviceListCollapsed = false;
  
  // Single Packages Error Rate view
  errorRateRows: Array<{
    start: string;
    finish: string;
    articleNumber: string;
    articleName: string;
    count: number;
    errorFlag: number;
    errorText: string;
    percent: number;
  }> = [];
  errorRateGroups: Array<{
    start: string;
    finish: string;
    articleNumber: string;
    articleName: string;
    total: number;
    rows: Array<{ errorFlag: number; errorText: string; count: number; percent: number }>
  }> = [];
  
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
    
    // Load package types
    this.loadPackageTypes();
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

  private loadPackageTypes(): void {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No auth token found, using fallback package types');
      this.packageTypes = ['singlePackage', 'total1', 'total2', 'total3', 'total', 'partialBatchTotal', 'undefined'];
      return;
    }
    
    const url = `${this.apiConfig.getBaseUrl()}/api/v1/package-types`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    this.http.get<string[]>(url, { headers }).subscribe({
      next: (response: any) => {
        this.packageTypes = response || [];
        console.log('Package types loaded:', this.packageTypes);
      },
      error: (error) => {
        console.warn('Failed to load package types, using fallback:', error);
        this.packageTypes = ['singlePackage', 'total1', 'total2', 'total3', 'total', 'partialBatchTotal', 'undefined'];
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

  // Package Records API Method with multi-device support
  async getPackageRecords(preserveSkip: boolean = false): Promise<void> {
    // On a fresh request from the button, start from the first page
    if (!preserveSkip) {
      this.skip = 0;
    }

    // If multi-device selection is used
    if (this.selectedDeviceNames.length > 0) {
      await this.getPackageRecordsMultiDevice();
      return;
    }

    // Fall back to single device (backward compatibility)
    let endpoint = '/api/v1/package-records';
    
    // Build query parameters
    const queryParams: string[] = [];
    
    // Add Take parameter (required)
    if (this.take > 0) {
      queryParams.push(`take=${this.take}`);
    } else {
      queryParams.push('take=100'); // Default value
    }
    // Add Skip parameter (pagination)
    if (this.skip > 0) {
      queryParams.push(`skip=${this.skip}`);
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
    if (this.selectedPackageType && this.selectedPackageType !== 'All') {
      queryParams.push(`packageType=${encodeURIComponent(this.selectedPackageType)}`);
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

  private async getPackageRecordsMultiDevice(): Promise<void> {
    this.isLoading = true;
    this.clearError();
    this.packageRecordsByDevice.clear();
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.errorMessage = 'Authentication required';
      this.isLoading = false;
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Build common query parameters
    const buildParams = (deviceName: string): string => {
      const queryParams: string[] = [];
      queryParams.push(`take=${this.take > 0 ? this.take : 100}`);
      if (this.skip > 0) queryParams.push(`skip=${this.skip}`);
      if (this.articleNumber.trim()) queryParams.push(`articleNumber=${encodeURIComponent(this.articleNumber.trim())}`);
      if (this.articleName.trim()) queryParams.push(`articleName=${encodeURIComponent(this.articleName.trim())}`);
      if (this.batchNumber.trim()) queryParams.push(`batchNumber=${encodeURIComponent(this.batchNumber.trim())}`);
      if (this.orderNumber.trim()) queryParams.push(`orderNumber=${encodeURIComponent(this.orderNumber.trim())}`);
      queryParams.push(`deviceName=${encodeURIComponent(deviceName)}`);
      if (this.selectedPackageType && this.selectedPackageType !== 'All') {
        queryParams.push(`packageType=${encodeURIComponent(this.selectedPackageType)}`);
      }
      if (this.startDate.trim()) queryParams.push(`startDate=${encodeURIComponent(this.startDate.trim())}`);
      if (this.endDate.trim()) queryParams.push(`endDate=${encodeURIComponent(this.endDate.trim())}`);
      return queryParams.join('&');
    };

    // Make parallel API calls
    const apiCalls = this.selectedDeviceNames.map(async (deviceName) => {
      const params = buildParams(deviceName);
      const url = `${this.apiConfig.getBaseUrl()}/api/v1/package-records?${params}`;
      
      try {
        const response = await this.http.get<any[]>(url, { headers }).toPromise();
        return { deviceName, records: response || [] };
      } catch (error) {
        console.error('Error loading records for device:', deviceName, error);
        return { deviceName, records: [], error };
      }
    });

    try {
      const results = await Promise.all(apiCalls);
      
      // Store records per device and combine all
      const allRecords: any[] = [];
      results.forEach(result => {
        this.packageRecordsByDevice.set(result.deviceName, result.records);
        allRecords.push(...result.records);
      });

      this.packageRecords = allRecords;
      this.lastKind = 'package';
      this.isSuccess = true;
      this.responseStatus = `${allRecords.length} records from ${results.length} device(s)`;

      // Initialize and update chart
      setTimeout(() => {
        if (!this.chart) {
          this.initializeChart();
        }
        this.updateChart();
      }, 100);

    } catch (error) {
      this.errorMessage = 'Failed to load package records';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
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
  
  // Single Packages Error Rate - fetch package records and compute aggregation
  getSinglePackagesErrorRate(): void {
    // Build same endpoint as getPackageRecords, but mark kind as 'errorRate'
    this.skip = 0; // analysis from first page by default
    let endpoint = '/api/v1/package-records';
    const queryParams: string[] = [];
  // For error rate analysis we want as many records as possible
  queryParams.push('take=100000');
    if (this.articleNumber.trim()) queryParams.push(`articleNumber=${encodeURIComponent(this.articleNumber.trim())}`);
    if (this.articleName.trim()) queryParams.push(`articleName=${encodeURIComponent(this.articleName.trim())}`);
    if (this.batchNumber.trim()) queryParams.push(`batchNumber=${encodeURIComponent(this.batchNumber.trim())}`);
    if (this.orderNumber.trim()) queryParams.push(`orderNumber=${encodeURIComponent(this.orderNumber.trim())}`);
    if (this.deviceName.trim()) queryParams.push(`deviceName=${encodeURIComponent(this.deviceName.trim())}`);
    if (this.startDate.trim()) queryParams.push(`startDate=${encodeURIComponent(this.startDate.trim())}`);
    if (this.endDate.trim()) queryParams.push(`endDate=${encodeURIComponent(this.endDate.trim())}`);
    endpoint += `?${queryParams.join('&')}`;
    this.makeApiCall('GET', endpoint, undefined, 'errorRate');
  }

  // Utility Methods
  private makeApiCall(method: string, endpoint: string, body?: any, kind?: 'package'|'cumulated'|'oee'|'errorRate'): void {
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
          // If we got a full page, assume there may be a next page
          this.hasNext = this.packageRecords.length === (this.take > 0 ? this.take : 100);
        } else if (kind === 'cumulated') {
          this.cumulatedRecords = Array.isArray(response) ? response : (response ? [response] : []);
        } else if (kind === 'oee') {
          this.oeeRecords = Array.isArray(response) ? response : (response ? [response] : []);
        } else if (kind === 'errorRate') {
          const records = Array.isArray(response) ? response : [];
          this.errorRateRows = this.computeErrorRateRows(records);
          this.errorRateGroups = this.computeErrorRateGroups(records);
          // Do not alter hasNext; analytics view is per current fetch
        } else if (endpoint.includes('/package-records')) {
          this.packageRecords = Array.isArray(response) ? response : [];
          this.hasNext = this.packageRecords.length === (this.take > 0 ? this.take : 100);
        }
        
        console.log(`${method} ${endpoint} - Success:`, response);
      },
      error: (error) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.responseStatus = `Error ${error.status || 'Unknown'}`;
        this.responseData = error.error || error.message || error;
  // Keep lastKind set so UI knows which action was attempted
  this.hasNext = false;
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
  this.errorRateRows = [];
  this.errorRateGroups = [];
    this.lastEndpoint = '';
    this.lastMethod = '';
  this.lastKind = '';
    this.responseStatus = '';
    this.isSuccess = false;
    // Reset sorting
    this.sortColumn = '';
    this.sortDirection = 'asc';
    // Pagination reset
    this.hasNext = false;
  }

  // Pagination controls for Package Records
  nextPackagePage(): void {
    if (!this.hasNext) return;
    const step = this.take > 0 ? this.take : 100;
    this.skip += step;
    this.getPackageRecords(true);
  }

  prevPackagePage(): void {
    if (this.skip <= 0) return;
    const step = this.take > 0 ? this.take : 100;
    this.skip = Math.max(0, this.skip - step);
    this.getPackageRecords(true);
  }

  onPageSizeChange(value: any): void {
    const size = Number(value);
    if (!isFinite(size) || size <= 0) return;
    this.take = size;
    this.skip = 0;
    this.getPackageRecords();
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
      case 'errorFlag':
        return this.getErrorSortValue(record);
      default:
        return '';
    }
  }

  private getErrorSortValue(record: any): number {
    const flag = this.extractErrorFlag(record);
    if (flag === null) return -1; // Records without flag come first
    return Number(flag);
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

  // Package record error helpers
  getPackageErrorFlag(record: any): string {
    if (!record) return '';
    const has = (record.errorFlag !== undefined && record.errorFlag !== null)
      ? !!record.errorFlag
      : (record.hasError !== undefined && record.hasError !== null)
        ? !!record.hasError
        : !!(record.error || record.errorInfo || record.validationError);
    return has ? 'Yes' : 'No';
  }

  getPackageErrorType(record: any): string {
    if (!record) return '';
    const type = record.errorType
      ?? record.error?.type
      ?? record.error?.code
      ?? record.errorInfo?.type
      ?? record.validationError?.type
      ?? '';
    return typeof type === 'string' ? type : String(type ?? '');
  }

  private extractErrorFlag(record: any): number | null {
    if (!record) return null;
    const val = record.error?.flag ?? record.errorFlag ?? record.error_code;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  private mapErrorFlagToTexts(flag: number): string[] {
    // Mapping for individual bit flags
    const map: Record<number, string> = {
      0: 'Good Package',
      1: 'Internal Error',
      2: 'No label / label error (printer or labeler)',
      4: 'Package could not be weighed',
      8: 'Package overload or underload',
      16: 'Package contains metal',
      32: 'Negative acknowledgement from secondary labeler',
      64: 'Package data could not be sent',
      128: 'Customer-specific formula error',
      256: 'Data edited at invalid time',
      512: 'Switched to transport',
      1024: 'User activated ejection',
      2048: 'Package too long/short',
      4096: 'Separation error',
      8192: 'Code readings returns error',
      16384: 'Statistics report in process',
      32768: 'Invalid package, but not cancelled as total already transmitted',
      65536: 'Package marked invalid through external signal to 1/O unit',
      131072: 'Data could not be activated fast enough using a scanner',
      262144: 'RFID write fault error',
      524288: 'TTI-error',
      1048576: 'Logo is not available or defective',
      2097152: 'Package could not be weighed during the teaching process'
    };

    if (flag === 0) return [map[0]];

    const texts: string[] = [];
    // Iterate known bits in ascending order
    const keys = Object.keys(map)
      .map(k => Number(k))
      .filter(k => k !== 0)
      .sort((a, b) => a - b);
    for (const k of keys) {
      if ((flag & k) === k) {
        texts.push(map[k]);
      }
    }
    if (texts.length === 0) {
      texts.push(`Unknown Error: ${flag}`);
    }
    return texts;
  }

  getPackageErrorFlagText(record: any): string {
    const flag = this.extractErrorFlag(record);
    if (flag === null) return '';
    return this.mapErrorFlagToTexts(flag).join(' + ');
  }

  private computeErrorRateRows(records: any[]): Array<{start:string;finish:string;articleNumber:string;articleName:string;count:number;errorFlag:number;errorText:string;percent:number;}> {
    type Group = {
      articleNumber: string;
      articleName: string;
      minTs: number;
      maxTs: number;
      total: number;
      byFlag: Map<number, number>;
    };
    const groups = new Map<string, Group>();
    for (const r of records || []) {
      const artNum: string = r.articleNumber ?? '';
      const artName: string = r.articleName ?? '';
      const tsStr: string = r.timestamp ?? '';
      const ts = tsStr ? new Date(tsStr).getTime() : NaN;
      let flag = this.extractErrorFlag(r);
      if (flag === null) flag = 0; // treat missing as Good Package
      const key = artNum;
      if (!groups.has(key)) {
        groups.set(key, {
          articleNumber: artNum,
          articleName: artName,
          minTs: isFinite(ts) ? ts : Number.POSITIVE_INFINITY,
          maxTs: isFinite(ts) ? ts : Number.NEGATIVE_INFINITY,
          total: 0,
          byFlag: new Map<number, number>()
        });
      }
      const g = groups.get(key)!;
      g.total += 1;
      if (isFinite(ts)) {
        if (ts < g.minTs) g.minTs = ts;
        if (ts > g.maxTs) g.maxTs = ts;
      }
      g.byFlag.set(flag, (g.byFlag.get(flag) || 0) + 1);
    }

    const rows: Array<{start:string;finish:string;articleNumber:string;articleName:string;count:number;errorFlag:number;errorText:string;percent:number;}> = [];
    for (const g of groups.values()) {
      const start = isFinite(g.minTs) ? new Date(g.minTs).toISOString() : '';
      const finish = isFinite(g.maxTs) ? new Date(g.maxTs).toISOString() : '';
      // Ensure a good package row exists even if upstream omitted explicit 0 flags
      const nonZeroSum = Array.from(g.byFlag.entries()).reduce((acc, [f, c]) => f !== 0 ? acc + c : acc, 0);
      const goodExisting = g.byFlag.get(0) || 0;
      const goodComputed = Math.max(0, g.total - nonZeroSum);
      if (goodExisting === 0 && goodComputed > 0) {
        g.byFlag.set(0, goodComputed);
      }
      for (const [flag, cnt] of g.byFlag.entries()) {
        const percent = g.total > 0 ? (cnt / g.total) * 100 : 0;
        rows.push({
          start,
          finish,
          articleNumber: g.articleNumber,
          articleName: g.articleName,
          count: cnt,
          errorFlag: flag,
          errorText: this.mapErrorFlagToTexts(flag).join(' + '),
          percent
        });
      }
    }
    // Sort rows by start asc, then articleNumber, then errorFlag
    rows.sort((a, b) => {
      if (a.start !== b.start) return a.start < b.start ? -1 : 1;
      if (a.articleNumber !== b.articleNumber) return a.articleNumber < b.articleNumber ? -1 : 1;
      return a.errorFlag - b.errorFlag;
    });
    return rows;
  }

  private computeErrorRateGroups(records: any[]): Array<{start:string;finish:string;articleNumber:string;articleName:string;total:number;rows:Array<{errorFlag:number;errorText:string;count:number;percent:number}>}> {
    type Group = {
      articleNumber: string;
      articleName: string;
      minTs: number;
      maxTs: number;
      total: number;
      byFlag: Map<number, number>;
    };
    const groups = new Map<string, Group>();
    for (const r of records || []) {
      const artNum: string = r.articleNumber ?? '';
      const artName: string = r.articleName ?? '';
      const tsStr: string = r.timestamp ?? '';
      const ts = tsStr ? new Date(tsStr).getTime() : NaN;
      let flag = this.extractErrorFlag(r);
      if (flag === null) flag = 0;
      const key = artNum;
      if (!groups.has(key)) {
        groups.set(key, {
          articleNumber: artNum,
          articleName: artName,
          minTs: isFinite(ts) ? ts : Number.POSITIVE_INFINITY,
          maxTs: isFinite(ts) ? ts : Number.NEGATIVE_INFINITY,
          total: 0,
          byFlag: new Map<number, number>()
        });
      }
      const g = groups.get(key)!;
      g.total += 1;
      if (isFinite(ts)) {
        if (ts < g.minTs) g.minTs = ts;
        if (ts > g.maxTs) g.maxTs = ts;
      }
      g.byFlag.set(flag, (g.byFlag.get(flag) || 0) + 1);
    }

    const result: Array<{start:string;finish:string;articleNumber:string;articleName:string;total:number;rows:Array<{errorFlag:number;errorText:string;count:number;percent:number}>}> = [];
    for (const g of groups.values()) {
      // ensure good packages row exists
      const nonZeroSum = Array.from(g.byFlag.entries()).reduce((acc, [f, c]) => f !== 0 ? acc + c : acc, 0);
      const goodExisting = g.byFlag.get(0) || 0;
      const goodComputed = Math.max(0, g.total - nonZeroSum);
      if (goodExisting === 0 && goodComputed > 0) g.byFlag.set(0, goodComputed);

      const start = isFinite(g.minTs) ? new Date(g.minTs).toISOString() : '';
      const finish = isFinite(g.maxTs) ? new Date(g.maxTs).toISOString() : '';
      const rows = Array.from(g.byFlag.entries())
        .map(([flag, cnt]) => ({
          errorFlag: flag,
          errorText: this.mapErrorFlagToTexts(flag).join(' + '),
          count: cnt,
          percent: g.total > 0 ? (cnt / g.total) * 100 : 0
        }))
        .sort((a, b) => (a.errorFlag === 0 ? -1 : b.errorFlag === 0 ? 1 : a.errorFlag - b.errorFlag));
      result.push({
        start,
        finish,
        articleNumber: g.articleNumber,
        articleName: g.articleName,
        total: g.total,
        rows
      });
    }
    // Sort groups by start asc then article number
    result.sort((a, b) => {
      if (a.start !== b.start) return a.start < b.start ? -1 : 1;
      return a.articleNumber < b.articleNumber ? -1 : (a.articleNumber > b.articleNumber ? 1 : 0);
    });
    return result;
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Multi-device selection helper methods
  isDeviceSelected(deviceName: string): boolean {
    return this.selectedDeviceNames.includes(deviceName);
  }

  toggleDeviceSelection(deviceName: string) {
    const index = this.selectedDeviceNames.indexOf(deviceName);
    if (index > -1) {
      this.selectedDeviceNames.splice(index, 1);
    } else {
      this.selectedDeviceNames.push(deviceName);
    }
  }

  selectAllDevices() {
    this.selectedDeviceNames = this.devices.map(d => this.getDeviceName(d));
  }

  deselectAllDevices() {
    this.selectedDeviceNames = [];
  }

  getDeviceName(device: any): string {
    return device?.name || device?.deviceName || device?.id || 'Unknown Device';
  }

  toggleDeviceListCollapse() {
    this.isDeviceListCollapsed = !this.isDeviceListCollapsed;
  }

  // Chart methods
  private initializeChart() {
    const canvas = document.getElementById('packageWeightChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Package Weight Over Time'
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Weight'
            }
          }
        }
      }
    });
  }

  private updateChart() {
    if (!this.chart) return;

    const colors = this.getDeviceColors();
    const datasets: any[] = [];
    let datasetIndex = 0;

    this.packageRecordsByDevice.forEach((records, deviceName) => {
      // Filter by package type if selected
      const filteredRecords = this.selectedPackageType === 'All' 
        ? records 
        : records.filter(record => record.packageType === this.selectedPackageType);

      const chartData = filteredRecords.map(record => ({
        x: new Date(record.timestamp).getTime(),
        y: this.getRecordWeight(record)
      }));

      chartData.sort((a, b) => (a.x as number) - (b.x as number));

      const color = colors[datasetIndex % colors.length];

      datasets.push({
        label: deviceName,
        data: chartData,
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.1,
        fill: false
      });

      datasetIndex++;
    });

    this.chart.data.datasets = datasets;
    
    // Update chart title with weight type
    const weightTypeLabel = this.getActiveWeightType() === 'actual' ? 'Actual Net Weight' : 'Printed Net Weight';
    if (this.chart.options.plugins?.title) {
      const packageTypeText = this.selectedPackageType === 'All' ? 'All Types' : this.selectedPackageType;
      this.chart.options.plugins.title.text = `${weightTypeLabel} - ${packageTypeText}`;
    }
    
    this.chart.update('none');
  }

  private getDeviceColors(): string[] {
    return [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
      '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63'
    ];
  }

  onWeightPreferenceChange() {
    // Ensure at least one option is selected
    if (!this.showActualWeight && !this.showPrintedWeight) {
      this.showActualWeight = true;
    }
    // Update chart if it exists
    if (this.chart && this.packageRecords.length > 0) {
      this.updateChart();
    }
  }

  private getActiveWeightType(): 'actual' | 'printed' {
    if (this.showActualWeight && !this.showPrintedWeight) return 'actual';
    if (!this.showActualWeight && this.showPrintedWeight) return 'printed';
    return 'actual'; // default to actual if both or neither are selected
  }

  private getRecordWeight(record: any): number {
    const weightType = this.getActiveWeightType();
    
    if (weightType === 'actual' && record.actualNetWeight?.value !== undefined) {
      return record.actualNetWeight.value;
    }
    if (weightType === 'printed' && record.printedNetWeight?.value !== undefined) {
      return record.printedNetWeight.value;
    }
    // Fallback
    if (record.actualNetWeight?.value !== undefined) {
      return record.actualNetWeight.value;
    }
    if (record.printedNetWeight?.value !== undefined) {
      return record.printedNetWeight.value;
    }
    return record.weight || 0;
  }

  getRecordDeviceName(record: any): string {
    for (const [deviceName, records] of this.packageRecordsByDevice.entries()) {
      if (records.includes(record)) {
        return deviceName;
      }
    }
    return record.deviceName || 'Unknown';
  }
}
