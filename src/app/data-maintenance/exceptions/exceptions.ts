import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'dm-exceptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="dm-card">
    <h2>⚠️ Article Exceptions</h2>
    <!-- Pagination placed above the article dropdown to avoid being covered by the menu -->
  <div class="row" style="display:flex; justify-content:flex-start; gap:8px; align-items:center; margin: 4px 0 8px;">
      <button class="btn btn-small" type="button" (click)="onPrevPage()" [disabled]="!canPrev">Prev</button>
      <span style="font-size:.85rem;">Page {{currentPage}}</span>
      <button class="btn btn-small" type="button" (click)="onNextPage()" [disabled]="!canNext">Next</button>
    </div>
    <div class="row" style="display:flex; gap:16px; flex-wrap:wrap;">
  <label style="min-width:320px;">
        <div class="form-label">Article Number</div>
        <select [ngModel]="articleNumber" (ngModelChange)="setArticleNumber($any($event))" [ngModelOptions]="{standalone: true}" style="min-width:260px;">
          <option value="">Select article…</option>
          <option *ngFor="let a of articleOptions" [value]="a.number">{{a.number}} — {{a.name}}</option>
        </select>
      </label>
      <div style="display:flex; align-items:center; gap:8px;">
        <label class="checkbox"><input type="checkbox" [checked]="allCustomers" (change)="toggleAllCustomers()" /> All Customers</label>
        <label *ngIf="!allCustomers">
          <div class="form-label">Customer Number</div>
          <input type="text" [value]="customerNumber" (input)="setCustomerNumber($any($event.target).value)" placeholder="e.g. CUST-001" />
        </label>
      </div>
    </div>

    <div class="row" style="display:flex; gap:16px; flex-wrap:wrap; margin-top:8px;">
      <label>
        <div class="form-label">Device System Name</div>
        <input type="text" [value]="deviceSystemName" (input)="setDeviceSystemName($any($event.target).value)" placeholder="e.g. Any" />
      </label>
      <label>
        <div class="form-label">Device Type</div>
        <select [value]="deviceSystemType" (change)="setDeviceSystemType($any($event.target).value)">
          <option value="allDevices">allDevices</option>
          <option value="device">device</option>
          <option value="deviceGroup">deviceGroup</option>
        </select>
      </label>
    </div>

    <div class="attributes" style="margin-top:12px;">
      <div class="form-label" style="margin-bottom:6px;">Attributes</div>
      <div *ngFor="let attr of attributes; let i = index" class="attr-row" style="display:flex; gap:8px; align-items:center; margin-bottom:6px; flex-wrap:wrap;">
  <select [value]="attr.attribute" (change)="setAttributeName(i, $any($event.target).value)" style="min-width:280px;">
          <option *ngFor="let opt of attributeOptions" [value]="opt">{{opt}}</option>
        </select>
  <input type="text" [value]="attr.value" (input)="setAttributeValue(i, $any($event.target).value)" placeholder="Value" style="min-width:240px;" />
        <button type="button" class="btn btn-secondary" (click)="removeAttribute(i)">Remove</button>
      </div>
      <button type="button" class="btn btn-secondary" (click)="addAttribute()">Add Attribute</button>
    </div>

    <div style="display:flex; gap:8px; align-items:center; margin-top:12px; flex-wrap:wrap;">
      <button class="btn btn-primary" (click)="onPutExceptions()" [disabled]="loading || !articleNumber">Add Exception</button>
      <span class="err" *ngIf="error">{{error}}</span>
    </div>

    <div class="dm-card" style="margin-top:12px;">
      <h3 style="margin-top:0;">Response</h3>
      <pre style="max-height:260px; overflow:auto; background:#f8fafc; border:1px solid #e3e9ef; border-radius:6px; padding:.5rem; font-size:.8rem;">
{{response | json}}
      </pre>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .dm-card { background:#fff; border-radius:12px; padding:1.25rem 1.5rem; border:1px solid #e2e8f0; box-shadow:0 8px 25px rgba(0,0,0,0.07); }
    :host-context(body.dark-theme) .dm-card { background:#1f1f1f; border-color:#2c2c2c; box-shadow:0 6px 18px rgba(0,0,0,.55); }
    .form-label { font-weight:600; margin-bottom:4px; display:block; }
    input, select { padding:6px 8px; border:1px solid #cfd7e3; border-radius:6px; min-height:32px; }
    .btn { background:#eef3f7; border:1px solid #d5dde4; padding:.45rem .8rem; border-radius:8px; cursor:pointer; }
    .btn-primary { background:#1976d2; color:#fff; border-color:#1976d2; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .err { color:#b91c1c; font-size:.85rem; }
  `]
})
export class ExceptionsComponent {
  @Input() articleNumber = '';
  @Input() setArticleNumber: (val: string) => void = () => {};
  @Input() articleOptions: Array<{ number: string; name: string }> = [];

  @Input() allCustomers = true;
  @Input() toggleAllCustomers: () => void = () => {};
  @Input() customerNumber = '';
  @Input() setCustomerNumber: (val: string) => void = () => {};

  @Input() deviceSystemName = '';
  @Input() deviceSystemType: 'allDevices' | 'device' | 'deviceGroup' = 'allDevices';
  @Input() setDeviceSystemName: (val: string) => void = () => {};
  @Input() setDeviceSystemType: (val: string) => void = () => {};

  @Input() attributes: Array<{ attribute: string; value: string }> = [];
  @Input() attributeOptions: string[] = [];
  @Input() addAttribute: () => void = () => {};
  @Input() removeAttribute: (i: number) => void = () => {};
  @Input() setAttributeName: (i: number, val: string) => void = () => {};
  @Input() setAttributeValue: (i: number, val: string) => void = () => {};

  @Input() onPutExceptions: () => void = () => {};
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() response: any = null;

  // Pagination (provided by container)
  @Input() onPrevPage: () => void = () => {};
  @Input() onNextPage: () => void = () => {};
  @Input() canPrev: boolean = false;
  @Input() canNext: boolean = true;
  @Input() currentPage: number = 1;
  // pageSize controls were removed from UI; keep inputs optional if needed in future
  @Input() pageSize: number = 10;
}
