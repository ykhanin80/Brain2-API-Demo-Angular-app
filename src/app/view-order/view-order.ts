import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-order',
  imports: [JsonPipe, FormsModule],
  templateUrl: './view-order.html',
  styleUrl: './view-order.scss'
})
export class ViewOrder {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://localhost:9997';
  
  orderNumber = '';
  orderData: any = null;
  isLoading = false;
  errorMessage = '';
  
  viewOrder(): void {
    if (!this.orderNumber || this.orderNumber.trim() === '') {
      this.errorMessage = 'Please enter an order number';
      return;
    }
    
    console.log('Fetching order:', this.orderNumber.trim());
    
    this.isLoading = true;
    this.errorMessage = '';
    this.orderData = null;
    
    const url = `${this.baseUrl}/api/v1/order-processing/orders/${this.orderNumber.trim()}`;
    
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
    this.router.navigate(['/orders']);
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
