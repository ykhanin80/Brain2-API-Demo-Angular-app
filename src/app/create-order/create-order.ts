import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Enum for Start Belt on Order Start Type (matching API schema)
enum StartBeltOnOrderStartType {
  ALWAYS = 'always',
  ONLY_IF_STARTED_BEFORE_LOCK = 'onlyIfStartedBeforeLock'
}

interface Article {
  number: string;
  name: string;
  id?: string;
}

interface Quantity {
  value: number;
  decimalPlaces: number;
  unit: string;
  type: string;
}

interface Settings {
  codepage: string;
  orderTotal1LabelCount: number;
  orderTotal2LabelCount: number;
  orderTotal3LabelCount: number;
  startBeltOnOrderStart: StartBeltOnOrderStartType;
  printLabelPrimary: boolean;
  printLabelSecondary1: boolean;
  printLabelSecondary2: boolean;
  printLabelSecondary3: boolean;
  printLabelSecondary4: boolean;
  printLabelSecondary5: boolean;
  printLabelSecondary6: boolean;
}

interface TransferValue {
  deviceType: string;
  name: string;
  value: string;
}

interface OrderRequest {
  orderNumber: string;
  orderPosition: string;
  lineGroupName: string;
  displayText: string;
  customerNumber: string;
  articleNumber: string;
  creationDate: string;
  palletQuantity: Quantity;
  orderQuantity: Quantity;
  boxQuantity: Quantity;
  settings: Settings;
  transferValues: TransferValue[];
  commonText1: string;
  commonText2: string;
  commonNumber1: number;
  commonNumber2: number;
}

