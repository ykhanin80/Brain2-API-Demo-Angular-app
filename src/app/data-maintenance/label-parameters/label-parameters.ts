import { Component, EventEmitter, Output, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../../api-config';
import { parseCsvFile, autoMapHeaders, enforceUniqueMapping, downloadCsv, runConcurrentQueue } from '../../shared/csv-import.util';

@Component({
  selector: 'dm-label-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './label-parameters.html',
  styleUrl: './label-parameters.scss'
})
export class LabelParametersComponent {
  @Output() debug = new EventEmitter<any>();
  @Input() canEdit: boolean = true; // Permission to edit device parameters

  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);

  importState: { open: boolean; step: 'select'|'mapping'|'preview'|'running'|'done' } = { open: false, step: 'select' };
  importHeaders: string[] = [];
  importMapping: { [csvHeader: string]: string } = {};
  importRawRows: any[] = [];
  importRows: any[] = [];
  importError: string | null = null;
  importing = false;
  importProgress: { processed:number; success:number; failed:number; percent:number; done:boolean } = { processed:0, success:0, failed:0, percent:0, done:false };

  // List state
  labelParams: any[] = [];
  labelParamsLoading = false;
  labelParamsError: string | null = null;
  // Devices & Groups (for resolving friendly names)
  devices: any[] = [];
  deviceGroups: any[] = [];
  private getDeviceId(d: any): string { return String(d?.systemId ?? d?.id ?? d?.deviceId ?? d?.guid ?? d?.number ?? ''); }
  private getDeviceName(d: any): string { return String(d?.name ?? d?.displayName ?? d?.description ?? this.getDeviceId(d)); }
  private getGroupId(g: any): string { return String(g?.id ?? g?.groupId ?? g?.deviceGroupId ?? g?.deviceGroupNumber ?? g?.number ?? ''); }
  private getGroupName(g: any): string { return String(g?.name ?? g?.groupName ?? g?.deviceGroupName ?? g?.displayName ?? g?.description ?? this.getGroupId(g)); }

  ngOnInit() { this.loadLabelParams(); this.ensureDevicesAndGroupsLoaded(); }
  private baseUrl(): string { return this.apiConfig.getBaseUrl(); }
  private async ensureDevicesAndGroupsLoaded(): Promise<void> {
    const tasks: Promise<any>[] = [];
    if (!this.devices?.length) tasks.push(this.http.get<any>(`${this.baseUrl()}/api/v1/devices`).toPromise().then((r:any)=>{ const items=Array.isArray(r)?r:(r?.items||r?.data||[]); this.devices=Array.isArray(items)?items:[]; }));
    if (!this.deviceGroups?.length) tasks.push(this.http.get<any>(`${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllDeviceGroupsAsync`).toPromise().then((r:any)=>{ const items=Array.isArray(r)?r:(r?.items||r?.data||[]); this.deviceGroups=Array.isArray(items)?items:[]; }));
    await Promise.all(tasks);
  }
  loadLabelParams(): void {
    this.labelParamsLoading = true;
    this.labelParamsError = null;
    const url = `${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllLabelParametersAsync`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        this.labelParams = Array.isArray(items) ? items : [];
        // Ensure devices/groups are loaded, then sort by friendly name
        this.ensureDevicesAndGroupsLoaded().then(() => this.sortLabelParamsByName());
        this.labelParamsLoading = false;
      },
      error: (err) => {
        this.labelParamsLoading = false;
        this.labelParamsError = err?.error?.title || err?.message || 'Failed to load label parameters';
      }
    });
  }

  private sortLabelParamsByName(): void {
    if (!Array.isArray(this.labelParams)) return;
    this.labelParams = [...this.labelParams].sort((a:any, b:any) => {
      const an = (this.getDeviceOrGroupNameForParam(a) || '').toLowerCase();
      const bn = (this.getDeviceOrGroupNameForParam(b) || '').toLowerCase();
      return an.localeCompare(bn, undefined, { sensitivity: 'base' });
    });
  }

  openImportDialog(): void {
    this.importState = { open: true, step: 'select' };
    this.importHeaders = []; this.importMapping = {}; this.importRows = []; this.importRawRows = []; this.importError = null;
  }
  closeImportDialog(): void { this.importState = { open: false, step: 'select' }; }

  private _fieldDefsCache: any[] | null = null;
  private fieldDefinitions(): Array<{key:string; label:string; required?:boolean; synonyms:string[]; type?: 'int'|'float'|'bool'|'string'}> {
    if (this._fieldDefsCache) return this._fieldDefsCache as any;
    const int=(k:string,l:string,syn:string[]=[]): any=>({key:k,label:l,synonyms:syn,type:'int'});
    const num=(k:string,l:string,syn:string[]=[]): any=>({key:k,label:l,synonyms:syn,type:'float'});
    const str=(k:string,l:string,syn:string[]=[]): any=>({key:k,label:l,synonyms:syn,type:'string'});
    const bool=(k:string,l:string,syn:string[]=[]): any=>({key:k,label:l,synonyms:syn,type:'bool'});
    const defs: any[] = [
      int('number','Number',['labelparamno','paramno','plu','article']),
      str('systemType','System Type',['systemtype']),
      str('systemId','System Id',['systemid','guid']),
      str('description','Description',['desc']),
      str('labelSize','Label Size',['size','labelsize']),
      int('labelType','Label Type',['labeltype']),
      int('labelTypePrinter2','Label Type Printer 2',['labeltypeprinter2']),
      int('labelWidth','Label Width',['labelwidth']),
      int('labelExcessLength','Label Excess Length',['labelexcesslength']),
      int('variableHeaderLength','Variable Header Length',['variableheaderlength']),
      int('labelFeed','Label Feed',['labelfeed']),
      int('verticalPrintPosition','Vertical Print Position',['verticalprintposition']),
      int('horizontalPrintPosition','Horizontal Print Position',['horizontalprintposition']),
      int('printSpeed','Print Speed',['printspeed']),
      int('lightBarrierOffsetFrontEdge','Light Barrier Offset Front Edge',['lightbarrieroffsetfrontedge']),
      int('lightBarrierOffsetRearEdge','Light Barrier Offset Rear Edge',['lightbarrieroffsetrearedge']),
      int('customerLabelNumberTotal1','Customer Label Number Total 1',['customerlabelnumbertotal1','total1']),
      int('customerLabelNumberTotal2','Customer Label Number Total 2',['customerlabelnumbertotal2','total2']),
      int('customerLabelNumberTotal3','Customer Label Number Total 3',['customerlabelnumbertotal3','total3']),
      int('pickupMechanismOffset','Pickup Mechanism Offset',['pickupmechanismoffset']),
      str('retractOperation','Retract Operation',['retractoperation']),
      str('printSalesPrice','Print Sales Price',['printsalesprice']),
      str('unitPricePrintout','Unit Price Printout',['unitpriceprintout']),
      str('unitOfWeight','Unit Of Weight',['unitofweight']),
      str('weightDisplay','Weight Display',['weightdisplay']),
      bool('released','Released',['isreleased','released']),
      int('offsetPrintFWrap','Offset Print FWrap',['offsetprintfwrap']),
      num('offsetCropMarks','Offset Crop Marks',['offsetcropmarks']),
      int('offsetPrintOptionalPrinter','Offset Print Optional Printer',['offsetprintoptionalprinter']),
      str('labelLightBarrierSelection','Label Light Barrier Selection',['labellightbarrierselection'])
    ];
    this._fieldDefsCache = defs; return defs;
  }
  get fieldDefs() { return this.fieldDefinitions(); }
  autoMapImportHeaders(): void { this.importMapping = enforceUniqueMapping(autoMapHeaders(this.importHeaders, this.fieldDefinitions(), this.importMapping)); }
  updateImportMapping(csvHeader:string, target:string): void {
    const m = { ...this.importMapping };
    if (!target) delete m[csvHeader]; else m[csvHeader]=target;
    const rev: {[t:string]:string} = {};
    for (const [h,t] of Object.entries(m)) { if (rev[t] && rev[t]!==h) { delete m[rev[t]]; } rev[t]=h; }
    this.importMapping = m;
  }
  requiredImportFieldsMapped(): boolean { const s=new Set(Object.values(this.importMapping)); return s.has('number'); }

  async onImportFileSelected(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement; const file = input.files && input.files[0]; if (!file) return;
    try {
      const { rawRows, headers } = await parseCsvFile(file, 5000);
      this.importRawRows = rawRows; this.importHeaders = headers; this.autoMapImportHeaders(); this.rebuildMappedRows();
      this.importState = { open:true, step:'mapping' }; this.importError = null;
    } catch {
      this.importError = 'Failed to parse CSV';
    }
  }
  private rebuildMappedRows(): void { this.importRows = this.importRawRows.map((r:any,i:number)=> this.mapImportRow(r,i+2)); }
  trackHeader = (_:number, h:string)=> h;
  trackRow = (_:number, r:any)=> r?.line ?? _;
  hasImportFailures(): boolean { return (this.importRows||[]).some((r:any)=> r?.status === 'failed'); }
  goToPreviewFromMapping(): void { if (this.requiredImportFieldsMapped()) { this.rebuildMappedRows(); this.importState = { open:true, step:'preview' }; } }
  backToMapping(): void { if (this.importState.step==='preview') this.importState = { open:true, step:'mapping' }; }

  private mapImportRow(r:any, line:number): any {
    const trim=(v:any)=> (v===undefined||v===null?'':String(v).trim());
    const getVal=(t:string)=>{ const h=Object.entries(this.importMapping).find(([,v])=>v===t)?.[0]; return h? r[h] : undefined; };
    const row:any = { line, original:r, error:'' };
    const toInt=(v:any)=>{ const s=trim(v); return s!=='' && !Number.isNaN(Number(s)) ? Number(s) : 0; };
    const toFloat=(v:any)=>{ const s=trim(v); const n = Number(s); return Number.isFinite(n) ? n : 0; };
    const toBool=(v:any)=>{ const s=trim(v).toLowerCase(); return s==='true'||s==='1'||s==='yes'; };

    // Required core
    row.number = toInt(getVal('number') ?? r.number);
    row.systemType = trim(getVal('systemType') ?? r.systemType ?? r['systemType.value'] ?? 'Undefined');
    row.systemId = trim(getVal('systemId') ?? r.systemId ?? '');
    row.description = trim(getVal('description') ?? r.description ?? '');
    // Enums as strings (will wrap later)
    row.labelSize = trim(getVal('labelSize') ?? r.labelSize ?? r['labelSize.value'] ?? 'Size1');
    row.retractOperation = trim(getVal('retractOperation') ?? r.retractOperation ?? r['retractOperation.value'] ?? 'Active');
    row.printSalesPrice = trim(getVal('printSalesPrice') ?? r.printSalesPrice ?? r['printSalesPrice.value'] ?? 'AutomaticCurrencyUnit');
    row.unitPricePrintout = trim(getVal('unitPricePrintout') ?? r.unitPricePrintout ?? r['unitPricePrintout.value'] ?? 'WithoutUnitCharCurrencySymbolAsSet');
    row.unitOfWeight = trim(getVal('unitOfWeight') ?? r.unitOfWeight ?? r['unitOfWeight.value'] ?? 'WeightDimensionWithSpace');
    row.weightDisplay = trim(getVal('weightDisplay') ?? r.weightDisplay ?? r['weightDisplay.value'] ?? 'DisplayAndPrintInG');
    row.labelLightBarrierSelection = trim(getVal('labelLightBarrierSelection') ?? r.labelLightBarrierSelection ?? r['labelLightBarrierSelection.value'] ?? 'LabelLSAutomaticModeScanPosition1');

    // Numerics
    const numKeys = ['labelType','labelTypePrinter2','labelWidth','labelExcessLength','variableHeaderLength','labelFeed','verticalPrintPosition','horizontalPrintPosition','printSpeed','lightBarrierOffsetFrontEdge','lightBarrierOffsetRearEdge','customerLabelNumberTotal1','customerLabelNumberTotal2','customerLabelNumberTotal3','pickupMechanismOffset','offsetPrintFWrap','offsetPrintOptionalPrinter'];
    for (const k of numKeys) (row as any)[k] = toInt(getVal(k) ?? r[k]);
    row.offsetCropMarks = toFloat(getVal('offsetCropMarks') ?? r.offsetCropMarks);
    row.released = toBool(getVal('released') ?? r.released);

    // Basic validation
    if (!row.number) row.error += 'number required; ';
    return row;
  }

  private wrapEnum(value:string): any { return { value: value || '' }; }
  private buildPayloadFromRow(r:any): any {
    // Match user's working JSON structure
    const sysType = (r.systemType || 'Undefined');
    const body:any = {
      number: Number(r.number||0),
      systemType: this.wrapEnum(sysType),
      systemId: r.systemId ? String(r.systemId) : null,
      description: r.description || '',
      labelSize: this.wrapEnum(r.labelSize||'Size1'),
      labelType: Number(r.labelType||0),
      labelWidth: Number(r.labelWidth||0),
      labelExcessLength: Number(r.labelExcessLength||0),
      variableHeaderLength: Number(r.variableHeaderLength||0),
      labelFeed: Number(r.labelFeed||0),
      verticalPrintPosition: Number(r.verticalPrintPosition||0),
      printSpeed: Number(r.printSpeed||0),
      lightBarrierOffsetFrontEdge: Number(r.lightBarrierOffsetFrontEdge||0),
      lightBarrierOffsetRearEdge: Number(r.lightBarrierOffsetRearEdge||0),
      customerLabelNumberTotal1: Number(r.customerLabelNumberTotal1||0),
      customerLabelNumberTotal2: Number(r.customerLabelNumberTotal2||0),
      customerLabelNumberTotal3: Number(r.customerLabelNumberTotal3||0),
      pickupMechanismOffset: Number(r.pickupMechanismOffset||0),
      retractOperation: this.wrapEnum(r.retractOperation||'Active'),
      printSalesPrice: this.wrapEnum(r.printSalesPrice||'AutomaticCurrencyUnit'),
      unitPricePrintout: this.wrapEnum(r.unitPricePrintout||'WithoutUnitCharCurrencySymbolAsSet'),
      unitOfWeight: this.wrapEnum(r.unitOfWeight||'WeightDimensionWithSpace'),
      weightDisplay: this.wrapEnum(r.weightDisplay||'DisplayAndPrintInG'),
      labelTypePrinter2: Number(r.labelTypePrinter2||0),
      released: !!r.released,
      offsetPrintFWrap: Number(r.offsetPrintFWrap||0),
      offsetCropMarks: Number(r.offsetCropMarks||0),
      offsetPrintOptionalPrinter: Number(r.offsetPrintOptionalPrinter||0),
      horizontalPrintPosition: Number(r.horizontalPrintPosition||0),
      labelLightBarrierSelection: this.wrapEnum(r.labelLightBarrierSelection||'LabelLSAutomaticModeScanPosition1')
    };
    return body;
  }

  async startImport(): Promise<void> {
    if (!this.importRows?.length) return;
    this.importing = true;
    this.importProgress = { processed:0, success:0, failed:0, percent:0, done:false };
    const url = `${this.apiConfig.getBaseUrl()}/extensions/api/DeviceParameters/WriteLabelParameterAsync`;
    const rows = this.importRows;
    await runConcurrentQueue(rows, async (row:any) => {
      const err = (!row || row.error) ? (row?.error||'invalid row') : null;
      if (err) { row.status='failed'; row.error=err; return; }
      const body = this.buildPayloadFromRow(row);
      try {
        const resp = await this.http.post(url, body).toPromise();
        this.debug.emit({ area:'label-parameters', action:'LPAR Import', phase:'success', request:{ url, body }, response:resp, row: row.line, time: new Date().toISOString() });
        row.status='success'; row.error='';
      } catch(e:any) {
        this.debug.emit({ area:'label-parameters', action:'LPAR Import', phase:'error', request:{ url, body }, error:(e?.error||e), message:e?.message, row: row.line, time: new Date().toISOString() });
        row.status='failed'; row.error = e?.error?.title || e?.message || 'request failed';
      }
      await new Promise(res=>setTimeout(res,200));
    }, {
      concurrency: 1,
      onItemDone: (_item:any, index:number) => {
        this.importProgress.processed++;
        const ok = rows[index]?.status==='success';
        if (ok) this.importProgress.success++; else this.importProgress.failed++;
        const total = rows.length || 1;
        this.importProgress.percent = Math.round((this.importProgress.processed/total)*100);
      },
      onDone: () => { this.importProgress.done = true; this.importing = false; this.importState = { open:true, step:'done' }; }
    } as any);
  }

  downloadImportErrors(): void {
    const errs = (this.importRows||[]).filter((r:any)=> r.status==='failed');
    if (!errs.length) return;
    const header = 'line,number,systemType,systemId,error\n';
    const body = errs.map((r:any)=> `${r.line},${r.number},${r.systemType},${r.systemId},${(r.error||'').replace(/\n/g,' ')}`).join('\n');
    const blob = new Blob([header+body], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='LPAR-import-errors.csv'; a.click(); URL.revokeObjectURL(url);
  }

  downloadImportTemplate(): void {
    const header: string[] = [
      'number','systemType','systemId','description','labelSize','labelType','labelWidth','labelExcessLength','variableHeaderLength','labelFeed','verticalPrintPosition','printSpeed','lightBarrierOffsetFrontEdge','lightBarrierOffsetRearEdge','customerLabelNumberTotal1','customerLabelNumberTotal2','customerLabelNumberTotal3','pickupMechanismOffset','retractOperation','printSalesPrice','unitPricePrintout','unitOfWeight','weightDisplay','labelTypePrinter2','released','offsetPrintFWrap','offsetCropMarks','offsetPrintOptionalPrinter','horizontalPrintPosition','labelLightBarrierSelection'
    ];
    const sample = {
      number: 4,
      systemType: 'Undefined',
      systemId: '',
      description: 'all devices',
      labelSize: 'Size1',
      labelType: 8192,
      labelWidth: 450,
      labelExcessLength: 0,
      variableHeaderLength: 0,
      labelFeed: 0,
      verticalPrintPosition: 0,
      printSpeed: 0,
      lightBarrierOffsetFrontEdge: 0,
      lightBarrierOffsetRearEdge: 0,
      customerLabelNumberTotal1: 3,
      customerLabelNumberTotal2: 4,
      customerLabelNumberTotal3: 4,
      pickupMechanismOffset: 0,
      retractOperation: 'Active',
      printSalesPrice: 'AutomaticCurrencyUnit',
      unitPricePrintout: 'WithoutUnitCharCurrencySymbolAsSet',
      unitOfWeight: 'WeightDimensionWithSpace',
      weightDisplay: 'DisplayAndPrintInG',
      labelTypePrinter2: 8192,
      released: false,
      offsetPrintFWrap: 0,
      offsetCropMarks: 0,
      offsetPrintOptionalPrinter: 0,
      horizontalPrintPosition: 0,
      labelLightBarrierSelection: 'LabelLSAutomaticModeScanPosition1'
    } as any;
    const row = header.map(h=> sample[h] ?? '').join(',');
    const csv = [header.join(','), row].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='LPAR-Import-Template.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }

  // ===== Export: Download all Label Parameters to CSV =====
  private flattenEnum(v:any): string { return (v && typeof v==='object' && 'value' in v) ? String(v.value) : String(v ?? ''); }
  private escCsv(val:any): string { const s = String(val ?? ''); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
  getDeviceOrGroupNameForParam(p:any): string {
    const sysType = this.flattenEnum(p?.systemType);
    const sysId = String(p?.systemId ?? '').trim();
    if (sysType === 'Device') {
      const d = this.devices.find(x=> this.getDeviceId(x) === sysId);
      return d ? this.getDeviceName(d) : '';
    }
    if (sysType === 'DeviceGroup') {
      const g = this.deviceGroups.find(x=> this.getGroupId(x) === sysId);
      return g ? this.getGroupName(g) : '';
    }
    if (sysType === 'Undefined') return '--- All Devices ---';
    return '';
  }
  async downloadAllLparsCsv(): Promise<void> {
    const url = `${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllLabelParametersAsync`;
    const params: any[] = await this.http.get<any>(url).toPromise().then((r:any)=> Array.isArray(r)? r : (r?.items||r?.data||[]));
    await this.ensureDevicesAndGroupsLoaded();
    const baseHeader: string[] = [
      'number','systemType','systemId','description','labelSize','labelType','labelWidth','labelExcessLength','variableHeaderLength','labelFeed','verticalPrintPosition','horizontalPrintPosition','printSpeed','lightBarrierOffsetFrontEdge','lightBarrierOffsetRearEdge','customerLabelNumberTotal1','customerLabelNumberTotal2','customerLabelNumberTotal3','pickupMechanismOffset','retractOperation','printSalesPrice','unitPricePrintout','unitOfWeight','weightDisplay','labelTypePrinter2','released','offsetPrintFWrap','offsetCropMarks','offsetPrintOptionalPrinter','labelLightBarrierSelection'
    ];
    const header: string[] = [...baseHeader];
    const sysIdIdx = header.indexOf('systemId');
    header.splice(sysIdIdx+1, 0, 'Device name or Group Name');
    const rows: string[] = [];
    for (const p of params) {
      const values: any[] = [];
      for (let i=0;i<header.length;i++) {
        const col = header[i];
        if (col === 'Device name or Group Name') { values.push(this.getDeviceOrGroupNameForParam(p)); continue; }
        let v:any = (p as any)[col];
        if (['systemType','labelSize','retractOperation','printSalesPrice','unitPricePrintout','unitOfWeight','weightDisplay','labelLightBarrierSelection'].includes(col)) v = this.flattenEnum(v);
        if (typeof v === 'boolean') v = v ? 'true' : 'false';
        values.push(v ?? '');
      }
      rows.push(values.map(v=> this.escCsv(v)).join(','));
    }
    const headerLine = header.join(',') + '\n';
    const blob = new Blob([headerLine + rows.join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`LPARs-${new Date().toISOString().substring(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }
}
