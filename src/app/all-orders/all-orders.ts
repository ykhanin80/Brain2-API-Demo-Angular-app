import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiConfig } from '../api-config';
import { DebugPanelComponent } from '../data-maintenance/debug/debug-panel';
import { UserService } from '../user.service';

export interface ApiOrder {
  key: string;
  displayName: string;
  active: boolean;
  creationDate: string;
  changeDate: string;
  // Allow extra fields without typing the entire payload
  [extra: string]: any;
}

export interface ProductionLine {
  id: string;
  name: string;
}

@Component({
  selector: 'app-all-orders',
  imports: [CommonModule, FormsModule, DebugPanelComponent],
  templateUrl: './all-orders.html',
  styleUrl: './all-orders.scss'
})
export class AllOrders implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiConfig = inject(ApiConfig);
  private readonly userService = inject(UserService);
  
  // Check if current user can edit orders
  canEdit = () => this.userService.canEditOrders();
  
  // Check if user can create orders
  canCreateOrder = () => this.userService.canEditOrders();
  
  // Check if user can perform workflow actions (Start, Interrupt, Finish, Cancel)
  // These require OrderDisplay permission (viewing) but not necessarily OrderEdit
  canPerformWorkflowActions = () => this.userService.canViewOrders();
  
  // Current page items and filtered view
  orders: ApiOrder[] = [];
  filteredOrders: ApiOrder[] = [];
  
  // Pagination
  page = 1;
  pageSize = 10;
  total = 0;
  
  // State
  isLoading = false;
  errorMessage = '';
  selectedOrder: ApiOrder | null = null;
  lineName: string = '';
  productionLines: ProductionLine[] = [];
  loadingLines = false;
  linesError = '';
  actionLoading = false;
  lastAction: { name: string; isError: boolean; status?: number; response?: any; error?: any; timestamp: Date } | null = null;
  // Per-row status
  orderStatuses: Record<string, string> = {};
  orderStatusLoading: Record<string, boolean> = {};
  orderStatusErrors: Record<string, string> = {};
  
  // Filter properties - individual properties for easier binding
  articleNumber = '';
  customerNumber = '';
  orderNumber = '';
  status: number | null = null;
  creationDateFrom = '';
  creationDateTo = '';
  
  showFilters = false;

  // Cleanup dialog properties
  showCleanupDialog = false;
  cleanupDateFrom = '';
  cleanupDateTo = '';
  cleanupStatus: number | null = null;
  isCleanupLoading = false;
  cleanupResult: { success?: boolean; message?: string; deletedCount?: number } | null = null;

  // Debug panel state and storage
  debugCollapsed = true;
  activeDebugTab: string = 'ordersList';
  debug: { listOrders: any; lastStatus: any; lastAction: any } = {
    listOrders: {},
    lastStatus: {},
    lastAction: {}
  };

  ngOnInit(): void {
    // Check for query parameters to pre-select order and line
    this.route.queryParams.subscribe(params => {
      const selectOrderKey = params['selectOrder'];
      const selectLine = params['selectLine'];
      
      if (selectLine) {
        this.lineName = selectLine;
      }
      
      // Load data first, then select the order
      this.loadAllOrders(1, selectOrderKey);
    });
    
    this.loadProductionLines();
  }

  loadProductionLines(): void {
    this.loadingLines = true;
    this.linesError = '';
    const baseUrl = this.apiConfig.getBaseUrl();
    const url = `${baseUrl}/api/v1/production-lines`;
    
    this.http.get<ProductionLine[]>(url).subscribe({
      next: (lines) => {
        this.productionLines = lines || [];
        // Auto-select first line if available and no line selected
        if (this.productionLines.length > 0 && !this.lineName) {
          this.lineName = this.productionLines[0].name;
        }
        this.loadingLines = false;
      },
      error: (err) => {
        console.error('Failed to load production lines:', err);
        this.linesError = err?.error?.message || err?.message || 'Failed to load production lines';
        this.loadingLines = false;
      }
    });
  }
  loadAllOrders(targetPage?: number, selectOrderKey?: string): void {
    if (targetPage) this.page = targetPage;
    this.isLoading = true;
    this.errorMessage = '';

    const baseUrl = this.apiConfig.getBaseUrl();
    const url = `${baseUrl}/extensions/api/Order-Processing/GetAllOrders`;
    const params: any = { page: String(this.page), pageSize: String(this.pageSize) };
    // Debug: capture request
    this.debug.listOrders = { request: { url, params }, time: new Date().toISOString() };

    this.http.get<any>(url, { params }).subscribe({
      next: (res) => {
        const parsed = this.parseOrdersResponse(res);
        this.total = parsed.total;
        this.orders = parsed.items;
        this.initializeData();
        this.loadStatusesForList();
        this.isLoading = false;
        
        // Pre-select order if specified
        if (selectOrderKey) {
          const orderToSelect = this.orders.find(o => o.key === selectOrderKey);
          if (orderToSelect) {
            this.selectedOrder = orderToSelect;
          }
        }

        // Debug: capture response
        this.debug.listOrders = {
          request: { url, params },
          response: res,
          parsed: { total: this.total, items: this.orders?.length ?? 0 },
          time: new Date().toISOString()
        };
      },
      error: (err) => {
        // Fallback: attempt to treat response as array when server ignores params
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        console.error('Failed to load orders:', err);
        // Debug: capture error
        this.debug.listOrders = { request: { url, params }, error: err, time: new Date().toISOString() };
      }
    });
  }

  private parseOrdersResponse(res: any): { items: ApiOrder[]; total: number } {
    // Common shapes: array; {items,total}; {data,total|count}; {orders,totalCount}
    if (Array.isArray(res)) {
      // If API returns all orders, do client-side pagination
      const all: ApiOrder[] = res.map(this.normalizeOrder);
      const start = (this.page - 1) * this.pageSize;
      const end = start + this.pageSize;
      return { items: all.slice(start, end), total: all.length };
    }
    const total = res.total ?? res.totalCount ?? res.count ?? res.Total ?? res.TotalCount ?? res.Count ?? 0;
    const items = (res.items ?? res.data ?? res.orders ?? res.Results ?? res.result ?? res.list) as any[] | undefined;
    if (Array.isArray(items)) {
      return { items: items.map(this.normalizeOrder), total };
    }
    // Unknown shape: try to coerce
    const guess = Object.values(res).find(v => Array.isArray(v)) as any[] | undefined;
    const normalized = (guess ?? []).map(this.normalizeOrder);
    return { items: normalized, total: total || normalized.length };
  }

  private normalizeOrder = (raw: any): ApiOrder => {
    return {
      key: String(raw?.key ?? raw?.orderNumber ?? raw?.id ?? ''),
      displayName: String(raw?.displayName ?? raw?.displayText ?? raw?.name ?? raw?.orderNumber ?? ''),
      active: Boolean(raw?.active ?? raw?.isActive ?? true),
      creationDate: String(raw?.creationDate ?? raw?.createdAt ?? raw?.createDate ?? raw?.created ?? ''),
      changeDate: String(raw?.changeDate ?? raw?.updatedAt ?? raw?.updateDate ?? raw?.changed ?? raw?.lastModified ?? ''),
      ...raw
    } as ApiOrder;
  };
  
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
    // Sort by creation date descending (newest first)
    const sorted = [...this.orders].sort((a, b) => {
      const dateA = new Date(a.creationDate).getTime();
      const dateB = new Date(b.creationDate).getTime();
      return dateB - dateA; // Descending order
    });
    this.filteredOrders = sorted;
  }
  
  goBack(): void {
  this.router.navigate(['/order-management']);
  }

  refreshOrders(): void {
  this.loadAllOrders(this.page);
  }

  // No row actions requested for API summary list

  // Navigation actions to Order page
  goToOrder(order: ApiOrder, action?: 'details'|'results'|'status'|'transfer-values') {
    const queryParams: any = { orderNumber: order.key };
    if (action) queryParams.action = action;
  this.router.navigate(['/order-management'], { queryParams });
  }
  editOrder(order: ApiOrder): void {
    this.router.navigate(['/edit-order', order.key]);
  }
  viewOrder(order: ApiOrder): void {
    this.router.navigate(['/view-order'], { queryParams: { orderNumber: order.key } });
  }

  // Pagination helpers
  changePageSize(newSize: number) {
    this.pageSize = Number(newSize) || 10;
    this.page = 1;
    this.loadAllOrders(1);
  }
  hasPrev(): boolean { return this.page > 1; }
  hasNext(): boolean { return this.page * this.pageSize < this.total; }
  prevPage(): void { if (this.hasPrev()) this.loadAllOrders(this.page - 1); }
  nextPage(): void { if (this.hasNext()) this.loadAllOrders(this.page + 1); }
  totalPages(): number { return this.total > 0 ? Math.ceil(this.total / this.pageSize) : 0; }

  // Selection helpers
  selectOrder(order: ApiOrder) { this.selectedOrder = order; }
  isSelected(order: ApiOrder): boolean { return this.selectedOrder?.key === order.key; }
  
  // Check if selected order is in Running/Active state
  isOrderRunning(): boolean {
    if (!this.selectedOrder) return false;
    const status = this.orderStatuses[this.selectedOrder.key];
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s === 'active' || s === 'running' || s === 'inprogress' || s === 'in-progress' || s === 'pending';
  }

  // Inline action execution
  private recordAction(name: string, isError: boolean, res?: any, err?: any, status?: number) {
    this.lastAction = { name, isError, response: res, error: err, status, timestamp: new Date() };
    // Debug mirror
    this.debug.lastAction = {
      name,
      isError,
      status,
      response: res,
      error: err,
      time: new Date().toISOString()
    };
  }

  private doGet(endpoint: string, name: string) {
    if (!this.selectedOrder) return;
    this.actionLoading = true;
  const baseUrl = this.apiConfig.getBaseUrl();
  this.http.get(`${baseUrl}${endpoint}`).subscribe({
      next: (res) => { this.recordAction(name, false, res, undefined, 200); this.actionLoading = false; },
      error: (err) => { this.recordAction(name, true, undefined, err, err?.status); this.actionLoading = false; }
    });
  }
  private doPost(endpoint: string, name: string, body: any = {}) {
    if (!this.selectedOrder) return;
    this.actionLoading = true;
  const baseUrl = this.apiConfig.getBaseUrl();
  this.http.post(`${baseUrl}${endpoint}`, body).subscribe({
      next: (res) => { this.recordAction(name, false, res, undefined, 200); this.actionLoading = false; },
      error: (err) => { this.recordAction(name, true, undefined, err, err?.status); this.actionLoading = false; }
    });
  }

  runGetDetails() { if (this.selectedOrder) { this.router.navigate(['/view-order'], { queryParams: { orderNumber: this.selectedOrder.key } }); } }
  runGetResults() { if (this.selectedOrder) this.doGet(`/api/v1/order-processing/orders/${encodeURIComponent(this.selectedOrder.key)}/results`, 'Get Order Results'); }
  runGetTransferValues() { if (this.selectedOrder) this.doGet(`/api/v1/order-processing/orders/${encodeURIComponent(this.selectedOrder.key)}/transfer-values`, 'Get Transfer Values'); }

  runStartOrder() {
    if (!this.selectedOrder || !this.lineName?.trim()) return;
    this.doPost(`/api/v1/order-processing/lines/${encodeURIComponent(this.lineName.trim())}/orders/${encodeURIComponent(this.selectedOrder.key)}/start`, 'Start Order');
  }
  runInterruptOrder() {
    if (!this.selectedOrder || !this.lineName?.trim()) return;
    this.doPost(`/api/v1/order-processing/lines/${encodeURIComponent(this.lineName.trim())}/orders/${encodeURIComponent(this.selectedOrder.key)}/interrupt`, 'Interrupt Order');
  }
  runFinishOrder() {
    if (!this.selectedOrder || !this.lineName?.trim()) return;
    this.doPost(`/api/v1/order-processing/lines/${encodeURIComponent(this.lineName.trim())}/orders/${encodeURIComponent(this.selectedOrder.key)}/finish`, 'Finish Order');
  }
  runCancelOrder() {
    if (!this.selectedOrder || !this.lineName?.trim()) return;
    this.doPost(`/api/v1/order-processing/lines/${encodeURIComponent(this.lineName.trim())}/orders/${encodeURIComponent(this.selectedOrder.key)}/cancel`, 'Cancel Order');
  }

  deleteOrder(order: ApiOrder): void {
    if (!order?.key) return;
    
    if (!confirm(`Are you sure you want to delete order "${order.key}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    this.actionLoading = true;
    const baseUrl = this.apiConfig.getBaseUrl();
    const url = `${baseUrl}/extensions/api/Order-Processing/DeleteOrderByNumber/${encodeURIComponent(order.key)}`;
    
    this.http.delete(url).subscribe({
      next: (res) => {
        this.recordAction(`Delete Order ${order.key}`, false, res, undefined, 200);
        this.actionLoading = false;
        // Refresh the orders list
        this.loadAllOrders(this.page);
        // Clear selection if deleted order was selected
        if (this.selectedOrder?.key === order.key) {
          this.selectedOrder = null;
        }
      },
      error: (err) => {
        this.recordAction(`Delete Order ${order.key}`, true, undefined, err, err?.status);
        this.actionLoading = false;
      }
    });
  }

  showOrderResults(order: ApiOrder): void {
    if (!order?.key) return;
    this.doGet(`/api/v1/order-processing/orders/${encodeURIComponent(order.key)}/results`, `Get Order Results: ${order.key}`);
  }

  showOrderLog(order: ApiOrder): void {
    if (!order?.key) return;
    this.doGet(`/api/v1/order-processing/orders/${encodeURIComponent(order.key)}/status`, `Get Order Log: ${order.key}`);
  }

  // Navigation
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Debug helpers
  copyDebug(obj: any): void {
    try {
      const text = JSON.stringify(obj ?? {}, null, 2);
      if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
        (navigator as any).clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) {
      console.warn('Copy failed', e);
    }
  }

  clearDebug(kind: 'list' | 'status' | 'action'): void {
    if (kind === 'list') this.debug.listOrders = {};
    if (kind === 'status') this.debug.lastStatus = {};
    if (kind === 'action') this.debug.lastAction = {};
  }

  // Load status for each order in current list
  private loadStatusesForList() {
    this.orderStatuses = {};
    this.orderStatusLoading = {};
    this.orderStatusErrors = {};
    for (const o of this.orders) {
      this.fetchOrderStatus(o);
    }
  }

  private fetchOrderStatus(order: ApiOrder) {
    const key = order.key;
    this.orderStatusLoading[key] = true;
  const baseUrl = this.apiConfig.getBaseUrl();
  this.http.get<any>(`${baseUrl}/api/v1/order-processing/orders/${encodeURIComponent(key)}/status`).subscribe({
      next: (res) => {
        this.orderStatuses[key] = this.parseStatus(res);
        this.orderStatusLoading[key] = false;
        // Debug: capture last status lookup
        this.debug.lastStatus = {
          orderKey: key,
          response: res,
          parsedStatus: this.orderStatuses[key],
          time: new Date().toISOString()
        };
      },
      error: (err) => {
        this.orderStatusErrors[key] = err?.message || 'Error';
        this.orderStatusLoading[key] = false;
        // Debug: capture error
        this.debug.lastStatus = { orderKey: key, error: err, time: new Date().toISOString() };
      }
    });
  }

  private parseStatus(res: any): string {
    if (!res) return '-';
    // Try common fields
    const v = (res as any).status ?? (res as any).orderStatus ?? (res as any).State ?? (res as any).state ?? (res as any).Status;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    // If nested
    const data: any = (res as any).data;
    if (data && (data.status || data.orderStatus)) {
      return String(data.status ?? data.orderStatus);
    }
    // Fallback to JSON preview
    return JSON.stringify(res);
  }

  // Map raw status string to a CSS class for visual badges
  statusClass(raw: string | undefined | null): string {
    if (!raw) return 'status-unknown';
    const s = String(raw).toLowerCase();
    if (s.includes('error') || s.includes('fail')) return 'status-error';
    switch (s) {
      case 'proposed':
        return 'status-proposed';
      case 'active':
      case 'pending':
      case 'running':
      case 'inprogress':
      case 'in-progress':
        return 'status-pending';
      case 'finished':
        return 'status-finished';
      case 'finishedmanually':
      case 'finished-manually':
        return 'status-finished-manually';
      case 'interrupted':
        return 'status-interrupted';
      case 'canceled':
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  // Navigation methods
  navigateToCreateOrder(): void {
    this.router.navigate(['/create-order']);
  }

  openOrdersCleanupDialog(): void {
    this.showCleanupDialog = true;
    this.cleanupResult = null;
  }

  closeCleanupDialog(): void {
    this.showCleanupDialog = false;
    this.cleanupDateFrom = '';
    this.cleanupDateTo = '';
    this.cleanupStatus = null;
    this.cleanupResult = null;
  }

  async deleteOrdersInRange(): Promise<void> {
    if (!this.cleanupDateFrom || !this.cleanupDateTo) {
      this.cleanupResult = { success: false, message: 'Please provide both date fields' };
      return;
    }

    this.isCleanupLoading = true;
    this.cleanupResult = null;

    try {
      const baseUrl = this.apiConfig.getBaseUrl();
      const url = `${baseUrl}/api/v1/orders`;
      
      const params: any = {
        creationDateFrom: this.cleanupDateFrom,
        creationDateTo: this.cleanupDateTo
      };
      
      if (this.cleanupStatus !== null) {
        params.status = this.cleanupStatus;
      }

      const response = await this.http.delete(url, { params }).toPromise();
      this.cleanupResult = { 
        success: true, 
        message: 'Orders deleted successfully',
        deletedCount: (response as any)?.deletedCount || 0
      };
      
      // Refresh the orders list
      this.loadAllOrders(this.page);
    } catch (error: any) {
      console.error('Error deleting orders:', error);
      this.cleanupResult = { 
        success: false, 
        message: error?.error?.message || error?.message || 'Failed to delete orders'
      };
    } finally {
      this.isCleanupLoading = false;
    }
  }

}

