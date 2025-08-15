import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, JsonPipe } from '@angular/common';

interface Quantity {
  value: number;
  decimalPlaces: number;
  unit: string;
  type: string;
}

interface TransferValue {
  deviceType: string;
  name: string;
  value: string;
}

interface OrderModificationData {
  orderNumber: string;
  displayText: string;
  customerNumber: string;
  articleNumber: string;
  orderQuantity: Quantity;
  boxQuantity: Quantity;
  palletQuantity: Quantity;
  transferValues: TransferValue[];
  commonText1: string;
  commonText2: string;
  commonNumber1: number;
  commonNumber2: number;
}

@Component({
  selector: 'app-edit-order',
  imports: [CommonModule, FormsModule, JsonPipe],
  templateUrl: './edit-order.html',
  styleUrl: './edit-order.scss'
})
export class EditOrder implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly baseUrl = 'http://localhost:9997';

  orderNumber = '';
  originalOrderData: any = null;
  private originalTransferValuesSnapshot = '[]';

  orderData: OrderModificationData = {
    orderNumber: '',
    displayText: '',
    customerNumber: '',
    articleNumber: '',
    orderQuantity: { value: 0, decimalPlaces: 0, unit: 'pcs', type: '8' },
    boxQuantity: { value: 0, decimalPlaces: 0, unit: 'pcs', type: '1' },
    palletQuantity: { value: 0, decimalPlaces: 0, unit: 'pcs', type: '8' },
    transferValues: [],
    commonText1: '',
    commonText2: '',
    commonNumber1: 0,
    commonNumber2: 0
  };

  // UI state
  isLoading = false;
  isLoadingOrder = false;
  hasOrderChanges = false;
  hasTransferValueChanges = false;
  modificationResponse: any = null;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const orderNum = params.get('orderNumber');
      if (orderNum) {
        this.orderNumber = orderNum;
        this.loadOrderData();
      }
    });
  }

  loadOrderData(): void {
    if (!this.orderNumber.trim()) return;
    this.isLoadingOrder = true;
    this.errorMessage = '';

    const url = `${this.baseUrl}/api/v1/order-processing/orders/${this.orderNumber}`;
    this.http.get(url).subscribe({
      next: (resp: any) => {
        this.isLoadingOrder = false;
        this.originalOrderData = resp;
        this.populateFormData(resp);
      },
      error: err => {
        this.isLoadingOrder = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  private populateFormData(data: any): void {
    this.orderData = {
      orderNumber: data.orderNumber || this.orderNumber,
      displayText: data.text || data.displayText || '',
      customerNumber: data.customerNumber || '',
      articleNumber: data.articleNumber || '',
      orderQuantity: {
        value: data.orderQuantity?.value ?? 0,
        decimalPlaces: data.orderQuantity?.decimalPlaces ?? 0,
        unit: data.orderQuantity?.unit || 'pcs',
        type: data.orderQuantity?.type || '8'
      },
      boxQuantity: {
        value: data.boxQuantity?.value ?? 0,
        decimalPlaces: data.boxQuantity?.decimalPlaces ?? 0,
        unit: data.boxQuantity?.unit || 'pcs',
        type: data.boxQuantity?.type || '1'
      },
      palletQuantity: {
        value: data.palletQuantity?.value ?? 0,
        decimalPlaces: data.palletQuantity?.decimalPlaces ?? 0,
        unit: data.palletQuantity?.unit || 'pcs',
        type: data.palletQuantity?.type || '8'
      },
      transferValues: (data.transferValues || []).map((tv: any) => ({
        deviceType: tv.deviceType || '',
        name: tv.name || '',
        value: tv.value || ''
      })),
      commonText1: data.commonText1 || '',
      commonText2: data.commonText2 || '',
      commonNumber1: data.commonNumber1 ?? 0,
      commonNumber2: data.commonNumber2 ?? 0
    };

    // Snapshots for change detection
    this.originalTransferValuesSnapshot = JSON.stringify(this.orderData.transferValues);
    this.hasOrderChanges = false;
    this.hasTransferValueChanges = false;
  }

  // ---------- Change detection ----------
  onOrderFieldChange(): void { this.hasOrderChanges = this.detectOrderFieldChanges(); }
  onTransferValueChange(): void { this.updateTransferValueChangeState(); }

  private detectOrderFieldChanges(): boolean {
    if (!this.originalOrderData) return false;
    const o = this.originalOrderData;
    const c = this.orderData;
    // text / displayText
    if (c.displayText !== (o.text || o.displayText || '')) return true;
    if (c.customerNumber !== (o.customerNumber || '')) return true;
    if (c.articleNumber !== (o.articleNumber || '')) return true;
    // orderQuantity full set
    if (c.orderQuantity.value !== (o.orderQuantity?.value ?? 0)) return true;
    if (c.orderQuantity.decimalPlaces !== (o.orderQuantity?.decimalPlaces ?? 0)) return true;
    if (c.orderQuantity.unit !== (o.orderQuantity?.unit || 'pcs')) return true;
    if (c.orderQuantity.type !== (o.orderQuantity?.type || '8')) return true;
    // boxQuantity
    if (c.boxQuantity.value !== (o.boxQuantity?.value ?? 0)) return true;
    if (c.boxQuantity.decimalPlaces !== (o.boxQuantity?.decimalPlaces ?? 0)) return true;
    if (c.boxQuantity.unit !== (o.boxQuantity?.unit || 'pcs')) return true;
    if (c.boxQuantity.type !== (o.boxQuantity?.type || '1')) return true;
    // palletQuantity
    if (c.palletQuantity.value !== (o.palletQuantity?.value ?? 0)) return true;
    if (c.palletQuantity.decimalPlaces !== (o.palletQuantity?.decimalPlaces ?? 0)) return true;
    if (c.palletQuantity.unit !== (o.palletQuantity?.unit || 'pcs')) return true;
    if (c.palletQuantity.type !== (o.palletQuantity?.type || '8')) return true;
    if (c.commonText1 !== (o.commonText1 || '')) return true;
    if (c.commonText2 !== (o.commonText2 || '')) return true;
    if (c.commonNumber1 !== (o.commonNumber1 ?? 0)) return true;
    if (c.commonNumber2 !== (o.commonNumber2 ?? 0)) return true;
    return false;
  }

  private updateTransferValueChangeState(): void {
    const current = JSON.stringify(this.orderData.transferValues);
    this.hasTransferValueChanges = current !== this.originalTransferValuesSnapshot;
  }

  // ---------- Order fields save (PATCH) ----------
  saveOrderFields(): void {
    if (!this.hasOrderChanges || !this.originalOrderData) return;
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    const payload = this.buildPatchPayload();
    if (payload.length === 0) { this.isLoading = false; return; }
    const url = `${this.baseUrl}/api/v1/order-processing/orders/${this.orderNumber}`;
    this.http.patch(url, payload, { headers: { 'Content-Type': 'application/json-patch+json' } }).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        this.successMessage = 'Order fields saved';
        this.modificationResponse = { operation: 'PATCH', method: 'PATCH', timestamp: new Date(), isError: false, response: resp };
        // Apply changes optimistically to original snapshot
        payload.forEach(op => {
          if (op.op === 'replace') {
            const parts = op.path.split('/').filter((p: string) => p);
            if (parts.length === 1) {
              this.originalOrderData[parts[0]] = op.value;
            } else if (parts.length === 2) {
              this.originalOrderData[parts[0]] = this.originalOrderData[parts[0]] || {};
              this.originalOrderData[parts[0]][parts[1]] = op.value;
            }
          }
        });
        this.hasOrderChanges = false;
        // Re-fetch from server to ensure UI shows persisted data
        this.loadOrderData();
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.modificationResponse = { operation: 'PATCH', method: 'PATCH', timestamp: new Date(), isError: true, errorStatus: err.status, response: err.error };
      }
    });
  }

  private buildPatchPayload(): any[] {
    const ops: any[] = [];
    if (!this.originalOrderData) return ops;
    const o = this.originalOrderData;
    const c = this.orderData;
    const textPath = Object.prototype.hasOwnProperty.call(o, 'text') ? '/text' : '/displayText';
    const addReplace = (cond: boolean, path: string, value: any) => { if (cond) ops.push({ op: 'replace', path, value }); };
    addReplace(c.displayText !== (o.text || o.displayText || ''), textPath, c.displayText);
    addReplace(c.customerNumber !== (o.customerNumber || ''), '/customerNumber', c.customerNumber);
    addReplace(c.articleNumber !== (o.articleNumber || ''), '/articleNumber', c.articleNumber);
    // orderQuantity sub-fields
    addReplace(c.orderQuantity.value !== (o.orderQuantity?.value ?? 0), '/orderQuantity/value', c.orderQuantity.value);
    addReplace(c.orderQuantity.decimalPlaces !== (o.orderQuantity?.decimalPlaces ?? 0), '/orderQuantity/decimalPlaces', c.orderQuantity.decimalPlaces);
    addReplace(c.orderQuantity.unit !== (o.orderQuantity?.unit || 'pcs'), '/orderQuantity/unit', c.orderQuantity.unit);
    addReplace(c.orderQuantity.type !== (o.orderQuantity?.type || '8'), '/orderQuantity/type', c.orderQuantity.type);
    // boxQuantity sub-fields
    addReplace(c.boxQuantity.value !== (o.boxQuantity?.value ?? 0), '/boxQuantity/value', c.boxQuantity.value);
    addReplace(c.boxQuantity.decimalPlaces !== (o.boxQuantity?.decimalPlaces ?? 0), '/boxQuantity/decimalPlaces', c.boxQuantity.decimalPlaces);
    addReplace(c.boxQuantity.unit !== (o.boxQuantity?.unit || 'pcs'), '/boxQuantity/unit', c.boxQuantity.unit);
    addReplace(c.boxQuantity.type !== (o.boxQuantity?.type || '1'), '/boxQuantity/type', c.boxQuantity.type);
    // palletQuantity sub-fields
    addReplace(c.palletQuantity.value !== (o.palletQuantity?.value ?? 0), '/palletQuantity/value', c.palletQuantity.value);
    addReplace(c.palletQuantity.decimalPlaces !== (o.palletQuantity?.decimalPlaces ?? 0), '/palletQuantity/decimalPlaces', c.palletQuantity.decimalPlaces);
    addReplace(c.palletQuantity.unit !== (o.palletQuantity?.unit || 'pcs'), '/palletQuantity/unit', c.palletQuantity.unit);
    addReplace(c.palletQuantity.type !== (o.palletQuantity?.type || '8'), '/palletQuantity/type', c.palletQuantity.type);
    addReplace(c.commonText1 !== (o.commonText1 || ''), '/commonText1', c.commonText1);
    addReplace(c.commonText2 !== (o.commonText2 || ''), '/commonText2', c.commonText2);
    addReplace(c.commonNumber1 !== (o.commonNumber1 ?? 0), '/commonNumber1', c.commonNumber1);
    addReplace(c.commonNumber2 !== (o.commonNumber2 ?? 0), '/commonNumber2', c.commonNumber2);
    return ops;
  }

  // ---------- Transfer values save (PUT) ----------
  saveTransferValues(): void {
    if (!this.hasTransferValueChanges) return;
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const url = `${this.baseUrl}/api/v1/order-processing/orders/${this.orderNumber}/transfer-values`;
    this.http.put(url, this.orderData.transferValues).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        this.successMessage = 'Transfer values saved';
        this.modificationResponse = { operation: 'PUT transfer-values', method: 'PUT', timestamp: new Date(), isError: false, response: resp };
        // Update baseline
        this.originalOrderData.transferValues = this.orderData.transferValues.map(tv => ({ ...tv }));
        this.originalTransferValuesSnapshot = JSON.stringify(this.originalOrderData.transferValues);
        this.hasTransferValueChanges = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.modificationResponse = { operation: 'PUT transfer-values', method: 'PUT', timestamp: new Date(), isError: true, errorStatus: err.status, response: err.error };
      }
    });
  }

  // ---------- Reset actions ----------
  resetOrderFields(): void {
    if (!this.originalOrderData) return;
    this.populateFormData(this.originalOrderData);
  }

  resetTransferValues(): void {
    this.orderData.transferValues = JSON.parse(this.originalTransferValuesSnapshot);
    this.hasTransferValueChanges = false;
  }

  // ---------- Transfer values row helpers ----------
  addTransferValue(): void {
    this.orderData.transferValues.push({ deviceType: '', name: '', value: '' });
    this.onTransferValueChange();
  }
  removeTransferValue(index: number): void {
    this.orderData.transferValues.splice(index, 1);
    this.onTransferValueChange();
  }

  // ---------- Misc UI helpers ----------
  goBack(): void { this.router.navigate(['/orders']); }
  clearResponse(): void { this.modificationResponse = null; this.successMessage = ''; this.errorMessage = ''; }
  formatTimestamp(ts: string): string { return new Date(ts).toLocaleString(); }

  private getErrorMessage(error: any): string {
    if (error?.status === 0) return 'Cannot reach server';
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    return 'Unknown error';
  }
}
