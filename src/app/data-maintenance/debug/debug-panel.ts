import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dm-debug-panel',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display:block; }
    .debug-section { background:#fff; border-radius:12px; padding:1.25rem 1.25rem 1rem; box-shadow:0 6px 18px rgba(0,0,0,0.05); border:1px solid #e2e8f0; }
    .debug-header-bar { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .debug-header-bar h3 { font-size:1.05rem; display:flex; align-items:center; gap:.4rem; position:relative; padding-bottom:.4rem; margin:0; }
    .debug-header-bar h3:after { content:""; position:absolute; left:0; bottom:0; width:140px; height:3px; background:linear-gradient(90deg,#3498db,#1976d2); border-radius:2px; }
    .debug-tabs { display:flex; flex-wrap:wrap; gap:.35rem; margin-bottom:.75rem; }
    .debug-tab { font-size:.65rem; padding:.45rem .7rem; border-radius:6px; background:#eef3f7; border:1px solid #d5dde4; cursor:pointer; }
    .debug-tab.active { background:#1976d2; color:#fff; border-color:#1976d2; }
    .debug-panel { background:#f8fafc; border:1px solid #e3e9ef; border-radius:8px; padding:.75rem .85rem; margin-bottom:.6rem; }
    .debug-header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:.4rem; }
    .debug-header h4 { font-size:.8rem; margin:0; }
    .debug-header small { font-size:.6rem; color:#6b7280; }
    .debug-json { background:#1f2933; color:#e0e8ef; font-size:.7rem; line-height:1.3; border:1px solid #101820; border-radius:6px; padding:.5rem; overflow:auto; max-height:320px; }
    
    /* Dark theme overrides when body has dark-theme */
    :host-context(body.dark-theme) .debug-section { background:#1f252c; border-color:#303841; box-shadow:0 4px 16px rgba(0,0,0,.55); }
    :host-context(body.dark-theme) .debug-header-bar h3 { color:#cdd5dd; }
    :host-context(body.dark-theme) .debug-tab { background:#2a3036; border-color:#3a434d; color:#9aa4b1; }
    :host-context(body.dark-theme) .debug-tab.active { background:#1976d2; border-color:#1976d2; color:#fff; }
    :host-context(body.dark-theme) .debug-panel { background:#262d34; border-color:#373f48; }
    :host-context(body.dark-theme) .debug-json { background:#10161b; color:#b9c3cc; border-color:#22303b; }
  `],
  template: `
  <section class="debug-section" [style.background]="isDarkMode ? '#1f252c' : null" [style.border-color]="isDarkMode ? '#303841' : null">
    <div class="debug-header-bar">
      <h3 [style.color]="isDarkMode ? '#ffffff' : null">🔧 API Response Debug</h3>
      <div class="debug-global-actions">
        <button type="button" class="debug-tab" (click)="toggleCollapsed.emit()"
                [style.background]="isDarkMode ? '#2a3036' : null"
                [style.border-color]="isDarkMode ? '#3a434d' : null" 
                [style.color]="isDarkMode ? '#9aa4b1' : null">
          {{ jsonCollapsed ? 'Expand All' : 'Collapse All' }}
        </button>
      </div>
    </div>
    <div class="debug-container">
      <div class="debug-tabs">
  <!-- Orders tabs -->
  <button *ngIf="currentSubPage==='orders'" type="button" class="debug-tab"
    [class.active]="activeTab === 'ordersList'"
    (click)="activeTabChange.emit('ordersList')">List Orders</button>
  <button *ngIf="currentSubPage==='orders'" type="button" class="debug-tab"
    [class.active]="activeTab === 'orderStatus'"
    (click)="activeTabChange.emit('orderStatus')">Order Status</button>
  <button *ngIf="currentSubPage==='orders'" type="button" class="debug-tab"
    [class.active]="activeTab === 'ordersAction'"
    (click)="activeTabChange.emit('ordersAction')">Last Action</button>

        <button *ngIf="currentSubPage==='customers'" type="button" class="debug-tab"
                [class.active]="activeTab === 'createCustomer'"
                (click)="activeTabChange.emit('createCustomer')">Create Customer</button>

        <button *ngIf="currentSubPage==='articles'" type="button" class="debug-tab"
                [class.active]="activeTab === 'listArticles'"
                (click)="activeTabChange.emit('listArticles')">Get All Articles</button>
  <button *ngIf="currentSubPage==='articles'" type="button" class="debug-tab"
    [class.active]="activeTab === 'createArticle'"
    (click)="activeTabChange.emit('createArticle')">Create Article (POST)</button>
        <button *ngIf="currentSubPage==='articles'" type="button" class="debug-tab"
                [class.active]="activeTab === 'updateArticle'"
                (click)="activeTabChange.emit('updateArticle')">Edit Article (PATCH)</button>
        <button *ngIf="currentSubPage==='articles'" type="button" class="debug-tab"
                [class.active]="activeTab === 'deleteArticle'"
                (click)="activeTabChange.emit('deleteArticle')">Delete Article</button>
  <button *ngIf="currentSubPage==='articles'" type="button" class="debug-tab"
    [class.active]="activeTab === 'import'"
    (click)="activeTabChange.emit('import')">CSV Import</button>

        <button *ngIf="currentSubPage==='static-texts'" type="button" class="debug-tab"
                [class.active]="activeTab === 'stList'"
                (click)="activeTabChange.emit('stList')">Get All Static Texts</button>
        <button *ngIf="currentSubPage==='static-texts'" type="button" class="debug-tab"
                [class.active]="activeTab === 'stCreateOrUpdate'"
                (click)="activeTabChange.emit('stCreateOrUpdate')">Create/Update Static Text</button>

        <button *ngIf="currentSubPage==='devices'" type="button" class="debug-tab"
                [class.active]="activeTab === 'devicesList'"
                (click)="activeTabChange.emit('devicesList')">Get Devices</button>
        <button *ngIf="currentSubPage==='devices'" type="button" class="debug-tab"
                [class.active]="activeTab === 'productionLinesList'"
                (click)="activeTabChange.emit('productionLinesList')">Get Production Lines</button>

  <button *ngIf="currentSubPage==='device-parameters'" type="button" class="debug-tab"
    [class.active]="activeTab === 'amparImport'"
    (click)="activeTabChange.emit('amparImport')">AMPAR Import</button>

  <button *ngIf="currentSubPage==='label-parameters'" type="button" class="debug-tab"
    [class.active]="activeTab === 'lparImport'"
    (click)="activeTabChange.emit('lparImport')">LPAR Import</button>

  <button *ngIf="currentSubPage==='exceptions'" type="button" class="debug-tab"
    [class.active]="activeTab === 'exPut'"
    (click)="activeTabChange.emit('exPut')">PUT Exception</button>
      </div>

      <div class="debug-content" [class.collapsed]="jsonCollapsed">
        <!-- Orders panels -->
    <div *ngIf="activeTab === 'ordersList' && currentSubPage==='orders'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">List Orders</h4>
      <small [style.color]="isDarkMode ? '#9aa4b1' : null">GET /extensions/api/Order-Processing/GetAllOrders</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.ordersList | json}}</pre>
        </div>
    <div *ngIf="activeTab === 'orderStatus' && currentSubPage==='orders'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Order Status</h4>
      <small [style.color]="isDarkMode ? '#9aa4b1' : null">GET /api/v1/order-processing/orders/:key/status</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.orderStatus | json}}</pre>
        </div>
    <div *ngIf="activeTab === 'ordersAction' && currentSubPage==='orders'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Last Action</h4>
      <small [style.color]="isDarkMode ? '#9aa4b1' : null">POST /api/v1/order-processing/lines/:line/orders/:key/…</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.ordersAction | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'createCustomer' && currentSubPage==='customers'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Create Customer</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">POST request details</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.createCustomer | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'listArticles' && currentSubPage==='articles'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Get All Articles</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">GET request details</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.listArticles | json}}</pre>
        </div>
        <div *ngIf="activeTab === 'updateArticle' && currentSubPage==='articles'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Edit Article (PATCH)</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">PATCH request details</small></div>
       <div *ngIf="!jsonCollapsed">
        <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">PATCH Request</h4></div>
        <pre class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
          [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.updateArticle | json}}</pre>
        <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Response</h4></div>
        <pre class="debug-json"
          [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
          [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.updateArticleResponse | json}}</pre>
       </div>
        </div>
        <div *ngIf="activeTab === 'deleteArticle' && currentSubPage==='articles'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Delete Article</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">DELETE request details</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.deleteArticle | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'stList' && currentSubPage==='static-texts'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Get All Static Texts</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">GET request details</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.stList | json}}</pre>
        </div>
        <div *ngIf="activeTab === 'stCreateOrUpdate' && currentSubPage==='static-texts'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Create/Update Static Text</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">POST request details</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.stCreateOrUpdate | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'createArticle' && currentSubPage==='articles'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Create Article (POST)</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">POST request details</small></div>
          <div *ngIf="!jsonCollapsed">
            <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">POST Request</h4></div>
            <pre class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.createArticle | json}}</pre>
            <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Response</h4></div>
            <pre class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.createArticleResponse | json}}</pre>
          </div>
        </div>

        <div *ngIf="activeTab === 'import' && currentSubPage==='articles'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">CSV Import (Articles)</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">Parse → Map → Run</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.csvImport | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'devicesList' && currentSubPage==='devices'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Get Devices</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">GET /api/v1/devices</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.devicesList | json}}</pre>
        </div>
        <div *ngIf="activeTab === 'productionLinesList' && currentSubPage==='devices'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">Get Production Lines</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">GET /api/v1/production-lines</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.productionLinesList | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'amparImport' && currentSubPage==='device-parameters'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">AMPAR Import</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">POST /extensions/api/DeviceParameters/WriteAutoLabelerParameterAsync</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.amparImport | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'lparImport' && currentSubPage==='label-parameters'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">LPAR Import</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">POST /extensions/api/DeviceParameters/WriteLabelParameterAsync</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.lparImport | json}}</pre>
        </div>

        <div *ngIf="activeTab === 'exPut' && currentSubPage==='exceptions'" class="debug-panel"
             [style.background]="isDarkMode ? '#262d34' : null" [style.border-color]="isDarkMode ? '#373f48' : null">
          <div class="debug-header"><h4 [style.color]="isDarkMode ? '#ffffff' : null">PUT Exception</h4>
            <small [style.color]="isDarkMode ? '#9aa4b1' : null">PUT /api/v1/article-exceptions/articleNumber/:articleNumber</small></div>
          <pre *ngIf="!jsonCollapsed" class="debug-json"
               [style.background]="isDarkMode ? '#10161b' : null" [style.color]="isDarkMode ? '#b9c3cc' : null"
               [style.border-color]="isDarkMode ? '#22303b' : null">{{data?.exPut | json}}</pre>
        </div>
      </div>
    </div>
  </section>
  `
})
export class DebugPanelComponent {
  @Input() isDarkMode = false;
  @Input() jsonCollapsed = true;
  @Output() toggleCollapsed = new EventEmitter<void>();

  @Input() activeTab = '';
  @Output() activeTabChange = new EventEmitter<string>();

  @Input() data: any;
  @Input() currentSubPage: string = 'articles';
}
