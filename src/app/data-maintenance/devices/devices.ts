import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dm-devices',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="dm-card">
    <h2>🖥️ Devices & Production Lines</h2>
    <div class="row" style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
      <div style="min-width:280px;">
        <label class="form-label">Devices</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <select [disabled]="devicesLoading" style="min-width:240px;">
            <option *ngIf="devicesLoading" disabled>Loading…</option>
            <option *ngIf="!devicesLoading && (devices?.length||0)===0" disabled>No devices</option>
            <option *ngFor="let d of devices" [value]="d.id || d.deviceId || d.name">{{ d.name || d.displayName || d.id || d.deviceId }}</option>
          </select>
          <button class="btn btn-secondary" (click)="onReloadDevices()" [disabled]="devicesLoading">Reload</button>
        </div>
        <div class="err" *ngIf="devicesError">{{ devicesError }}</div>
      </div>
      <div style="min-width:280px;">
        <label class="form-label">Production Lines</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <select [disabled]="productionLinesLoading" style="min-width:240px;">
            <option *ngIf="productionLinesLoading" disabled>Loading…</option>
            <option *ngIf="!productionLinesLoading && (productionLines?.length||0)===0" disabled>No production lines</option>
            <option *ngFor="let p of productionLines" [value]="p.id || p.productionLineId || p.name">{{ p.name || p.displayName || p.id || p.productionLineId }}</option>
          </select>
          <button class="btn btn-secondary" (click)="onReloadProductionLines()" [disabled]="productionLinesLoading">Reload</button>
        </div>
        <div class="err" *ngIf="productionLinesError">{{ productionLinesError }}</div>
      </div>
    </div>
  </div>
  `
  ,
  styles: [`
    :host { display:block; }
    .dm-card { background:#fff; border-radius:12px; padding:1.25rem 1.5rem; border:1px solid #e2e8f0; box-shadow:0 8px 25px rgba(0,0,0,0.07); }
    :host-context(body.dark-theme) .dm-card { background:#1f1f1f; border-color:#2c2c2c; box-shadow:0 6px 18px rgba(0,0,0,.55); }
  `]
})
export class DevicesComponent {
  @Input() devices: any[] = [];
  @Input() devicesLoading = false;
  @Input() devicesError?: string;
  @Input() productionLines: any[] = [];
  @Input() productionLinesLoading = false;
  @Input() productionLinesError?: string;
  @Input() onReloadDevices: () => void = () => {};
  @Input() onReloadProductionLines: () => void = () => {};
}
