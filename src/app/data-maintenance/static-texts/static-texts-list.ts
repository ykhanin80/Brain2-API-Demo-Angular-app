import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dm-static-texts-list',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="dm-card" style="margin-top:16px;">
    <div class="table-header" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <h3 style="margin:0;">Existing Static Texts</h3>
      <div style="display:flex; align-items:center; gap:8px;">
        <label style="font-size:12px;">Filter #</label>
  <input type="text" [value]="filterNumber" (input)="setFilterNumber.emit($any($event.target).value)" placeholder="e.g. 1001" style="width:90px;" />
        <label style="font-size:12px;">Page size</label>
  <select [value]="pageSize" (change)="changePageSize.emit(+$any($event.target).value)">
          <option [value]="10">10</option>
          <option [value]="20">20</option>
          <option [value]="50">50</option>
        </select>
        <button class="btn btn-secondary" (click)="reload.emit()" title="Reload list">
          <i class="icon-refresh"></i>
          Refresh
        </button>
      </div>
    </div>

    <div *ngIf="listLoading" class="loading" style="padding:8px 0;">
      <div class="spinner"></div>
      <span>Loading static texts...</span>
    </div>
    <div *ngIf="listError" class="error-message" style="margin:8px 0;">
      <i class="icon-alert"></i>
      {{ listError }}
    </div>

    <div class="table-container" *ngIf="!listLoading">
      <table class="articles-table resizable-columns">
        <thead>
          <tr>
            <th>
              <button class="linklike" (click)="toggleSortDir.emit()" title="Sort by number">
                Number
                <span class="sort-ind" [attr.aria-label]="sortDir==='asc' ? 'ascending' : 'descending'">
                  {{ sortDir==='asc' ? '▲' : '▼' }}
                </span>
              </button>
            </th>
            <th>Description</th>
            <th>Items</th>
            <th *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]">Text {{ i }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let it of viewItems">
            <td>{{ it.number }}</td>
            <td>{{ it.description || '-' }}</td>
            <td>{{ (it.items?.length || 0) }}</td>
            <td *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]">{{ getItemText(it, i) }}</td>
            <td class="actions">
              <button class="btn btn-small btn-icon btn-edit" (click)="editRow.emit(it)" [disabled]="!canEdit" title="Edit Static Text">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </button>
            </td>
          </tr>
          <tr *ngIf="viewItems?.length === 0">
            <td colspan="14">No static texts found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" style="margin-top:8px; display:flex; align-items:center; gap:10px;">
      <button class="btn btn-secondary" (click)="prevPage.emit()" [disabled]="!hasPrev">Prev</button>
      <span>Page {{ page }}<ng-container *ngIf="totalPages"> / {{ totalPages }}</ng-container></span>
      <button class="btn btn-secondary" (click)="nextPage.emit()" [disabled]="!hasNext">Next</button>
      <span class="record-count" *ngIf="total !== undefined">Total: {{ total }}</span>
    </div>
  </div>
  `
  ,
  styles: [`
    :host { display:block; }
    .table-container { background:#fff; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; }
    table.articles-table { width:100%; border-collapse:collapse; }
    table.articles-table thead { background:#f5f5f5; border-bottom:2px solid #e0e0e0; }
    table.articles-table thead th { padding:12px; text-align:left; font-weight:600; color:#424242; font-size:.9rem; white-space:nowrap; }
    table.articles-table tbody td { padding:10px 12px; font-size:.9rem; vertical-align: middle; }
    .actions { display:flex; gap:8px; justify-content:flex-end; }
    .btn-icon { display:inline-flex; align-items:center; justify-content:center; padding:6px 8px; border-radius:6px; background:#eef1f5; border:1px solid #d0d5dc; color:#394b5a; transition: background .15s, border-color .15s, transform .15s; line-height:1; font-size:.85rem; }
    .btn-icon svg { width:16px; height:16px; fill: currentColor; display:block; }
    .btn-icon:hover:not(:disabled) { background:#e2e7ed; }
    .btn-icon:active:not(:disabled) { transform: translateY(1px); }
    .btn-edit { color:#1565c0; }
    .btn-edit:hover:not(:disabled){ background:#e3f2fd; border-color:#90caf9; }
    :host-context(body.dark-theme) .table-container { background:#1f1f1f; border-color:#2c2c2c; }
    :host-context(body.dark-theme) table.articles-table thead th { background:#1f252b; color:#ffffff; border-bottom:2px solid #2f3842; }
    :host-context(body.dark-theme) table.articles-table tbody td { color:#e0e0e0; }
    :host-context(body.dark-theme) .btn-icon { background:#2a3036; border-color:#3a434d; color:#d0d6dc; }
    :host-context(body.dark-theme) .btn-icon:hover:not(:disabled){ background:#343c45; }
  `]
})
export class StaticTextsListComponent {
  @Input() listLoading = false;
  @Input() listError?: string;
  @Input() filterNumber = '';
  @Input() pageSize = 10;
  @Input() page = 1;
  @Input() total?: number;
  @Input() totalPages?: number;
  @Input() hasPrev = false;
  @Input() hasNext = false;
  @Input() canEdit = true;
  @Input() sortDir: 'asc'|'desc' = 'asc';
  @Input() viewItems: any[] = [];
  @Input() getItemText: (row:any, n:number)=>string = () => '';

  @Output() setFilterNumber = new EventEmitter<string>();
  @Output() changePageSize = new EventEmitter<number>();
  @Output() reload = new EventEmitter<void>();
  @Output() toggleSortDir = new EventEmitter<void>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() editRow = new EventEmitter<any>();
}
