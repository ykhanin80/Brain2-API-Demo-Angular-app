import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiConfig } from '../api-config';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

interface PackageRecord {
  id: string;
  packageType: string;
  weight: number;
  timestamp: string;
  location?: string;
  operator?: string;
  actualNetWeight?: {
    value: number;
    decimalPlaces: number;
    unit: string;
  };
  printedNetWeight?: {
    value: number;
    decimalPlaces: number;
    unit: string;
  };
  unit?: string; // Keep for backward compatibility
}

@Component({
  selector: 'app-package-record',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './package-record.html',
  styleUrl: './package-record.scss'
})
export class PackageRecordComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);
  
  // Chart instance
  private chart: Chart | null = null;
  private refreshInterval: any = null;
  private lastRefreshTime: number = 0;
  
  // Data
  packageRecords: PackageRecord[] = [];
  packageRecordsByDevice: Map<string, PackageRecord[]> = new Map();
  packageTypes: string[] = [];
  devices: any[] = [];
  
  // Debug data - store API responses for debugging
  debugApiResponses = {
    packageRecords: null as any,
    devices: null as any,
    packageTypes: null as any
  };
  
  // Filter properties
  articleNumber = '';
  articleName = '';
  batchNumber = '';
  orderNumber = '';
  deviceName = ''; // Keep for backward compatibility
  selectedDeviceNames: string[] = [];
  take = 100;
  startDate = '';
  endDate = '';
  
  // Quick filter properties
  selectedPackageType = 'singlePackage';
  selectedTimeRange = 'lastHour';
  timeRangeOptions = [
    { value: 'last5min', label: 'Last 5 Minutes' },
    { value: 'last15min', label: 'Last 15 Minutes' },
    { value: 'last30min', label: 'Last 30 Minutes' },
    { value: 'lastHour', label: 'Last Hour' },
    { value: 'last2hours', label: 'Last 2 Hours' },
    { value: 'last6hours', label: 'Last 6 Hours' },
    { value: 'last12hours', label: 'Last 12 Hours' },
    { value: 'last24hours', label: 'Last 24 Hours' }
  ];
  
  // Auto-refresh properties
  selectedRefreshInterval = 0;
  refreshIntervalOptions = [
    { value: 0, label: 'Disabled' },
    
    { value: 30000, label: 'Every 30 seconds' },
    { value: 60000, label: 'Every minute' },
    { value: 300000, label: 'Every 5 minutes' }
  ];
  refreshCountdown = 0;
  countdownInterval: any = null;
  
  // Weight display preferences
  showActualWeight = true;
  showPrintedWeight = false;
  
  // UI state
  isLoading = false;
  isLoadingDevices = false;
  errorMessage = '';
  lastUpdateTime = '';
  activeDebugTab = 'records';
  isDebugSectionCollapsed = true;
  isDeviceListCollapsed = false;

  async ngOnInit() {
    await this.loadDevices();
    await this.loadPackageTypes();
    await this.loadPackageRecords();
    this.initializeChart();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private async loadDevices() {
    try {
      this.isLoadingDevices = true;
      const authHeaders = this.getAuthHeaders();
  const response = await this.http.get<any[]>(`${this.apiConfig.getBaseUrl()}/api/v1/devices`, { headers: authHeaders }).toPromise();
      this.devices = response || [];
      this.debugApiResponses.devices = { timestamp: new Date().toISOString(), rawResponse: response, devices: this.devices };
    } catch (error) {
      console.warn('Could not load devices:', error);
      this.devices = [];
      this.debugApiResponses.devices = { error: error };
    } finally {
      this.isLoadingDevices = false;
    }
  }

  private async loadPackageTypes() {
    try {
      const authHeaders = this.getAuthHeaders();
  const response = await this.http.get<string[]>(`${this.apiConfig.getBaseUrl()}/api/v1/package-types`, { headers: authHeaders }).toPromise();
      this.packageTypes = response || [];
      this.debugApiResponses.packageTypes = { timestamp: new Date().toISOString(), rawResponse: response, packageTypes: this.packageTypes };
    } catch (error) {
      console.warn('Could not load package types:', error);
      this.packageTypes = ['singlePackage', 'total1', 'total2', 'total3', 'total', 'partialBatchTotal', 'undefined'];
      this.debugApiResponses.packageTypes = { error: error, fallback: this.packageTypes };
    }
  }

  async refreshDevices() {
    await this.loadDevices();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers = new HttpHeaders();
    
    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  private async loadPackageRecords() {
    const startTime = performance.now();
    const callId = Math.random().toString(36).substr(2, 9);
    console.log('🔄 loadPackageRecords [' + callId + '] START at:', new Date().toLocaleTimeString(), 'interval set to:', this.selectedRefreshInterval + 'ms');
    
    if (this.selectedDeviceNames.length === 0) {
      this.packageRecords = [];
      this.packageRecordsByDevice.clear();
      this.errorMessage = 'Please select at least one device to view package records.';
      this.isLoading = false;
      this.updateChart();
      console.log('❌ [' + callId + '] No device selected, aborting loadPackageRecords');
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      console.log('📡 [' + callId + '] Starting API requests for', this.selectedDeviceNames.length, 'devices:', this.selectedDeviceNames, 'with time range:', this.selectedTimeRange);
      
      const authHeaders = this.getAuthHeaders();
      
      // Make parallel API calls for each selected device
      const apiCalls = this.selectedDeviceNames.map(async (deviceName) => {
        const params = this.buildQueryParams(deviceName);
        const url = `${this.apiConfig.getBaseUrl()}/api/v1/package-records${params}`;
        
        console.log('🌐 [' + callId + '] Making HTTP GET request for device:', deviceName, 'to:', url);
        const apiStartTime = performance.now();
        
        try {
          const response = await this.http.get<PackageRecord[]>(url, { headers: authHeaders }).toPromise();
          const apiEndTime = performance.now();
          console.log('📦 [' + callId + '] API response received for device:', deviceName, 'in:', Math.round(apiEndTime - apiStartTime), 'ms');
          
          return { deviceName, records: response || [] };
        } catch (error) {
          console.error('💥 [' + callId + '] Error loading records for device:', deviceName, error);
          return { deviceName, records: [], error };
        }
      });
      
      const results = await Promise.all(apiCalls);
      
      // Store records per device and combine all records
      this.packageRecordsByDevice.clear();
      const allRecords: PackageRecord[] = [];
      
      results.forEach(result => {
        this.packageRecordsByDevice.set(result.deviceName, result.records);
        allRecords.push(...result.records);
      });
      
      const newRecords = allRecords;
      
      const dataChanged = JSON.stringify(newRecords) !== JSON.stringify(this.packageRecords);
      console.log('📦 [' + callId + '] API Response:', {
        recordCount: newRecords.length,
        previousCount: this.packageRecords.length,
        dataChanged: dataChanged,
        firstRecord: newRecords.length > 0 ? {
          id: newRecords[0].id,
          timestamp: newRecords[0].timestamp,
          weight: this.getFormattedWeight(newRecords[0], this.getActiveWeightType())
        } : null
      });
      
      this.packageRecords = newRecords;
      this.lastUpdateTime = new Date().toLocaleTimeString();
      
      console.log('📈 [' + callId + '] Data updated, calling updateChart() at:', new Date().toLocaleTimeString());
      
      this.debugApiResponses.packageRecords = {
        timestamp: new Date().toISOString(),
        devices: this.selectedDeviceNames,
        results: results.map(r => ({
          deviceName: r.deviceName,
          recordCount: r.records.length,
          hasError: !!r.error
        })),
        processedRecords: this.packageRecords,
        recordCount: this.packageRecords.length,
        sampleRecord: this.packageRecords.length > 0 ? this.packageRecords[0] : null,
        weightAnalysis: this.packageRecords.map(r => ({ 
          id: r.id, 
          oldWeight: r.weight,
          actualNetWeight: r.actualNetWeight,
          printedNetWeight: r.printedNetWeight,
          actualValue: this.getWeightValue(r, 'actual'),
          actualUnit: this.getWeightUnit(r, 'actual'),
          actualFormatted: this.getFormattedWeight(r, 'actual'),
          printedValue: this.getWeightValue(r, 'printed'),
          printedUnit: this.getWeightUnit(r, 'printed'),
          printedFormatted: this.getFormattedWeight(r, 'printed'),
          activeType: this.getActiveWeightType(),
          rawUnit: r.unit 
        })).slice(0, 5)
      };
      
      this.updateChart();
      
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
      console.error('💥 [' + callId + '] Error loading package records:', error);
      this.debugApiResponses.packageRecords = { error: error, timestamp: new Date().toISOString() };
    } finally {
      this.isLoading = false;
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log('✅ [' + callId + '] loadPackageRecords COMPLETE in:', Math.round(duration), 'ms at:', new Date().toLocaleTimeString());
    }
  }

  onWeightPreferenceChange() {
    if (!this.showActualWeight && !this.showPrintedWeight) {
      this.showActualWeight = true;
    }
    this.updateChart();
  }

  private buildQueryParams(deviceName?: string): string {
    const params = new URLSearchParams();
    
    if (this.articleNumber) params.append('articleNumber', this.articleNumber);
    if (this.articleName) params.append('articleName', this.articleName);
    if (this.batchNumber) params.append('batchNumber', this.batchNumber);
    if (this.orderNumber) params.append('orderNumber', this.orderNumber);
    if (deviceName) params.append('deviceName', deviceName);
    
    if (this.selectedPackageType !== 'All') {
      params.append('packageType', this.selectedPackageType);
    }
    
    if (this.selectedTimeRange !== 'custom') {
      const now = new Date();
      const minutes = this.getTimeRangeMinutes(this.selectedTimeRange);
      const startTime = new Date(now.getTime() - minutes * 60000);
      
      const formatForApi = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      const startDateForApi = formatForApi(startTime);
      const endDateForApi = formatForApi(now);
      
      console.log('Time range calculation:', {
        now: now.toISOString(),
        startTime: startTime.toISOString(),
        startDateForApi,
        endDateForApi,
        minutesBack: minutes
      });
      
      params.append('startDate', startDateForApi);
      params.append('endDate', endDateForApi);
    } else {
      const formatForApi = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      if (this.startDate) params.append('startDate', formatForApi(new Date(this.startDate)));
      if (this.endDate) params.append('endDate', formatForApi(new Date(this.endDate)));
    }
    
    if (this.take) params.append('take', this.take.toString());
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  private getTimeRangeMinutes(range: string): number {
    const ranges: { [key: string]: number } = {
      'last5min': 5,
      'last15min': 15,
      'last30min': 30,
      'lastHour': 60,
      'last2hours': 120,
      'last6hours': 360,
      'last12hours': 720,
      'last24hours': 1440
    };
    return ranges[range] || 60;
  }

  private initializeChart() {
    const canvas = document.getElementById('weightChart') as HTMLCanvasElement;
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
          duration: 0 // Disable animations for immediate updates
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
            text: this.selectedPackageType === 'All' 
              ? `Weight (${this.getDefaultWeightUnit()}) - All Types` 
              : `Weight (${this.getDefaultWeightUnit()}) - ${this.selectedPackageType}`
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
              text: `Weight (${this.getDefaultWeightUnit()})`
            }
          }
        }
      }
    });

    this.updateChart();
  }

  private updateChart() {
    const updateId = Math.random().toString(36).substr(2, 9);
    console.log('📊 updateChart [' + updateId + '] called at:', new Date().toLocaleTimeString(), 'with', this.packageRecords.length, 'records');
    
    if (!this.chart) {
      console.log('❌ [' + updateId + '] Chart not initialized, skipping update');
      return;
    }

    const activeType = this.getActiveWeightType();
    const colors = this.getDeviceColors();
    
    // Create datasets for each device
    const datasets: any[] = [];
    let datasetIndex = 0;
    
    this.packageRecordsByDevice.forEach((records, deviceName) => {
      const filteredRecords = this.selectedPackageType === 'All' 
        ? records 
        : records.filter(record => record.packageType === this.selectedPackageType);

      const chartData = filteredRecords.map(record => ({
        x: new Date(record.timestamp).getTime(),
        y: this.getWeightValue(record, activeType)
      }));

      chartData.sort((a, b) => (a.x as number) - (b.x as number));

      const color = colors[datasetIndex % colors.length];
      
      datasets.push({
        label: deviceName,
        data: chartData,
        borderColor: color,
        backgroundColor: color + '20', // Add transparency
        tension: 0.1,
        fill: false
      });
      
      datasetIndex++;
    });

    console.log('📈 [' + updateId + '] Updating chart with', datasets.length, 'datasets for devices:', Array.from(this.packageRecordsByDevice.keys()));

    this.chart.data.datasets = datasets;
    
    const weightTypeLabel = activeType === 'actual' ? 'Actual Net Weight' : 'Printed Net Weight';
    if (this.chart.options.plugins?.title) {
      this.chart.options.plugins.title.text = this.selectedPackageType === 'All' 
        ? `${weightTypeLabel} (${this.getDefaultWeightUnit()}) - All Types` 
        : `${weightTypeLabel} (${this.getDefaultWeightUnit()}) - ${this.selectedPackageType}`;
    }

    if (this.chart.options.scales && this.chart.options.scales['y']) {
      (this.chart.options.scales['y'] as any).title.text = `${weightTypeLabel} (${this.getDefaultWeightUnit()})`;
    }

    console.log('🔄 [' + updateId + '] Calling chart.update() at:', new Date().toLocaleTimeString());
    this.chart.update('none');
    console.log('✅ [' + updateId + '] Chart update completed at:', new Date().toLocaleTimeString());
  }

  private getDeviceColors(): string[] {
    return [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#F44336', // Red
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#795548', // Brown
      '#607D8B', // Blue Grey
      '#E91E63'  // Pink
    ];
  }

  onFilterChange() {
    console.log('🔧 onFilterChange called at:', new Date().toLocaleTimeString());
    this.loadPackageRecords();
    if (this.selectedRefreshInterval > 0) {
      console.log('🔄 onFilterChange: Resetting auto-refresh intervals to maintain timing');
      this.setupAutoRefresh();
    }
  }

  onRefreshIntervalChange() {
    console.log('onRefreshIntervalChange called at:', new Date().toLocaleTimeString(), 'New interval:', this.selectedRefreshInterval);
    this.setupAutoRefresh();
  }

  private setupAutoRefresh() {
    const setupId = Math.random().toString(36).substr(2, 9);
    console.log('🔧 setupAutoRefresh [' + setupId + '] called with interval:', this.selectedRefreshInterval, 'ms at:', new Date().toLocaleTimeString());
    
    if (this.refreshInterval) {
      console.log('🧹 [' + setupId + '] Clearing existing refresh interval:', this.refreshInterval);
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.countdownInterval) {
      console.log('🧹 [' + setupId + '] Clearing existing countdown interval:', this.countdownInterval);
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    this.refreshCountdown = 0;

    if (this.selectedRefreshInterval > 0) {
      this.refreshCountdown = Math.floor(this.selectedRefreshInterval / 1000);
      
      console.log('⚙️ [' + setupId + '] Setting up new intervals:', {
        refreshIntervalMs: this.selectedRefreshInterval,
        refreshIntervalSeconds: this.selectedRefreshInterval / 1000,
        countdownSeconds: this.refreshCountdown,
        timestamp: new Date().toISOString()
      });
      
      this.countdownInterval = setInterval(() => {
        this.refreshCountdown--;
        if (this.refreshCountdown <= 0) {
          this.refreshCountdown = Math.floor(this.selectedRefreshInterval / 1000);
        }
      }, 1000);
      console.log('⏰ [' + setupId + '] Countdown interval created:', this.countdownInterval);
      
      this.refreshInterval = setInterval(() => {
        const actualInterval = performance.now() - this.lastRefreshTime;
        const triggerTime = new Date();
        console.log('🚀 AUTO-REFRESH TRIGGERED [' + setupId + '] at:', triggerTime.toLocaleTimeString() + '.' + triggerTime.getMilliseconds(), 
                   'Expected interval:', this.selectedRefreshInterval + 'ms', 
                   'Actual interval:', Math.round(actualInterval) + 'ms',
                   'Difference:', Math.round(actualInterval - this.selectedRefreshInterval) + 'ms');
        this.lastRefreshTime = performance.now();
        this.loadPackageRecords();
        this.refreshCountdown = Math.floor(this.selectedRefreshInterval / 1000);
      }, this.selectedRefreshInterval);
      
      this.lastRefreshTime = performance.now();
      
      console.log('✅ [' + setupId + '] Auto-refresh intervals created - Refresh ID:', this.refreshInterval, 'Countdown ID:', this.countdownInterval);
    } else {
      console.log('❌ [' + setupId + '] Auto-refresh disabled (interval = 0)');
    }
  }

  async manualRefresh() {
    await this.loadPackageRecords();
    if (this.selectedRefreshInterval > 0) {
      this.refreshCountdown = Math.floor(this.selectedRefreshInterval / 1000);
    }
  }

  // Helper methods for weight handling
  getActiveWeightType(): 'actual' | 'printed' {
    if (this.showActualWeight && !this.showPrintedWeight) return 'actual';
    if (!this.showActualWeight && this.showPrintedWeight) return 'printed';
    return 'actual'; // default to actual if both or neither are selected
  }

  getWeightValue(record: PackageRecord, type: 'actual' | 'printed'): number {
    if (type === 'actual' && record.actualNetWeight) {
      return record.actualNetWeight.value;
    }
    if (type === 'printed' && record.printedNetWeight) {
      return record.printedNetWeight.value;
    }
    return record.weight || 0;
  }

  getWeightUnit(record: PackageRecord, type: 'actual' | 'printed'): string {
    if (type === 'actual' && record.actualNetWeight) {
      return record.actualNetWeight.unit;
    }
    if (type === 'printed' && record.printedNetWeight) {
      return record.printedNetWeight.unit;
    }
    return record.unit || 'g';
  }

  getFormattedWeight(record: PackageRecord, type: 'actual' | 'printed'): string {
    const value = this.getWeightValue(record, type);
    let decimalPlaces = 2;
    
    if (type === 'actual' && record.actualNetWeight) {
      decimalPlaces = record.actualNetWeight.decimalPlaces;
    } else if (type === 'printed' && record.printedNetWeight) {
      decimalPlaces = record.printedNetWeight.decimalPlaces;
    }
    
    return value.toFixed(decimalPlaces);
  }

  getDefaultWeightUnit(): string {
    if (this.packageRecords.length > 0) {
      const firstRecord = this.packageRecords[0];
      const activeType = this.getActiveWeightType();
      return this.getWeightUnit(firstRecord, activeType);
    }
    return 'g';
  }

  // Statistics methods
  getAverageWeight(): number {
    if (this.packageRecords.length === 0) return 0;
    const activeType = this.getActiveWeightType();
    const sum = this.packageRecords.reduce((acc, record) => acc + this.getWeightValue(record, activeType), 0);
    return sum / this.packageRecords.length;
  }

  getMaxWeight(): number {
    if (this.packageRecords.length === 0) return 0;
    const activeType = this.getActiveWeightType();
    return Math.max(...this.packageRecords.map(record => this.getWeightValue(record, activeType)));
  }

  getMinWeight(): number {
    if (this.packageRecords.length === 0) return 0;
    const activeType = this.getActiveWeightType();
    return Math.min(...this.packageRecords.map(record => this.getWeightValue(record, activeType)));
  }

  getTotalWeight(): number {
    if (this.packageRecords.length === 0) return 0;
    const activeType = this.getActiveWeightType();
    return this.packageRecords.reduce((acc, record) => acc + this.getWeightValue(record, activeType), 0);
  }

  // UI helper methods
  getDevices() {
    return this.devices || [];
  }

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
    this.onFilterChange();
  }

  selectAllDevices() {
    this.selectedDeviceNames = this.devices.map(d => this.getDeviceName(d));
    this.onFilterChange();
  }

  deselectAllDevices() {
    this.selectedDeviceNames = [];
    this.onFilterChange();
  }

  getDeviceName(device: any): string {
    return device?.name || device?.deviceName || device?.id || 'Unknown Device';
  }

  getRecordDeviceName(record: PackageRecord): string {
    // Find which device this record belongs to
    for (const [deviceName, records] of this.packageRecordsByDevice.entries()) {
      if (records.includes(record)) {
        return deviceName;
      }
    }
    return 'Unknown';
  }

  getRecentRecords() {
    return this.packageRecords.slice(0, 10);
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getRefreshCountdownText(): string {
    return this.refreshCountdown > 0 ? `(${this.refreshCountdown}s)` : '';
  }

  getCalculatedStartDate(): string {
    if (this.selectedTimeRange === 'custom') return this.startDate;
    const now = new Date();
    const minutes = this.getTimeRangeMinutes(this.selectedTimeRange);
    const startTime = new Date(now.getTime() - minutes * 60000);
    return startTime.toLocaleString();
  }

  getCalculatedEndDate(): string {
    if (this.selectedTimeRange === 'custom') return this.endDate;
    return new Date().toLocaleString();
  }

  getTimezoneInfo(): string {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  exportData() {
    // Export functionality
  }

  backToDashboard() {
    window.history.back();
  }

  toggleDebugSection() {
    this.isDebugSectionCollapsed = !this.isDebugSectionCollapsed;
  }

  toggleDeviceListCollapse() {
    this.isDeviceListCollapsed = !this.isDeviceListCollapsed;
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  }
}
