import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { parseCsvFile, autoMapHeaders, enforceUniqueMapping, downloadCsv, runConcurrentQueue } from '../../shared/csv-import.util';
import { ApiConfig } from '../../api-config';

@Component({
  selector: 'dm-device-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-parameters.html',
  styleUrl: './device-parameters.scss'
})
export class DeviceParametersComponent {
  @Output() debug = new EventEmitter<any>();
  // API services
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);

  // UI state
  devices: any[] = [];
  devicesLoading = false;
  devicesError: string | null = null;
  selectedDeviceId: string = '';
  deviceGroups: any[] = [];
  deviceGroupsLoading = false;
  deviceGroupsError: string | null = null;
  selectedGroupId: string = '';
  // Auto Labeler Parameters state
  autoParams: any[] = [];
  autoParamsLoading = false;
  autoParamsError: string | null = null;
  selectedAutoParamId: string = '';

  ngOnInit() { this.loadDevices(); this.loadDeviceGroups(); this.loadAutoParams(); }

  private baseUrl(): string { return this.apiConfig.getBaseUrl(); }

  loadDevices(): void {
    this.devicesLoading = true;
    this.devicesError = null;
    const url = `${this.baseUrl()}/api/v1/devices`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        this.devices = Array.isArray(items) ? items : [];
        this.devicesLoading = false;
      },
      error: (err) => {
        this.devicesLoading = false;
        this.devicesError = err?.error?.title || err?.message || 'Failed to load devices';
      }
    });
  }
  getDeviceId(d: any): string {
    return String(d?.systemId ?? d?.id ?? d?.deviceId ?? d?.guid ?? d?.number ?? '');
  }
  getDeviceName(d: any): string {
    return String(d?.name ?? d?.displayName ?? d?.description ?? this.getDeviceId(d));
  }

  loadDeviceGroups(): void {
    this.deviceGroupsLoading = true;
    this.deviceGroupsError = null;
    const url = `${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllDeviceGroupsAsync`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        this.deviceGroups = Array.isArray(items) ? items : [];
        this.deviceGroupsLoading = false;
      },
      error: (err) => {
        this.deviceGroupsLoading = false;
        this.deviceGroupsError = err?.error?.title || err?.message || 'Failed to load device groups';
      }
    });
  }

  getGroupId(g: any): string {
    return String(
      g?.id ?? g?.groupId ?? g?.deviceGroupId ?? g?.deviceGroupNumber ?? g?.number ?? ''
    );
  }
  getGroupName(g: any): string {
    return String(
      g?.name ?? g?.groupName ?? g?.deviceGroupName ?? g?.displayName ?? g?.description ?? this.getGroupId(g)
    );
  }

  loadAutoParams(): void {
    this.autoParamsLoading = true;
    this.autoParamsError = null;
    const url = `${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllAutoLabelerParametersAsync`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        this.autoParams = Array.isArray(items) ? items : [];
        this.autoParamsLoading = false;
      },
      error: (err) => {
        this.autoParamsLoading = false;
        this.autoParamsError = err?.error?.title || err?.message || 'Failed to load auto labeler parameters';
      }
    });
  }
  getParamId(p: any): string {
    return String(
      p?.id ?? p?.parameterId ?? p?.autoLabelerParameterId ?? p?.number ?? p?.key ?? ''
    );
  }
  getParamName(p: any): string {
    return String(
      p?.name ?? p?.parameterName ?? p?.displayName ?? p?.description ?? this.getParamId(p)
    );
  }

  // ===== AMPAR Import (CSV) =====
  importState: { open: boolean; step: 'select'|'mapping'|'preview' } = { open: false, step: 'select' };
  importHeaders: string[] = [];
  importMapping: { [csvHeader: string]: string } = {};
  importRawRows: any[] = [];
  importRows: any[] = [];
  importError: string | null = null;
  private _fieldDefsCache: any[] | null = null;
  resolvingGroups = false;
  importing = false;
  importProgress: { processed:number; success:number; failed:number; percent:number; done:boolean } = { processed:0, success:0, failed:0, percent:0, done:false };

  openImportDialog(): void { this.importState = { open: true, step: 'select' }; this.importHeaders = []; this.importMapping = {}; }
  closeImportDialog(): void { this.importState = { open: false, step: 'select' }; }

  async onImportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement; const file = input.files && input.files[0]; if (!file) return;
    try {
      const { rawRows, headers } = await parseCsvFile(file, 5000);
      this.importRawRows = rawRows; this.importHeaders = headers;
      this.autoMapImportHeaders(); this.rebuildMappedRows();
      this.importState = { open: true, step: 'mapping' };
      this.importError = null;
    } catch (e:any) {
      this.importError = 'Failed to parse CSV';
    }
  }

  private fieldDefinitions(): Array<{key:string; label:string; required?:boolean; synonyms:string[]; type?: 'int'|'float'|'bool'|'string'}> {
    if (this._fieldDefsCache) return this._fieldDefsCache as any;
    const num = (k:string,l:string, syn:string[]=[]): any => ({ key:k, label:l, synonyms: syn, type:'float' });
    const int = (k:string,l:string, syn:string[]=[]): any => ({ key:k, label:l, synonyms: syn, type:'int' });
    const str = (k:string,l:string, syn:string[]=[]): any => ({ key:k, label:l, synonyms: syn, type:'string' });
    const bool= (k:string,l:string, syn:string[]=[]): any => ({ key:k, label:l, synonyms: syn, type:'bool' });
    // Core identifiers
    const defs: any[] = [
      str('id','Id',['guid','devicegroupid','ampartid']),
      str('systemId','System Id',['systemid','deviceid','deviceguid']),
      str('systemType','System Type',['systemtype','type']),
      int('number','Number',['plu','article','number']),
      str('description','Description',['desc']),
      // Name-based glue for resolving systemId by type
      str('deviceOrGroupName','Device Name or Device Group Name',[
        'device name','group name','device or group name','deviceorgroupname','devicename','devicegroupname'
      ]),
      // Enums
      str('referencePointLabelDistance','Reference Point Label Distance',['referencepointlabeldistance','refpoint'] ),
      str('labelPosition','Label Position',['labelposition']),
      str('operatingMode','Operating Mode',['operatingmode']),
      str('labelerConveyingMode','Labeler Conveying Mode',['labelerconveyingmode']),
      // Optional helper columns for glue by name
      str('deviceGroupId','Device Group Id',['devicegroupid','groupid']),
      str('deviceGroupName','Device Group Name',['devicegroupname','groupname'])
    ];
    // Numeric fields from sample
    const numericKeys = [
      'lightBarrier1SuspensionPath','lightBarrier2SuspensionPath','labelDistance','maxPackageHeight','labeler2MaxPackageHeight','labelingSpeed','throughput','conveyingSpeed','factorInfeedSingling','angleRotation','crossPosition','rotationSpeed','heightOfPackage','packageWidth','labelDistance2','horizontalPositionLabel1','horizontalPositionLabel2','rotationLabel1','rotationLabel2','timeoutOfEjector','timeoutOfDivider1','timeoutOfDivider2','timeoutOfDivider3','timeoutOfDivider4','timeoutOfDivider5','timeoutOfDivider6','timeoutOfDivider7','switchOnTimeEjector','switchOnTimeDivider1','switchOnTimeDivider2','switchOnTimeDivider3','switchOnTimeDivider4','switchOnTimeDivider5','switchOnTimeDivider6','switchOnTimeDivider7','speedWeighingFineInDecimetersPerMinute','codeCheck1','codeCheck2','codeCheck3','dynamicPackageDistance','actuatorPositionLabelRollStop','actuatorPositionLabelMark','actuatorPackageHeightLabelingUnit','actuatorTopConveyorHeight','actuatorTopConveyorWidth','actuatorPrintPositionLeft','actuatorPrintPositionRight','actuatorPositionSuctionBeltLeft','actuatorPositionSuctionBeltRight','packageLength','labelDispenser1PackageHeight','labelDispenser2PackageHeight','labelDispenser2TransversePosition','labelDispenser1TransversePosition'
    ];
    for (const k of numericKeys) defs.push(num(k, k));
    defs.push(bool('released','Released',['isreleased']));
  this._fieldDefsCache = defs;
  return defs;
  }

  autoMapImportHeaders(): void {
    const mapping = autoMapHeaders(this.importHeaders, this.fieldDefinitions(), this.importMapping);
    this.importMapping = enforceUniqueMapping(mapping);
  }
  updateImportMapping(csvHeader:string, target:string): void {
    const m = { ...this.importMapping }; if (!target) delete m[csvHeader]; else m[csvHeader]=target;
    const rev: {[t:string]:string}={}; for(const [h,t] of Object.entries(m)){ if(rev[t]&&rev[t]!==h){ delete m[rev[t]]; } rev[t]=h; }
    this.importMapping = m;
  }
  requiredImportFieldsMapped(): boolean {
    const mapped = new Set(Object.values(this.importMapping));
    // Require at least systemId or number to make sense
    return mapped.has('systemId') || mapped.has('number');
  }
  goToPreviewFromMapping(): void { if (this.requiredImportFieldsMapped()) { this.rebuildMappedRows(); this.importState = { open:true, step:'preview' }; } }
  backToMapping(): void { if (this.importState.step==='preview') this.importState = { open:true, step:'mapping' }; }

  private rebuildMappedRows(): void {
    const rows = this.importRawRows.map((r:any,i:number)=> this.mapImportRow(r,i+2));
    this.importRows = rows;
  }
  async resolveGroupIdsFromDevices(): Promise<void> {
    if (!this.importRows?.length) return;
    this.resolvingGroups = true;
    try {
      const url = `${this.baseUrl()}/api/v1/devices`;
      const devices:any[] = await this.http.get<any>(url).toPromise().then((r:any)=> Array.isArray(r)? r : (r?.items || r?.data || []));
      const bySystemId = new Map<string, any>();
      const byNumber = new Map<number, any>();
      for (const d of devices) {
        const sid = String(d?.systemId ?? d?.id ?? '').trim(); if (sid) bySystemId.set(sid, d);
        const num = Number(d?.number ?? d?.deviceNumber ?? NaN); if (!Number.isNaN(num)) byNumber.set(num, d);
      }
      for (const r of this.importRows) {
        if (r.deviceGroupId) continue;
        const d = (r.systemId && bySystemId.get(String(r.systemId))) || (r.number && byNumber.get(Number(r.number)));
        if (d) {
          r.deviceGroupId = String(d?.deviceGroupId ?? d?.groupId ?? d?.deviceGroupGuid ?? '');
          if (!r.deviceGroupName && r.deviceGroupId) {
            const g = this.deviceGroups.find(x=> this.getGroupId(x)===r.deviceGroupId);
            if (g) r.deviceGroupName = this.getGroupName(g);
          }
        }
      }
    } finally {
      this.resolvingGroups = false;
    }
  }
  private mapImportRow(r:any, line:number): any {
    const trim=(v:any)=> (v===undefined||v===null?'':String(v).trim());
    const getVal=(t:string)=>{ const h=Object.entries(this.importMapping).find(([,v])=>v===t)?.[0]; return h? r[h] : undefined; };
    const row:any = { line, original:r, error:'' };
    // identifiers
    row.id = trim(getVal('id') ?? r.id);
  row.systemId = trim(getVal('systemId') ?? r.systemId);
  row.systemType = trim(getVal('systemType') ?? r.systemType ?? r['systemType.value']);
    {
      const numStr = trim(getVal('number') ?? (r.number ?? ''));
      row.number = numStr !== '' && !Number.isNaN(Number(numStr)) ? Number(numStr) : 0;
    }
    row.description = trim(getVal('description') ?? r.description ?? '');
    row.referencePointLabelDistance = trim(getVal('referencePointLabelDistance') ?? r.referencePointLabelDistance ?? r['referencePointLabelDistance.value']);
    row.labelPosition = trim(getVal('labelPosition') ?? r.labelPosition ?? r['labelPosition.value']);
    row.operatingMode = trim(getVal('operatingMode') ?? r.operatingMode ?? r['operatingMode.value']);
    row.labelerConveyingMode = trim(getVal('labelerConveyingMode') ?? r.labelerConveyingMode ?? r['labelerConveyingMode.value']);
    // helper glue fields
    row.deviceGroupId = trim(getVal('deviceGroupId') ?? r.deviceGroupId ?? '');
    const groupName = trim(getVal('deviceGroupName') ?? r.deviceGroupName ?? '');
    if (!row.deviceGroupId && groupName) {
      const match = this.deviceGroups.find(g => this.getGroupName(g).toLowerCase()===groupName.toLowerCase());
      if (match) row.deviceGroupId = this.getGroupId(match);
    }
    // resolve systemId by name based on systemType if provided
    const nameField = trim(getVal('deviceOrGroupName') ?? '');
    const sysTypeLower = (row.systemType || '').toLowerCase();
    if (!row.systemId && nameField) {
      if (sysTypeLower === 'device') {
        const d = this.devices.find(x => this.getDeviceName(x).toLowerCase() === nameField.toLowerCase());
        if (d) row.systemId = this.getDeviceId(d);
      } else if (sysTypeLower === 'devicegroup') {
        const g = this.deviceGroups.find(x => this.getGroupName(x).toLowerCase() === nameField.toLowerCase());
        if (g) row.systemId = this.getGroupId(g);
      } else if (sysTypeLower === 'undefined' && nameField === '--- All Devices ---') {
        // keep systemId empty; applies to all devices
      }
    }
    // numerics and bools
    const setNum=(k:string)=>{ const v=trim(getVal(k) ?? r[k] ?? ''); row[k]= (v!=='' && !Number.isNaN(Number(v))) ? Number(v) : 0; };
    const numericKeys = this.fieldDefinitions().filter(d=>d.type==='float' || d.type==='int').map(d=>d.key);
    for (const k of numericKeys) setNum(k);
    const rel=trim(getVal('released') ?? r.released ?? ''); row.released = (rel.toLowerCase()==='true' || rel==='1');

    // Basic validation
    if (!row.systemId && !row.number) row.error += 'missing systemId or number; ';
    return row;
  }
  // Expose field definitions for template mapping UI
  get fieldDefs() { return this.fieldDefinitions(); }
  trackHeader = (_:number, h:string)=> h;
  trackRow = (_:number, r:any)=> r?.line ?? _;
  hasImportErrors(): boolean { return Array.isArray(this.importRows) && this.importRows.some((r:any)=> r && r.status==='failed'); }

  private normalizeEnumValue(v:string): 'Device'|'DeviceGroup'|'Undefined' {
    const s = (v||'').toLowerCase();
    if (s==='device') return 'Device';
    if (s==='devicegroup') return 'DeviceGroup';
    return 'Undefined';
  }
  private buildPayloadFromRow(r:any): any {
    const enumWrap = (v:any)=> ({ value: String(v||'') });
    const safeBool = (v:any)=> !!(String(v).toLowerCase()==='true' || v===true || v===1 || v==='1');
    const sysType = this.normalizeEnumValue(r.systemType);
    let systemId = String(r.systemId||'');
    if (!systemId && sysType==='DeviceGroup' && r.deviceGroupId) systemId = String(r.deviceGroupId);
    const p:any = {
      systemId: systemId || null,
      systemType: { value: sysType },
      number: Number(r.number||0),
      description: r.description || null,
      referencePointLabelDistance: enumWrap(r.referencePointLabelDistance||'TrailingEdge'),
      labelPosition: enumWrap(r.labelPosition||'Top1'),
      operatingMode: enumWrap(r.operatingMode||'GSDefault'),
      labelerConveyingMode: enumWrap(r.labelerConveyingMode||'Passage'),
      lightBarrier1SuspensionPath: Number(r.lightBarrier1SuspensionPath||0),
      lightBarrier2SuspensionPath: Number(r.lightBarrier2SuspensionPath||0),
      labelDistance: Number(r.labelDistance||0),
      maxPackageHeight: Number(r.maxPackageHeight||0),
      labeler2MaxPackageHeight: Number(r.labeler2MaxPackageHeight||0),
      labelingSpeed: Number(r.labelingSpeed||0),
      throughput: Number(r.throughput||0),
      conveyingSpeed: Number(r.conveyingSpeed||0),
      factorInfeedSingling: Number(r.factorInfeedSingling||0),
      angleRotation: Number(r.angleRotation||0),
      crossPosition: Number(r.crossPosition||0),
      rotationSpeed: Number(r.rotationSpeed||0),
      heightOfPackage: Number(r.heightOfPackage||0),
      packageWidth: Number(r.packageWidth||0),
      labelDistance2: Number(r.labelDistance2||0),
      horizontalPositionLabel1: Number(r.horizontalPositionLabel1||0),
      horizontalPositionLabel2: Number(r.horizontalPositionLabel2||0),
      rotationLabel1: Number(r.rotationLabel1||0),
      rotationLabel2: Number(r.rotationLabel2||0),
      timeoutOfEjector: Number(r.timeoutOfEjector||0),
      timeoutOfDivider1: Number(r.timeoutOfDivider1||0),
      timeoutOfDivider2: Number(r.timeoutOfDivider2||0),
      timeoutOfDivider3: Number(r.timeoutOfDivider3||0),
      timeoutOfDivider4: Number(r.timeoutOfDivider4||0),
      timeoutOfDivider5: Number(r.timeoutOfDivider5||0),
      timeoutOfDivider6: Number(r.timeoutOfDivider6||0),
      timeoutOfDivider7: Number(r.timeoutOfDivider7||0),
      switchOnTimeEjector: Number(r.switchOnTimeEjector||0),
      switchOnTimeDivider1: Number(r.switchOnTimeDivider1||0),
      switchOnTimeDivider2: Number(r.switchOnTimeDivider2||0),
      switchOnTimeDivider3: Number(r.switchOnTimeDivider3||0),
      switchOnTimeDivider4: Number(r.switchOnTimeDivider4||0),
      switchOnTimeDivider5: Number(r.switchOnTimeDivider5||0),
      switchOnTimeDivider6: Number(r.switchOnTimeDivider6||0),
      switchOnTimeDivider7: Number(r.switchOnTimeDivider7||0),
      speedWeighingFineInDecimetersPerMinute: Number(r.speedWeighingFineInDecimetersPerMinute||0),
      codeCheck1: Number(r.codeCheck1||0),
      codeCheck2: Number(r.codeCheck2||0),
      codeCheck3: Number(r.codeCheck3||0),
      released: safeBool(r.released),
      dynamicPackageDistance: Number(r.dynamicPackageDistance||0),
      actuatorPositionLabelRollStop: Number(r.actuatorPositionLabelRollStop||0),
      actuatorPositionLabelMark: Number(r.actuatorPositionLabelMark||0),
      actuatorPackageHeightLabelingUnit: Number(r.actuatorPackageHeightLabelingUnit||0),
      actuatorTopConveyorHeight: Number(r.actuatorTopConveyorHeight||0),
      actuatorTopConveyorWidth: Number(r.actuatorTopConveyorWidth||0),
      actuatorPrintPositionLeft: Number(r.actuatorPrintPositionLeft||0),
      actuatorPrintPositionRight: Number(r.actuatorPrintPositionRight||0),
      actuatorPositionSuctionBeltLeft: Number(r.actuatorPositionSuctionBeltLeft||0),
      actuatorPositionSuctionBeltRight: Number(r.actuatorPositionSuctionBeltRight||0),
      packageLength: Number(r.packageLength||0),
      labelDispenser1PackageHeight: Number(r.labelDispenser1PackageHeight||0),
      labelDispenser2PackageHeight: Number(r.labelDispenser2PackageHeight||0),
      labelDispenser2TransversePosition: Number(r.labelDispenser2TransversePosition||0),
      labelDispenser1TransversePosition: Number(r.labelDispenser1TransversePosition||0)
    };
    if (r.id) p.id = String(r.id);
    return p;
  }
  private validateRow(r:any): string | null {
    const type = this.normalizeEnumValue(r.systemType);
    if (!r.number || Number(r.number)<=0) return 'number is required';
    if (type==='Device' && !r.systemId) return 'systemId required for Device';
    if (type==='DeviceGroup' && !(r.systemId || r.deviceGroupId)) return 'device group id required';
    return null;
  }
  async startImport(): Promise<void> {
    if (!this.importRows?.length) return;
    await this.ensureDevicesAndGroupsLoaded();
    this.importing = true;
    this.importProgress = { processed:0, success:0, failed:0, percent:0, done:false };
    const url = `${this.baseUrl()}/extensions/api/DeviceParameters/WriteAutoLabelerParameterAsync`;
    const rows = this.importRows;
    await runConcurrentQueue(rows, async (row:any) => {
      // Finalize group/system glue
      if (this.normalizeEnumValue(row.systemType)==='DeviceGroup' && !row.systemId && row.deviceGroupId) row.systemId = String(row.deviceGroupId);
      const err = this.validateRow(row);
      if (err) { row.status='failed'; row.error = err; return; }
      const payload = this.buildPayloadFromRow(row);
      const urlForPost = `${url}`;
      try {
        const resp = await this.http.post(urlForPost, payload).toPromise();
        this.debug.emit({
          area: 'device-parameters', action: 'AMPAR Import', phase: 'success',
          request: { url: urlForPost, body: payload }, response: resp, row: row.line, time: new Date().toISOString()
        });
        row.status='success'; row.error='';
      } catch(e:any) {
        this.debug.emit({
          area: 'device-parameters', action: 'AMPAR Import', phase: 'error',
          request: { url: urlForPost, body: payload }, error: (e?.error || e), message: e?.message, row: row.line, time: new Date().toISOString()
        });
        row.status='failed'; row.error = e?.error?.title || e?.message || 'request failed';
      }
    }, {
      concurrency: 4,
      onItemDone: (_item:any, index:number) => {
        this.importProgress.processed++;
        const ok = rows[index]?.status==='success';
        if (ok) this.importProgress.success++; else this.importProgress.failed++;
        const total = rows.length || 1;
        this.importProgress.percent = Math.round((this.importProgress.processed/total)*100);
      },
      onDone: () => { this.importProgress.done = true; this.importing = false; }
    } as any);
  }
  downloadImportErrors(): void {
    const errs = (this.importRows||[]).filter((r:any)=> r.status==='failed');
    if (!errs.length) return;
    const header = 'line,number,systemType,systemId,error\n';
    const body = errs.map((r:any)=> `${r.line},${this.escCsv(r.number)},${this.escCsv(r.systemType)},${this.escCsv(r.systemId)},${this.escCsv(r.error||'')}`).join('\n');
    const blob = new Blob([header+body], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='AMPAR-import-errors.csv'; a.click(); URL.revokeObjectURL(url);
  }

  downloadImportTemplate(): void {
    const header: string[] = [
      'id','systemId','systemType','number','description','referencePointLabelDistance','labelPosition','operatingMode','labelerConveyingMode',
      'lightBarrier1SuspensionPath','lightBarrier2SuspensionPath','labelDistance','maxPackageHeight','labeler2MaxPackageHeight','labelingSpeed','throughput','conveyingSpeed','factorInfeedSingling','angleRotation','crossPosition','rotationSpeed','heightOfPackage','packageWidth','labelDistance2','horizontalPositionLabel1','horizontalPositionLabel2','rotationLabel1','rotationLabel2','timeoutOfEjector','timeoutOfDivider1','timeoutOfDivider2','timeoutOfDivider3','timeoutOfDivider4','timeoutOfDivider5','timeoutOfDivider6','timeoutOfDivider7','switchOnTimeEjector','switchOnTimeDivider1','switchOnTimeDivider2','switchOnTimeDivider3','switchOnTimeDivider4','switchOnTimeDivider5','switchOnTimeDivider6','switchOnTimeDivider7','speedWeighingFineInDecimetersPerMinute','codeCheck1','codeCheck2','codeCheck3','released','dynamicPackageDistance','actuatorPositionLabelRollStop','actuatorPositionLabelMark','actuatorPackageHeightLabelingUnit','actuatorTopConveyorHeight','actuatorTopConveyorWidth','actuatorPrintPositionLeft','actuatorPrintPositionRight','actuatorPositionSuctionBeltLeft','actuatorPositionSuctionBeltRight','packageLength','labelDispenser1PackageHeight','labelDispenser2PackageHeight','labelDispenser2TransversePosition','labelDispenser1TransversePosition',
      'deviceGroupId','deviceGroupName'
    ];
    const sample = {
      id: '676f6d36-d996-4bdb-9ebf-4bf000914d86',
      systemId: '833bffec-a114-45d3-bf0f-79befc50e588',
      systemType: 'Device',
      number: 65922,
      description: '',
      referencePointLabelDistance: 'TrailingEdge',
      labelPosition: 'Top1',
      operatingMode: 'GSDefault',
      labelerConveyingMode: 'Passage',
      lightBarrier1SuspensionPath: 220,
      lightBarrier2SuspensionPath: 0,
      labelDistance: 38,
      maxPackageHeight: 40,
      labeler2MaxPackageHeight: 0,
      labelingSpeed: 0,
      throughput: 0,
      conveyingSpeed: 0,
      factorInfeedSingling: 0,
      angleRotation: 0,
      crossPosition: 0,
      rotationSpeed: 0,
      heightOfPackage: 0,
      packageWidth: 0,
      labelDistance2: 0,
      horizontalPositionLabel1: 0,
      horizontalPositionLabel2: 0,
      rotationLabel1: 0,
      rotationLabel2: 0,
      timeoutOfEjector: 0,
      timeoutOfDivider1: 0,
      timeoutOfDivider2: 0,
      timeoutOfDivider3: 0,
      timeoutOfDivider4: 0,
      timeoutOfDivider5: 0,
      timeoutOfDivider6: 0,
      timeoutOfDivider7: 0,
      switchOnTimeEjector: 0,
      switchOnTimeDivider1: 0,
      switchOnTimeDivider2: 0,
      switchOnTimeDivider3: 0,
      switchOnTimeDivider4: 0,
      switchOnTimeDivider5: 0,
      switchOnTimeDivider6: 0,
      switchOnTimeDivider7: 0,
      speedWeighingFineInDecimetersPerMinute: 0,
      codeCheck1: 0,
      codeCheck2: 0,
      codeCheck3: 0,
      released: false,
      dynamicPackageDistance: 0,
      actuatorPositionLabelRollStop: 0,
      actuatorPositionLabelMark: 0,
      actuatorPackageHeightLabelingUnit: 0,
      actuatorTopConveyorHeight: 0,
      actuatorTopConveyorWidth: 0,
      actuatorPrintPositionLeft: 0,
      actuatorPrintPositionRight: 0,
      actuatorPositionSuctionBeltLeft: 0,
      actuatorPositionSuctionBeltRight: 0,
      packageLength: 0,
      labelDispenser1PackageHeight: 0,
      labelDispenser2PackageHeight: 0,
      labelDispenser2TransversePosition: 0,
      labelDispenser1TransversePosition: 0,
      deviceGroupId: '',
      deviceGroupName: ''
    } as any;
    const row = header.map(h=> sample[h] ?? '').join(',');
    const csv = [header.join(','), row].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='AMPAR-Import-Template.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }

  // ===== Export: Download all AMPARs to CSV =====
  private async ensureDevicesAndGroupsLoaded(): Promise<void> {
    const tasks: Promise<any>[] = [];
    if (!this.devices?.length) tasks.push(this.http.get<any>(`${this.baseUrl()}/api/v1/devices`).toPromise().then((r:any)=>{ const items=Array.isArray(r)?r:(r?.items||r?.data||[]); this.devices=Array.isArray(items)?items:[]; }));
    if (!this.deviceGroups?.length) tasks.push(this.http.get<any>(`${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllDeviceGroupsAsync`).toPromise().then((r:any)=>{ const items=Array.isArray(r)?r:(r?.items||r?.data||[]); this.deviceGroups=Array.isArray(items)?items:[]; }));
    await Promise.all(tasks);
  }
  private flattenEnum(v:any): string { return (v && typeof v==='object' && 'value' in v) ? String(v.value) : String(v ?? ''); }
  private safeNum(v:any): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  private escCsv(val:any): string { const s = String(val ?? ''); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
  private getDeviceOrGroupNameForParam(p:any): string {
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
  async downloadAllAmparsCsv(): Promise<void> {
    // Load data fresh to avoid partial state
    const params: any[] = await this.http.get<any>(`${this.baseUrl()}/extensions/api/DeviceParameters/ReadAllAutoLabelerParametersAsync`).toPromise().then((r:any)=> Array.isArray(r)? r : (r?.items||r?.data||[]));
    await this.ensureDevicesAndGroupsLoaded();

    // Build header (insert name column right after systemId)
    const baseHeader: string[] = [
      'id','systemId','systemType','number','description','referencePointLabelDistance','labelPosition','operatingMode','labelerConveyingMode',
      'lightBarrier1SuspensionPath','lightBarrier2SuspensionPath','labelDistance','maxPackageHeight','labeler2MaxPackageHeight','labelingSpeed','throughput','conveyingSpeed','factorInfeedSingling','angleRotation','crossPosition','rotationSpeed','heightOfPackage','packageWidth','labelDistance2','horizontalPositionLabel1','horizontalPositionLabel2','rotationLabel1','rotationLabel2','timeoutOfEjector','timeoutOfDivider1','timeoutOfDivider2','timeoutOfDivider3','timeoutOfDivider4','timeoutOfDivider5','timeoutOfDivider6','timeoutOfDivider7','switchOnTimeEjector','switchOnTimeDivider1','switchOnTimeDivider2','switchOnTimeDivider3','switchOnTimeDivider4','switchOnTimeDivider5','switchOnTimeDivider6','switchOnTimeDivider7','speedWeighingFineInDecimetersPerMinute','codeCheck1','codeCheck2','codeCheck3','released','dynamicPackageDistance','actuatorPositionLabelRollStop','actuatorPositionLabelMark','actuatorPackageHeightLabelingUnit','actuatorTopConveyorHeight','actuatorTopConveyorWidth','actuatorPrintPositionLeft','actuatorPrintPositionRight','actuatorPositionSuctionBeltLeft','actuatorPositionSuctionBeltRight','packageLength','labelDispenser1PackageHeight','labelDispenser2PackageHeight','labelDispenser2TransversePosition','labelDispenser1TransversePosition'
    ];
    const header: string[] = [...baseHeader];
    const sysIdIdx = header.indexOf('systemId');
    header.splice(sysIdIdx+1, 0, 'Device name or Group Name');

    const rows: string[] = [];
    for (const p of params) {
      const values: any[] = [];
      for (let i=0;i<header.length;i++) {
        const col = header[i];
        if (col === 'Device name or Group Name') {
          values.push(this.getDeviceOrGroupNameForParam(p));
          continue;
        }
        let v:any = (p as any)[col];
        // Allow alternative property access where enums are objects
        if ((col==='systemType'||col==='referencePointLabelDistance'||col==='labelPosition'||col==='operatingMode'||col==='labelerConveyingMode') && v && typeof v==='object') {
          v = this.flattenEnum(v);
        }
        if (typeof v === 'boolean') v = v ? 'true' : 'false';
        values.push(v ?? '');
      }
      rows.push(values.map(v=> this.escCsv(v)).join(','));
    }
    const headerLine = header.join(',') + '\n';
    downloadCsv(`AMPARs-${new Date().toISOString().substring(0,10)}.csv`, headerLine, rows);
  }
}
