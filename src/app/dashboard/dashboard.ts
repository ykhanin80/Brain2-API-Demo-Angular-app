import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly router = inject(Router);

  // Navigation methods for each section
  navigateToDataMaintenance(): void {
    // TODO: Navigate to data maintenance section
    console.log('Navigate to Data Maintenance');
    // this.router.navigate(['/data-maintenance']);
  }

  navigateToOrderManagement(): void {
    this.router.navigate(['/order-management']);
  }

  navigateToCapture(): void {
    this.router.navigate(['/capture']);
  }

  navigateToActions(): void {
    this.router.navigate(['/actions']);
  }

  navigateToPackageRecord(): void {
    this.router.navigate(['/package-record']);
  }

  // Quick access methods
  navigateToCreateOrder(): void {
    this.router.navigate(['/create-order']);
  }

  navigateToViewOrder(): void {
    this.router.navigate(['/view-order']);
  }

  navigateToAllOrders(): void {
    this.router.navigate(['/all-orders']);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