@Component({
  selector: 'app-create-order',
  imports: [JsonPipe, FormsModule],
  templateUrl: './create-order.html',
  styleUrl: './create-order.scss'
})
export class CreateOrder implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://localhost:9997';
  
  // Expose enum for template
  readonly StartBeltOptions = StartBeltOnOrderStartType;
  
  // Articles data
  articles: Article[] = [];
  isLoadingArticles = false;
  articlesError = '';
  
  orderData: OrderRequest = {
    orderNumber: '',
    orderPosition: '1',
    lineGroupName: 'KMD',
    displayText: '',
    customerNumber: '0',
    articleNumber: '',
    creationDate: new Date().toISOString(),
    palletQuantity: {
      value: 0,
      decimalPlaces: 0,
      unit: 'pcs',
      type: 'boxes'
    },
    orderQuantity: {
      value: 100,
      decimalPlaces: 0,
      unit: 'pcs',
      type: 'boxes'
    },
    boxQuantity: {
      value: 12,
      decimalPlaces: 0,
      unit: 'pcs',
      type: 'pieces'
    },
    settings: {
      codepage: 'westernEurope',
      orderTotal1LabelCount: 0,
      orderTotal2LabelCount: 0,
      orderTotal3LabelCount: 0,
      startBeltOnOrderStart: StartBeltOnOrderStartType.ONLY_IF_STARTED_BEFORE_LOCK,
      printLabelPrimary: true,
      printLabelSecondary1: false,
      printLabelSecondary2: false,
      printLabelSecondary3: false,
      printLabelSecondary4: false,
      printLabelSecondary5: false,
      printLabelSecondary6: false
    },
    transferValues: [
      {
        deviceType: 'primary',
        name: 'basePrice',
        value: 'USD;-2;799'
      },
      {
        deviceType: 'primary',
        name: 'dateField2',
        value: '290525'
      },
      {
        deviceType: 'primary',
        name: 'lotCode',
        value: 'L12345678'
      },
      {
        deviceType: 'primary',
        name: 'labelParNum',
        value: '1'
      }
    ],
    commonText1: '',
    commonText2: '',
    commonNumber1: 0,
    commonNumber2: 0
  };
  
  // User-friendly fields for transfer values
  userFriendlyBasePrice = 9.99;
  userFriendlyDateString = '2025-05-29'; // ISO format for date input
  
  createdOrder: any = null;
  isLoading = false;
  errorMessage = '';
  
  ngOnInit(): void {
    this.loadArticles();
  }
  
  loadArticles(): void {
    this.isLoadingArticles = true;
    this.articlesError = '';
    
    const url = `${this.baseUrl}/api/v1/articles/labeler?skip=0&take=100&sort=Number%2B`;
    
    this.http.get<Article[]>(url).subscribe({
      next: (articles) => {
        this.isLoadingArticles = false;
        this.articles = articles;
        console.log('Articles loaded:', articles);
      },
      error: (error) => {
        this.isLoadingArticles = false;
        this.articlesError = 'Failed to load articles';
        console.error('Failed to load articles:', error);
      }
    });
  }
  
  createOrder(): void {
    if (!this.orderData.orderNumber.trim()) {
      this.errorMessage = 'Please enter an order number';
      return;
    }
    
    if (!this.orderData.articleNumber.trim()) {
      this.errorMessage = 'Please enter an article number';
      return;
    }
    
    console.log('Creating order:', this.orderData);
    
    this.isLoading = true;
    this.errorMessage = '';
    this.createdOrder = null;
    
    // Update transfer values with user-friendly formatting
    this.updateTransferValues();
    
    // Ensure default values are set
    this.orderData.orderPosition = '1';
    this.orderData.customerNumber = '0';
    this.orderData.settings.codepage = 'westernEurope';
    
    // Ensure all transfer values have deviceType set to 'primary'
    this.orderData.transferValues.forEach(tv => {
      tv.deviceType = 'primary';
    });
    
    // Update creation date to current time
    this.orderData.creationDate = new Date().toISOString();
    
    const url = `${this.baseUrl}/api/v1/order-processing/orders`;
    
    this.http.post(url, this.orderData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.createdOrder = response;
        console.log('Order created successfully:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
        console.error('Failed to create order:', error);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/orders']);
  }
  
  addTransferValue(): void {
    this.orderData.transferValues.push({
      deviceType: 'primary',
      name: '',
      value: ''
    });
  }
  
  removeTransferValue(index: number): void {
    if (this.orderData.transferValues.length > 1) {
      this.orderData.transferValues.splice(index, 1);
    }
  }
  
  // Convert user-friendly price (9.99) to API format (USD;-2;999)
  formatBasePriceForAPI(price: number): string {
    const cents = Math.round(price * 100);
    return `USD;-2;${cents}`;
  }
  
  // Convert user-friendly date to API format (290525 for May 29, 2025)
  formatDateForAPI(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}${month}${year}`;
  }
  
  // Get formatted date preview from string
  getDatePreview(): string {
    try {
      const dateObject = new Date(this.userFriendlyDateString);
      return this.formatDateForAPI(dateObject);
    } catch {
      return 'Invalid date';
    }
  }
  
  // Update transfer values with formatted data
  updateTransferValues(): void {
    // Update basePrice
    const basePriceIndex = this.orderData.transferValues.findIndex(tv => tv.name === 'basePrice');
    if (basePriceIndex !== -1) {
      this.orderData.transferValues[basePriceIndex].value = this.formatBasePriceForAPI(this.userFriendlyBasePrice);
    }
    
    // Update dateField2
    const dateFieldIndex = this.orderData.transferValues.findIndex(tv => tv.name === 'dateField2');
    if (dateFieldIndex !== -1) {
      const dateObject = new Date(this.userFriendlyDateString);
      this.orderData.transferValues[dateFieldIndex].value = this.formatDateForAPI(dateObject);
    }
  }
  
  private getErrorMessage(error: any): string {
    if (error.status === 400) {
      return 'Invalid order data - please check your inputs';
    } else if (error.status === 401) {
      return 'Unauthorized - please login again';
    } else if (error.status === 0) {
      return 'Unable to connect to server';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'An unexpected error occurred while creating the order';
    }
  }
}
