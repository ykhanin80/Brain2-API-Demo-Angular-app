import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order',
  imports: [CommonModule, FormsModule, JsonPipe],
  templateUrl: './order.html',
  styleUrl: './order.scss'
})
export class Order {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://usjpnt0000015:9997';
  
  // Form properties
  orderNumber = '';
  lineName = '';
  
  // Response handling
  responseData: any = null;
  orderResults: any[] = [];
  orderInfo: any = null;
  orderDetails: any = null;
  orderStatus: any = null;
  processingResponse: any = null;
  modificationResponse: any = null;
  lastEndpoint = '';
  lastMethod = '';
  responseStatus = '';
  isSuccess = false;
  isLoading = false;
  errorMessage = '';
  isJsonExpanded = false;
  
  // Sorting functionality for order results
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  navigateToCreateOrder(): void {
    this.router.navigate(['/create-order']);
  }

  navigateToAllOrders(): void {
    this.router.navigate(['/all-orders']);
  }

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }  // Order Information Methods
  getOrderDetails(): void {
    if (!this.orderNumber.trim()) {
      this.showError('Please enter an order number');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/orders/${this.orderNumber.trim()}`;
    this.makeApiCall('GET', endpoint);
  }

  getOrderResults(): void {
    if (!this.orderNumber.trim()) {
      this.showError('Please enter an order number');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/orders/${this.orderNumber.trim()}/results`;
    this.makeApiCall('GET', endpoint);
  }

  getOrderStatus(): void {
    if (!this.orderNumber.trim()) {
      this.showError('Please enter an order number');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/orders/${this.orderNumber.trim()}/status`;
    this.makeApiCall('GET', endpoint);
  }

  getOrderTransferValues(): void {
    if (!this.orderNumber.trim()) {
      this.showError('Please enter an order number');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/orders/${this.orderNumber.trim()}/transfer-values`;
    this.makeApiCall('GET', endpoint);
  }

  getOrderStatusByLine(): void {
    if (!this.orderNumber.trim() || !this.lineName.trim()) {
      this.showError('Please enter both order number and line name');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/lines/${this.lineName.trim()}/orders/${this.orderNumber.trim()}/status`;
    this.makeApiCall('GET', endpoint);
  }

  // Order Processing Methods
  startOrder(): void {
    if (!this.orderNumber.trim() || !this.lineName.trim()) {
      this.showError('Please enter both order number and line name');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/lines/${this.lineName.trim()}/orders/${this.orderNumber.trim()}/start`;
    this.makeApiCall('POST', endpoint);
  }

  interruptOrder(): void {
    if (!this.orderNumber.trim() || !this.lineName.trim()) {
      this.showError('Please enter both order number and line name');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/lines/${this.lineName.trim()}/orders/${this.orderNumber.trim()}/interrupt`;
    this.makeApiCall('POST', endpoint);
  }

  finishOrder(): void {
    if (!this.orderNumber.trim() || !this.lineName.trim()) {
      this.showError('Please enter both order number and line name');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/lines/${this.lineName.trim()}/orders/${this.orderNumber.trim()}/finish`;
    this.makeApiCall('POST', endpoint);
  }

  cancelOrder(): void {
    if (!this.orderNumber.trim() || !this.lineName.trim()) {
      this.showError('Please enter both order number and line name');
      return;
    }
    
    const endpoint = `/api/v1/order-processing/lines/${this.lineName.trim()}/orders/${this.orderNumber.trim()}/cancel`;
    this.makeApiCall('POST', endpoint);
  }

  // Order Modification Methods
  openModifyOrderDialog(): void {
    // Navigate to edit order page
    if (this.orderNumber && this.orderNumber.trim()) {
      this.router.navigate(['/edit-order', this.orderNumber.trim()]);
    } else {
      this.router.navigate(['/edit-order']);
    }
  }

  openModifyTransferValuesDialog(): void {
    if (!this.orderNumber.trim()) {
      this.showError('Please enter an order number');
      return;
    }
    
    // Prompt for transfer values
    const transferValuesInput = prompt(
      'Enter transfer values as JSON array:\n' +
      'Example: [{"deviceType":"primary","name":"basePrice","value":"USD;-2;899"}]\n' +
      'Or leave empty to use sample data:'
    );
    
    let transferValues;
    if (transferValuesInput && transferValuesInput.trim()) {
      try {
        transferValues = JSON.parse(transferValuesInput);
      } catch (error) {
        this.showError('Invalid JSON format for transfer values');
        return;
      }
    } else {
      // Use sample transfer values
      transferValues = [
        {
          deviceType: 'primary',
          name: 'basePrice',
          value: 'USD;-2;899'
        },
        {
          deviceType: 'secondary',
          name: 'weight',
          value: '1.5'
        }
      ];
    }
    
    const endpoint = `/api/v1/order-processing/orders/${this.orderNumber.trim()}/transfer-values`;
    this.makeApiCall('PUT', endpoint, transferValues);
  }

  private parseQuantityInput(input: string | null): any {
    if (!input || !input.trim()) {
      return undefined;
    }
    
    const parts = input.split(',').map(p => p.trim());
    if (parts.length !== 3) {
      return undefined;
    }
    
    const value = parseInt(parts[0]);
    if (isNaN(value)) {
      return undefined;
    }
    
    return {
      value: value,
      decimalPlaces: 0,
      unit: parts[1],
      type: parts[2]
    };
  }

  // Utility Methods
  private makeApiCall(method: string, endpoint: string, body?: any): void {
    this.isLoading = true;
    this.clearError();
    this.clearResponse();
    
    this.lastMethod = method;
    this.lastEndpoint = endpoint;
    
    const url = `${this.baseUrl}${endpoint}`;
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
      case 'PUT':
        request = this.http.put(url, body || {}, { headers });
        break;
      case 'PATCH':
        request = this.http.patch(url, body || {}, { headers });
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
        
        // If it's order results, store them separately for table display
        if (endpoint.includes('/results') && response && response.totalRecords) {
          this.orderResults = response.totalRecords;
          this.orderInfo = {
            orderNumber: response.orderNumber,
            articleNumber: response.articleNumber
          };
        }
        
        // If it's order details, store them separately for form display
        if (endpoint.includes('/orders/') && !endpoint.includes('/results') && !endpoint.includes('/status') && !endpoint.includes('/transfer-values') && !endpoint.includes('/start') && !endpoint.includes('/interrupt') && !endpoint.includes('/finish') && !endpoint.includes('/cancel')) {
          this.orderDetails = response;
        }
        
        // If it's order status, store it separately for status display
        if (endpoint.includes('/status') && response && response.status) {
          this.orderStatus = response;
        }
        
        // If it's a processing operation, store it separately
        if (endpoint.includes('/start') || endpoint.includes('/interrupt') || endpoint.includes('/finish') || endpoint.includes('/cancel')) {
          this.processingResponse = {
            operation: this.getOperationName(endpoint),
            response: response,
            timestamp: new Date(),
            endpoint: endpoint,
            method: method
          };
        }
        
        // If it's a modification operation, store it separately
        if (method === 'PATCH' || (method === 'PUT' && endpoint.includes('/transfer-values'))) {
          this.modificationResponse = {
            operation: method === 'PATCH' ? 'Modify Order' : 'Modify Transfer Values',
            response: response,
            timestamp: new Date(),
            endpoint: endpoint,
            method: method
          };
        }
        
        console.log(`${method} ${endpoint} - Success:`, response);
      },
      error: (error) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.responseStatus = `Error ${error.status || 'Unknown'}`;
        this.responseData = error.error || error.message || error;
        
        // If it's a processing operation error, store it separately
        if (endpoint.includes('/start') || endpoint.includes('/interrupt') || endpoint.includes('/finish') || endpoint.includes('/cancel')) {
          this.processingResponse = {
            operation: this.getOperationName(endpoint),
            response: error.error || error.message || error,
            timestamp: new Date(),
            endpoint: endpoint,
            method: method,
            isError: true,
            errorStatus: error.status || 'Unknown'
          };
        }
        
        // If it's a modification operation error, store it separately
        if (method === 'PATCH' || (method === 'PUT' && endpoint.includes('/transfer-values'))) {
          this.modificationResponse = {
            operation: method === 'PATCH' ? 'Modify Order' : 'Modify Transfer Values',
            response: error.error || error.message || error,
            timestamp: new Date(),
            endpoint: endpoint,
            method: method,
            isError: true,
            errorStatus: error.status || 'Unknown'
          };
        }
        
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

  private getOperationName(endpoint: string): string {
    if (endpoint.includes('/start')) {
      return 'Start Order';
    } else if (endpoint.includes('/interrupt')) {
      return 'Interrupt Order';
    } else if (endpoint.includes('/finish')) {
      return 'Finish Order';
    } else if (endpoint.includes('/cancel')) {
      return 'Cancel Order';
    }
    return 'Processing Operation';
  }

  private showError(message: string): void {
    this.errorMessage = message;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  // Order Results Table Functionality
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.orderResults.length > 0) {
      this.orderResults.sort((a, b) => {
        let aVal = this.getOrderColumnValue(a, column);
        let bVal = this.getOrderColumnValue(b, column);

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

  private getOrderColumnValue(record: any, column: string): any {
    switch (column) {
      case 'packageType':
        return record.packageType;
      case 'netWeight':
        return record.netWeight?.value || 0;
      case 'numberOfPacks':
        return record.numberOfPacks || 0;
      case 'packageNumerator':
        return record.packageNumerator || 0;
      case 'total1Numerator':
        return record.total1Numerator || 0;
      case 'total2Numerator':
        return record.total2Numerator || 0;
      case 'total3Numerator':
        return record.total3Numerator || 0;
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

  shouldShowOrderEmptyState(): boolean {
    return this.responseData !== null && 
           Array.isArray(this.orderResults) && 
           this.orderResults.length === 0 && 
           !this.isLoading &&
           this.isSuccess &&
           this.lastEndpoint.includes('/results');
  }

  shouldShowOrderDetails(): boolean {
    return this.orderDetails !== null && !this.isLoading && this.isSuccess;
  }

  shouldShowOrderStatus(): boolean {
    return this.orderStatus !== null && !this.isLoading && this.isSuccess;
  }

  shouldShowProcessingResponse(): boolean {
    return this.processingResponse !== null && !this.isLoading;
  }

  shouldShowModificationResponse(): boolean {
    return this.modificationResponse !== null && !this.isLoading;
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) {
      return '';
    }
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp;
      }
      
      // Format as MM/DD/YYYY HH:MM:SS
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return timestamp;
    }
  }

  getStatusIcon(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('started') || statusLower.includes('active')) {
      return '🟢';
    } else if (statusLower.includes('starting')) {
      return '🟡';
    } else if (statusLower.includes('error') || statusLower.includes('failed')) {
      return '🔴';
    } else if (statusLower.includes('finished') || statusLower.includes('completed')) {
      return '✅';
    } else if (statusLower.includes('cancelled') || statusLower.includes('stopped')) {
      return '🛑';
    } else if (statusLower.includes('interrupted') || statusLower.includes('paused')) {
      return '⏸️';
    }
    return '🔵';
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('started') || statusLower.includes('active')) {
      return 'status-active';
    } else if (statusLower.includes('starting')) {
      return 'status-starting';
    } else if (statusLower.includes('error') || statusLower.includes('failed')) {
      return 'status-error';
    } else if (statusLower.includes('finished') || statusLower.includes('completed')) {
      return 'status-completed';
    } else if (statusLower.includes('cancelled') || statusLower.includes('stopped')) {
      return 'status-cancelled';
    } else if (statusLower.includes('interrupted') || statusLower.includes('paused')) {
      return 'status-interrupted';
    }
    return 'status-default';
  }

  formatCreationDate(dateString: string): string {
    if (!dateString) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid date
      }
      
      // Format as MM/DD/YYYY HH:MM:SS
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  }

  clearResponse(): void {
    this.responseData = null;
    this.orderResults = [];
    this.orderInfo = null;
    this.orderDetails = null;
    this.orderStatus = null;
    this.processingResponse = null;
    this.modificationResponse = null;
    this.lastEndpoint = '';
    this.lastMethod = '';
    this.responseStatus = '';
    this.isSuccess = false;
    // Reset sorting
    this.sortColumn = '';
    this.sortDirection = 'asc';
  }

  // JSON display functionality
  toggleJsonExpanded(): void {
    this.isJsonExpanded = !this.isJsonExpanded;
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
