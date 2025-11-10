import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dm-articles-table',
  standalone: true,
  imports: [CommonModule],
  template: `
  <table class="articles-table resizable-columns">
    <thead>
      <tr>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Article Number</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Name</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Unit Price</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Tare</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Labeling Mode</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Label Param #</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Shelf Life 1</th>
        <th [style.color]="isDarkMode ? '#ffffff' : null">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let article of articles" class="article-row" 
          [class.inactive-row]="!article.active"
          [style.background]="!article.active && isDarkMode ? '#181d23' : null"
          [style.opacity]="!article.active && isDarkMode ? '0.85' : null">
        <td class="article-number" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.number }}</td>
        <td class="article-name" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.name || '-' }}</td>
        <td class="unit-price" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.articlePLU.unitPriceValue }} {{ article.gxPriceCurrencyCode || 'USD' }}</td>
        <td class="tare" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.articlePLU.tareWeightValue }} {{ article.weightUnit }}</td>
        <td class="labeling-mode" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.articlePLU.labelingMode || '-' }}</td>
        <td class="label-param" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.articlePLU.labelParameter }}</td>
        <td class="shelf-life" [style.color]="!article.active && isDarkMode ? '#b8c2cc' : null">{{ article.articlePLU.shelfLifeDays1 }}</td>
        <td class="actions">
          <button class="btn btn-small btn-icon btn-edit" (click)="edit.emit(article)" [disabled]="!canEdit" title="Edit Article" aria-label="Edit Article">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="btn btn-small btn-icon btn-copy" (click)="copy.emit(article)" [disabled]="!canEdit" title="Copy Article" aria-label="Copy Article">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
          <button class="btn btn-small btn-icon btn-delete" (click)="delete.emit(article)" [disabled]="!canEdit" title="Delete Article" aria-label="Delete Article">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </td>
      </tr>
      <tr *ngIf="articles?.length === 0" class="no-data">
        <td colspan="8">
          <div class="no-data-message">
            <i class="icon-info"></i>
            <span>No articles found. Try adjusting your search criteria or create a new article.</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  `
  ,
  styles: [`
    :host { display:block; }
    table.articles-table { width:100%; border-collapse:collapse; }
    table.articles-table thead { background:#f5f5f5; border-bottom:2px solid #e0e0e0; }
    table.articles-table thead th { padding:16px 12px; text-align:left; font-weight:600; color:#424242; font-size:.9rem; white-space:nowrap; }
    table.articles-table tbody td { padding:14px 12px; font-size:.9rem; vertical-align: middle; }
    .article-row { border-bottom:1px solid #e0e0e0; transition: background-color .2s; }
    .article-row:hover { background:#f8f9fa; }
    .article-row.inactive-row { background:#fafafa; opacity:.55; }
    .article-number { font-weight:600; color:#1976d2; }
    .article-name { font-weight:500; }
    .article-description { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .unit-price { white-space: nowrap; }
    .labeling-mode { text-transform: capitalize; font-size: .7rem; letter-spacing: .5px; opacity:.85; }
    .actions { display:flex; gap:8px; justify-content:flex-end; }

    /* Icon buttons */
    .btn-icon { display:inline-flex; align-items:center; justify-content:center; padding:6px 8px; border-radius:6px; background:#eef1f5; border:1px solid #d0d5dc; color:#394b5a; transition: background .15s, border-color .15s, transform .15s; line-height:1; font-size:.85rem; }
    .btn-icon svg { width:16px; height:16px; fill: currentColor; display:block; }
    .btn-icon:hover:not(:disabled) { background:#e2e7ed; }
    .btn-icon:active:not(:disabled) { transform: translateY(1px); }
    .btn-icon:disabled { opacity:.4; cursor: not-allowed; }
    .btn-edit { color:#1565c0; }
    .btn-edit:hover:not(:disabled){ background:#e3f2fd; border-color:#90caf9; }
    .btn-copy { color:#6d5e9c; }
    .btn-copy:hover:not(:disabled){ background:#efe9fb; border-color:#c7b7eb; }
    .btn-delete { color:#c62828; }
    .btn-delete:hover:not(:disabled){ background:#fdecea; border-color:#f5b5ae; }

    /* Dark mode tweaks */
    :host-context(body.dark-theme) table.articles-table thead th { background:#1f252b; color:#ffffff; border-bottom:2px solid #2f3842; }
    :host-context(body.dark-theme) table.articles-table tbody td { color:#e0e0e0; }
    :host-context(body.dark-theme) .article-row:hover { background:#262e36; }
    :host-context(body.dark-theme) .article-row.inactive-row { background:#181d23 !important; opacity:.85 !important; }
    :host-context(body.dark-theme) .article-row.inactive-row td { color:#b8c2cc !important; }
    :host-context(body.dark-theme) .btn-icon { background:#2a3036; border-color:#3a434d; color:#d0d6dc; }
    :host-context(body.dark-theme) .btn-icon:hover:not(:disabled){ background:#343c45; }
    :host-context(body.dark-theme) .btn-edit:hover:not(:disabled){ background:#18324a; border-color:#1e5d91; }
    :host-context(body.dark-theme) .btn-delete:hover:not(:disabled){ background:#4a1f24; border-color:#7a2e36; }
  `]
})
export class ArticlesTableComponent {
  @Input() isDarkMode = false;
  @Input() articles: any[] = [];
  @Input() canEdit = true;
  @Output() edit = new EventEmitter<any>();
  @Output() copy = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
}
