import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { APP_VERSION } from '../../version';
import { UserService } from '../user.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  readonly version = APP_VERSION;

  // Check if user can view master data (for Data Maintenance)
  canViewMasterData(): boolean {
    return this.userService.canViewMasterData();
  }
  
  // Check if user can view orders
  canViewOrders(): boolean {
    return this.userService.canViewOrders();
  }
  
  // Check if user can view capture
  canViewCapture(): boolean {
    return this.userService.canViewCapture();
  }
  
  // Check if user can view label designer
  canViewLabelDesigner(): boolean {
    return this.userService.canViewLabelDesigner();
  }

  // Navigation methods for each section
  navigateToDataMaintenance(): void {
    this.router.navigate(['/data-maintenance']);
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

  navigateToLabelPreview(): void {
    this.router.navigate(['/label-preview']);
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
