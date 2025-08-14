import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface TransferValue {
  deviceType: string;
  name: string;
  value: string;
}

export interface SqlOrder {
  id: string; // GUID
  orderNumber: string;
  orderPosition: string;
  articleNumber: string;
  customerNumber: string;
  displayText: string;
  lineName: string;
  status: number; // Numeric status
  boxQuantityValue: number;
  palletQuantityValue: number;
  orderQuantityValue: number;
  orderQuantityDecimalPlaces: number;
  orderQuantityUnit: string;
  orderQuantityType: number;
  commonText1: string;
  commonText2: string;
  commonNumber1: number;
  commonNumber2: number;
  creationDate: string;
  creationUser: string;
  changeDate: string;
  changeUser: string;
  boxQuantityDecimalPlaces: number;
  boxQuantityUnit: string;
  boxQuantityType: number;
  palletQuantityDecimalPlaces: number;
  palletQuantityUnit: string;
  palletQuantityType: number;
  orderSplittedCount: number;
  lineGroupName: string;
  lastProcessingDeviceId: string;
  transferValues?: TransferValue[]; // Add transfer values
}

export interface OrderFilters {
  articleNumber: string;
  customerNumber: string;
  orderNumber: string;
  status: number | null;
  creationDateFrom: string;
  creationDateTo: string;
}

