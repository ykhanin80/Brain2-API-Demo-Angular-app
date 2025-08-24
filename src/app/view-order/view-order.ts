import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiConfig } from '../api-config';

@Component({
  selector: 'app-view-order',
  imports: [JsonPipe, FormsModule],
  templateUrl: './view-order.html',
  styleUrl: './view-order.scss'
})
export class ViewOrder {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiConfig = inject(ApiConfig);
  
  orderNumber = '';
  orderData: any = null;
  isLoading = false;
  errorMessage = '';
  
  ngOnInit(): void {
    // If navigated with ?orderNumber=..., prefill and auto-load
    const param = this.route.snapshot.queryParamMap.get('orderNumber');
    if (param && param.trim().length > 0) {
      this.orderNumber = param.trim();
      this.viewOrder();
    }
  }
  
  viewOrder(): void {
    if (!this.orderNumber || this.orderNumber.trim() === '') {
      this.errorMessage = 'Please enter an order number';
      return;
    }
    
    console.log('Fetching order:', this.orderNumber.trim());
    
    this.isLoading = true;
    this.errorMessage = '';
    this.orderData = null;
    
  const baseUrl = this.apiConfig.getBaseUrl();
  const url = `${baseUrl}/api/v1/order-processing/orders/${this.orderNumber.trim()}`;
    
    this.http.get(url).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.orderData = response;
        console.log('Order data retrieved:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
        console.error('Failed to retrieve order:', error);
      }
    });
  }
  
  goBack(): void {
    // Return to All Orders list by default
    this.router.navigate(['/all-orders']);
  }
  
  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Order not found';
    } else if (error.status === 401) {
      return 'Unauthorized - please login again';
    } else if (error.status === 0) {
      return 'Unable to connect to server';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'An unexpected error occurred while retrieving the order';
    }
  }
}