@Component({
  selector: 'app-all-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './all-orders.html',
  styleUrl: './all-orders.scss'
})
export class AllOrders implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://usjpnt0000015:9997';
  
  orders: SqlOrder[] = [];
  filteredOrders: SqlOrder[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Filter properties - individual properties for easier binding
  articleNumber = '';
  customerNumber = '';
  orderNumber = '';
  status: number | null = null;
  creationDateFrom = '';
  creationDateTo = '';
  
  // Sorting properties
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  showFilters = false;
  
  ngOnInit(): void {
    this.loadAllOrders();
  }

  loadAllOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading orders with mock data...');
    
    // For now, use mock data while you develop the API endpoint
    // Replace this with actual API call when your endpoint is ready
    this.simulateApiCall();
  }

  private simulateApiCall(): void {
    // Simulate network delay
    setTimeout(() => {
      // Mock data that simulates all 39 orders from SQL Server response
      const mockOrders: SqlOrder[] = [
        {
          id: '025f1812-d010-4549-982e-7ab0d72bdcc4',
          orderNumber: 'A0521007',
          orderPosition: '1',
          articleNumber: '2',
          customerNumber: '0',
          displayText: 'Work Order A0521004',
          lineName: '',
          status: 3,
          boxQuantityValue: 12,
          palletQuantityValue: 0,
          orderQuantityValue: 100,
          orderQuantityDecimalPlaces: 0,
          orderQuantityUnit: 'pcs',
          orderQuantityType: 8,
          commonText1: 'string',
          commonText2: 'string',
          commonNumber1: 0,
          commonNumber2: 0,
          creationDate: '2025-05-21T16:55:24.6891902',
          creationUser: 'bizerba-service',
          changeDate: '2025-05-21T16:55:35.9891254',
          changeUser: 'bizerba-service',
          boxQuantityDecimalPlaces: 0,
          boxQuantityUnit: 'pcs',
          boxQuantityType: 1,
          palletQuantityDecimalPlaces: 0,
          palletQuantityUnit: 'pcs',
          palletQuantityType: 8,
          orderSplittedCount: 0,
          lineGroupName: 'KMD',
          lastProcessingDeviceId: '631ff99f-26e8-4c2f-9b57-25496aedf0d4',
          transferValues: [
            { deviceType: 'primary', name: 'lotCode', value: 'L12345678' },
            { deviceType: 'primary', name: 'basePrice', value: 'USD;-2;999' },
            { deviceType: 'primary', name: 'dateField2', value: '290525' }
          ]
        }
      ];

      // Generate additional orders to simulate all 39 available orders
      const users = ['admin', 'user1', 'user2', 'operator1', 'supervisor'];
      const lineGroups = ['Primary Line', 'Secondary Line', 'Quality Line', 'Backup Line'];
      const articles = ['2', '15', '23', '31', '45', '67', '89', '102'];
      const customers = ['0', '1001', '1002', '1003', '1004', '1005'];
      const displayTexts = [
        'Work Order A0521004', 'Production Order B0521005', 'Quality Check C0521006',
        'Assembly Order D0521007', 'Packaging Order E0521008', 'Shipping Order F0521009',
        'Maintenance Order G0521010', 'Calibration Order H0521011'
      ];
      
      for (let i = 1; i < 39; i++) {
        mockOrders.push({
          id: `${i.toString().padStart(8, '0')}-d010-4549-982e-7ab0d72bdcc${i.toString().padStart(1, '0')}`,
          orderNumber: `A052100${(i + 7).toString()}`,
          orderPosition: '1',
          articleNumber: articles[i % articles.length],
          customerNumber: customers[i % customers.length],
          displayText: displayTexts[i % displayTexts.length],
          lineName: '',
          status: i % 7, // Status 0-6 for variety
          boxQuantityValue: 12 + (i % 20),
          palletQuantityValue: i % 3,
          orderQuantityValue: 100 + (i * 25),
          orderQuantityDecimalPlaces: 0,
          orderQuantityUnit: 'pcs',
          orderQuantityType: 8,
          commonText1: `string_${i}`,
          commonText2: `text_${i}`,
          commonNumber1: i,
          commonNumber2: i * 2,
          creationDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          creationUser: users[i % users.length],
          changeDate: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString(),
          changeUser: users[(i + 1) % users.length],
          boxQuantityDecimalPlaces: 0,
          boxQuantityUnit: 'pcs',
          boxQuantityType: 8,
          palletQuantityDecimalPlaces: 0,
          palletQuantityUnit: 'pcs',
          palletQuantityType: 8,
          orderSplittedCount: i % 3,
          lineGroupName: lineGroups[i % lineGroups.length],
          lastProcessingDeviceId: i % 2 === 0 ? '631ff99f-26e8-4c2f-9b57-25496aedf0d4' : '00000000-0000-0000-0000-000000000000',
          transferValues: [
            { deviceType: 'primary', name: 'lotCode', value: `L${(12345678 + i).toString()}` },
            { deviceType: 'primary', name: 'basePrice', value: `${i % 2 === 0 ? 'USD' : 'EUR'};-2;${(999 + i * 100).toString()}` },
            { deviceType: 'primary', name: 'dateField2', value: `${(28 + (i % 3)).toString().padStart(2, '0')}${(5 + (i % 7)).toString().padStart(2, '0')}25` }
          ]
        });
      }
      
      this.isLoading = false;
      this.orders = mockOrders;
      this.initializeData();
      console.log(`Mock orders loaded successfully (${mockOrders.length} orders total):`, mockOrders);
      
      // TODO: Replace this mock implementation with your actual API endpoint:
      /*
      const apiUrl = `${this.baseUrl}/api/v1/orders`;
      this.http.get<SqlOrder[]>(apiUrl).subscribe({
        next: (orders) => {
          this.isLoading = false;
          this.orders = orders;
          this.initializeData();
          console.log('Orders loaded successfully from API:', orders);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
          console.error('Failed to load orders:', error);
        }
      });
      */
    }, 1500);
  }
  
  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred while loading orders.';
  }
  
  initializeData(): void {
    this.filteredOrders = [...this.orders];
    this.applyFilters();
  }
  
  // Filter methods
  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      return (!this.orderNumber || order.orderNumber.toLowerCase().includes(this.orderNumber.toLowerCase())) &&
             (!this.articleNumber || order.articleNumber.toLowerCase().includes(this.articleNumber.toLowerCase())) &&
             (!this.customerNumber || order.customerNumber.toLowerCase().includes(this.customerNumber.toLowerCase())) &&
             (this.status === null || order.status === this.status) &&
             (!this.creationDateFrom || new Date(order.creationDate) >= new Date(this.creationDateFrom)) &&
             (!this.creationDateTo || new Date(order.creationDate) <= new Date(this.creationDateTo));
    });
    
    // Apply sorting if a column is selected
    if (this.sortColumn) {
      this.applySorting();
    }
  }
  
  clearFilters(): void {
    this.orderNumber = '';
    this.articleNumber = '';
    this.customerNumber = '';
    this.status = null;
    this.creationDateFrom = '';
    this.creationDateTo = '';
    this.applyFilters();
  }
  
  // Sorting methods
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }
  
  applySorting(): void {
    if (!this.sortColumn) return;
    
    this.filteredOrders.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (this.sortColumn) {
        case 'orderNumber':
          valueA = a.orderNumber;
          valueB = b.orderNumber;
          break;
        case 'articleNumber':
          valueA = a.articleNumber;
          valueB = b.articleNumber;
          break;
        case 'customerNumber':
          valueA = a.customerNumber;
          valueB = b.customerNumber;
          break;
        case 'displayText':
          valueA = a.displayText;
          valueB = b.displayText;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'orderQuantityValue':
          valueA = a.orderQuantityValue;
          valueB = b.orderQuantityValue;
          break;
        case 'creationDate':
          valueA = new Date(a.creationDate);
          valueB = new Date(b.creationDate);
          break;
        case 'creationUser':
          valueA = a.creationUser;
          valueB = b.creationUser;
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
  
  // Status text conversion
  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Proposed';
      case 1: return 'Pending';
      case 2: return 'Finished';
      case 3: return 'Interrupted';
      case 4: return 'Cancelled';
      case 5: return 'Finished';
      case 6: return 'Error';
      default: return 'Unknown';
    }
  }
  
  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-proposed';
      case 1: return 'status-pending';
      case 2: return 'status-finished';
      case 3: return 'status-interrupted';
      case 4: return 'status-cancelled';
      case 5: return 'status-finished';
      case 6: return 'status-error';
      default: return 'status-unknown';
    }
  }
  
  // Transfer value helpers
  getTransferValue(order: SqlOrder, name: string): string {
    if (!order.transferValues) return '';
    const transferValue = order.transferValues.find(tv => tv.name === name);
    return transferValue ? transferValue.value : '';
  }
  
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString;
    }
  }
  
  formatQuantity(value: number, decimalPlaces: number): string {
    return value.toFixed(decimalPlaces);
  }
  
  goBack(): void {
    this.router.navigate(['/']);
  }

  refreshOrders(): void {
    this.loadAllOrders();
  }

  // Transfer value helpers
  getLotCode(order: SqlOrder): string {
    return this.getTransferValue(order, 'lotCode');
  }

  getBasePrice(order: SqlOrder): string {
    return this.getTransferValue(order, 'basePrice');
  }

  getDateField2(order: SqlOrder): string {
    return this.getTransferValue(order, 'dateField2');
  }

  viewOrderDetails(order: SqlOrder): void {
    // Navigate to view order page with the order number
    this.router.navigate(['/view-order'], { queryParams: { orderNumber: order.orderNumber } });
  }

  editOrder(order: SqlOrder): void {
    // Navigate to edit order page with the order number
    this.router.navigate(['/edit-order', order.orderNumber]);
  }
}
