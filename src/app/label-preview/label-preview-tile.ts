import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiConfig } from '../api-config';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-label-preview-tile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './label-preview-tile.html',
  styleUrl: './label-preview-tile.scss'
})
export class LabelPreviewTile implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);

  // Inputs to optionally preselect values
  @Input() project: string = '';
  @Input() layoutNumber: number | null = null;
  @Input() pluNumber: number | null = null;

  // Emits the resulting base64 when a new preview is generated
  @Output() previewGenerated = new EventEmitter<string | null>();
  // Emits detailed debug info for each API interaction
  @Output() debug = new EventEmitter<{
    category: 'projects'|'layouts'|'pluList'|'pluDetails'|'staticTexts'|'preview';
    ok: boolean;
    request: { method: string; url: string; params?: any; body?: any };
    response?: any;
    error?: any;
    status?: number;
    startedAt: string;
    durationMs: number;
  }>();

  labelProjects: { labelProjectName: string }[] = [];
  labelLayouts: { layoutNumber: number; layoutName: string }[] = [];
  pluList: { number: number; name: string }[] = [];
  selectedProject = '';
  selectedLayoutNumber: number | null = null;
  selectedPLUNumber: number | null = null;
  lastPluDetails: any = null;
  isLoadingPreview = false;
  previewError = '';
  previewImageDataUrl: string | null = null;
  layoutsLoadFailed = false;
  // Local configuration for StaticTexts per project+layout, persisted in localStorage
  // Static texts are not edited manually; will be provided by API in future

  ngOnInit(): void {
    // Initialize with input preselects if provided
    this.selectedProject = this.project || '';
    this.selectedLayoutNumber = this.layoutNumber ?? null;
    this.selectedPLUNumber = this.pluNumber ?? null;
    this.loadLabelProjects();
  }

  private baseUrl(): string { return this.apiConfig.getBaseUrl(); }

  loadLabelProjects(): void {
    const url = `${this.baseUrl()}/api/v1/label-projects`;
    const started = Date.now();
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.labelProjects = Array.isArray(res) ? res : [];
        this.debug.emit({
          category: 'projects', ok: true,
          request: { method: 'GET', url }, response: res,
          status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
        // If preselected project provided, cascade load
        if (this.selectedProject) this.onProjectChange();
      },
      error: (err) => {
        console.error('Failed to load label projects', err);
        this.debug.emit({
          category: 'projects', ok: false,
          request: { method: 'GET', url }, error: err,
          status: err?.status, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
      }
    });
  }

  onProjectChange(): void {
    this.previewError = '';
    this.previewImageDataUrl = null;
    this.labelLayouts = [];
    this.pluList = [];
    this.selectedLayoutNumber = null;
    this.selectedPLUNumber = null;
  this.layoutsLoadFailed = false;
    if (!this.selectedProject) return;
    const url = `${this.baseUrl()}/api/v1/label-layouts`;
    const params = { labelProjectName: this.selectedProject } as const;
    const started = Date.now();
    this.http.get<any[]>(url, { params }).subscribe({
      next: (res) => {
        this.labelLayouts = (Array.isArray(res) ? res : []).map((x: any) => ({
          layoutNumber: Number(x.layoutNumber),
          layoutName: String(x.layoutName ?? x.name ?? x.layoutNumber)
        }));
        this.debug.emit({
          category: 'layouts', ok: true,
          request: { method: 'GET', url, params }, response: res,
          status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
  if (this.layoutNumber != null) this.selectedLayoutNumber = this.layoutNumber; // respect input if given
      },
      error: (err) => {
        console.error('Failed to load label layouts', err);
        this.debug.emit({
          category: 'layouts', ok: false,
          request: { method: 'GET', url, params }, error: err,
          status: err?.status, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
        // Fallback: fetch all layouts and filter client-side if server-side filter fails (e.g., 500 mapping error)
        const urlAll = `${this.baseUrl()}/api/v1/label-layouts`;
        const started2 = Date.now();
        this.http.get<any[]>(urlAll).subscribe({
          next: (all) => {
            const arr = Array.isArray(all) ? all : [];
            const filtered = arr.filter((x: any) => String(x?.labelProjectName || '').toLowerCase() === this.selectedProject.toLowerCase());
            this.labelLayouts = filtered.map((x: any) => ({
              layoutNumber: Number(x.layoutNumber),
              layoutName: String(x.layoutName ?? x.name ?? x.layoutNumber)
            }));
            this.debug.emit({
              category: 'layouts', ok: true,
              request: { method: 'GET', url: urlAll, params: { fallback: 'clientFilterByProject', project: this.selectedProject } }, response: { countAll: arr.length, countFiltered: filtered.length, items: filtered },
              status: 200, startedAt: new Date(started2).toISOString(), durationMs: Date.now()-started2
            });
            if (this.layoutNumber != null) this.selectedLayoutNumber = this.layoutNumber;
      this.layoutsLoadFailed = false;
          },
          error: (err2) => {
            console.error('Fallback fetch of all label layouts failed', err2);
            this.debug.emit({
              category: 'layouts', ok: false,
              request: { method: 'GET', url: urlAll, params: { fallback: 'clientFilterByProject', project: this.selectedProject } }, error: err2,
              status: err2?.status, startedAt: new Date(started2).toISOString(), durationMs: Date.now()-started2
            });
      // Enable manual entry fallback
      this.layoutsLoadFailed = true;
          }
        });
      }
    });
  }

  onLayoutChange(): void {
    this.previewError = '';
    this.previewImageDataUrl = null;
  const url = `${this.baseUrl()}/api/v1/articles/labeler`;
    const params = { skip: '0', take: '100', sort: 'Number+' } as const;
    const started = Date.now();
    this.http.get<any[]>(url, { params }).subscribe({
      next: (res) => {
        const arr = Array.isArray(res) ? res : [];
        this.pluList = arr.map((x: any) => ({ number: Number(x.number), name: String(x.name ?? '') }));
        this.debug.emit({
          category: 'pluList', ok: true,
          request: { method: 'GET', url, params }, response: res,
          status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
        if (this.pluNumber != null) this.selectedPLUNumber = this.pluNumber;
      },
      error: (err) => {
        console.error('Failed to load PLU list', err);
        this.debug.emit({
          category: 'pluList', ok: false,
          request: { method: 'GET', url, params }, error: err,
          status: err?.status, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
      }
    });
  }

  onPLUChange(): void {
    this.previewError = '';
    this.previewImageDataUrl = null;
    this.lastPluDetails = null;
    if (this.selectedPLUNumber == null) return;
    const url = `${this.baseUrl()}/api/v1/articles/${encodeURIComponent(String(this.selectedPLUNumber))}/labeler`;
    const started = Date.now();
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.lastPluDetails = res;
        this.debug.emit({
          category: 'pluDetails', ok: true,
          request: { method: 'GET', url }, response: res,
          status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
      },
      error: (err) => {
        console.error('Failed to load PLU details', err);
        this.debug.emit({
          category: 'pluDetails', ok: false,
          request: { method: 'GET', url }, error: err,
          status: err?.status, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
      }
    });
  }

  // Utility to generate 1..n array for template loops
  indexArray(n: number): number[] {
    const len = Math.max(0, Math.trunc(Number(n) || 0));
    const arr: number[] = [];
    for (let i = 1; i <= len; i++) arr.push(i);
    return arr;
  }

  previewLabel(): void {
    this.previewError = '';
    this.previewImageDataUrl = null;
    if (!this.selectedProject || this.selectedLayoutNumber == null || this.selectedPLUNumber == null) {
      this.previewError = 'Please select Project, Layout, and PLU.';
      return;
    }
    // If PLU assigns a static text block number, load it before building the payload
    const aplu = (this.lastPluDetails || {}).articlePLU || {};
    const staticTextBlock: number | null = Number.isFinite(Number(aplu?.staticText)) ? Math.trunc(Number(aplu.staticText)) : null;
    this.isLoadingPreview = true;
    if (staticTextBlock && staticTextBlock > 0) {
      this.fetchStaticTexts(staticTextBlock, this.selectedProject, this.selectedLayoutNumber).subscribe({
        next: (map) => this.doPreviewWithPayload(this.buildPreviewPayload(map || {})),
        error: () => this.doPreviewWithPayload(this.buildPreviewPayload({})),
      });
    } else {
      this.doPreviewWithPayload(this.buildPreviewPayload({}));
    }
  }

  private doPreviewWithPayload(payload: any): void {
    const url = `${this.baseUrl()}/api/v1/label-preview`;
    const started = Date.now();
    this.http.post<any>(url, payload).subscribe({
      next: (res) => {
        this.isLoadingPreview = false;
        const base64 = (res as any)?.data || (res as any)?.imageBase64 || (res as any)?.ImageBase64 || res as any;
        if (typeof base64 === 'string') {
          this.previewImageDataUrl = `data:image/jpeg;base64,${base64}`;
          this.previewGenerated.emit(this.previewImageDataUrl);
          this.debug.emit({
            category: 'preview', ok: true,
            request: { method: 'POST', url, body: payload }, response: res,
            status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
          });
        } else {
          this.previewError = 'Preview returned unexpected format.';
          this.previewGenerated.emit(null);
          this.debug.emit({
            category: 'preview', ok: false,
            request: { method: 'POST', url, body: payload }, response: res,
            status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
          });
        }
      },
      error: (err) => {
        this.isLoadingPreview = false;
        this.previewError = err?.error?.message || err?.message || 'Failed to generate preview.';
        this.previewGenerated.emit(null);
        this.debug.emit({
          category: 'preview', ok: false,
          request: { method: 'POST', url, body: payload }, error: err,
          status: err?.status, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
        });
      }
    });
  }

  private fetchStaticTexts(blockNumber: number, project: string, layout: number): Observable<Record<number, string>> {
    const started = Date.now();
    const url = `${this.baseUrl()}/extensions/api/StaticTexts/ReadTextBlockAsync`;
    const params = { number: String(blockNumber) } as const;
  return new Observable<Record<number, string>>((subscriber) => {
      this.http.get<any>(url, { params }).subscribe({
        next: (res) => {
          // Normalize response to map {n: text}
          const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
          const map: Record<number,string> = {};
          if (Array.isArray(items)) {
            for (const it of items) {
              const n = Number(it?.number);
              const t = it?.textValue ?? it?.value ?? it?.text;
              if (Number.isFinite(n) && n >= 1 && n <= 50 && t != null) map[n] = String(t);
            }
          }
          this.debug.emit({
            category: 'staticTexts', ok: true,
            request: { method: 'GET', url, params }, response: res,
            status: 200, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
          });
          subscriber.next(map);
          subscriber.complete();
        },
        error: (err) => {
          this.debug.emit({
            category: 'staticTexts', ok: false,
            request: { method: 'GET', url, params }, error: err,
            status: err?.status, startedAt: new Date(started).toISOString(), durationMs: Date.now()-started
          });
          subscriber.error(err);
        }
      });
    });
  }

  private storageKey(): string | null {
    if (!this.selectedProject || this.selectedLayoutNumber == null) return null;
    return `staticTexts:${this.selectedProject}:${this.selectedLayoutNumber}`;
  }

  

  private buildPreviewPayload(fetchedStaticTexts: Record<number,string> = {}): any {
    const article = this.lastPluDetails || {};
    const aplu = article.articlePLU || {};
    const val = (obj: any, path: string, fallback: any = null) => {
      try {
        return path.split('.').reduce((a: any, k: string) => (a && a[k] !== undefined ? a[k] : undefined), obj) ?? fallback;
      } catch { return fallback; }
    };

    // Helpers to only include present values and coerce numerics
    const addIfPresent = (obj: any, key: string, value: any) => {
      if (value !== null && value !== undefined) obj[key] = value;
    };
    const addIntIfPresent = (obj: any, key: string, value: any) => {
      if (value === null || value === undefined || value === '') return;
      const n = typeof value === 'number' ? Math.trunc(value) : Number.parseInt(String(value), 10);
      if (!Number.isNaN(n)) obj[key] = n;
    };
    const addStrIfPresent = (obj: any, key: string, value: any) => {
      if (value === null || value === undefined) return;
      const s = String(value);
      if (s.length > 0) obj[key] = s;
    };

    const codeFields: any = {};
    for (let i = 1; i <= 7; i++) {
      const num = val(aplu, `codeField${i}`, 0);
      const str = val(aplu, `codeString${i}`, '');
      const codeNum = Number.isFinite(Number(num)) ? Math.trunc(Number(num)) : 0;
      let codeStr = (str ?? '').toString();
      // Fail-safe: when a code is selected but substring is empty, provide a minimal placeholder
      if (codeNum > 0 && codeStr.trim().length === 0) codeStr = '0';
      codeFields[`codeNumber${i}`] = codeNum;
      codeFields[`codeSubstring${i}`] = codeStr;
    }

  const dateFields: any = {};
  const dt1 = val(aplu, 'dateTextField1.text', '');
  const dt2 = val(aplu, 'dateTextField2.text', '');
  const dt3 = val(aplu, 'dateTextField3.text', '');
  dateFields.dateText1 = dt1 ?? '';
  dateFields.dateText2 = dt2 ?? '';
  dateFields.dateText3 = dt3 ?? '';
  dateFields.shelfLifeDays1 = Number.isFinite(Number(val(aplu, 'shelfLifeDays1', 0))) ? Math.trunc(Number(val(aplu, 'shelfLifeDays1', 0))) : 0;
  dateFields.shelfLifeDays2 = Number.isFinite(Number(val(aplu, 'shelfLifeDays2', 0))) ? Math.trunc(Number(val(aplu, 'shelfLifeDays2', 0))) : 0;

    const graphicFields: any = {};
    for (let i = 1; i <= 10; i++) {
      const logo = val(aplu, `logoField${i}`, 0);
      graphicFields[`logo${i}`] = Number.isFinite(Number(logo)) ? Math.trunc(Number(logo)) : 0;
    }

    const generalNumbers: any = {};
    for (let i = 1; i <= 20; i++) {
      const gn = val(aplu, `generalNumber${i}`, 0);
      generalNumbers[`generalNumber${i}`] = Number.isFinite(Number(gn)) ? Math.trunc(Number(gn)) : 0;
    }

  // Build specificNumbers by omitting nulls and coercing to integers where applicable
  const specificNumbers: any = {};
  specificNumbers.batchNumber = Number.isFinite(Number(val(aplu, 'batchNumber', 0))) ? Math.trunc(Number(val(aplu, 'batchNumber', 0))) : 0;
  // customerNumber is a string per Swagger
  specificNumbers.customerNumber = String(val(article, 'customerNumber', '') ?? val(aplu, 'customerNumber', ''));
  specificNumbers.deviceNumber = Number.isFinite(Number(val(aplu, 'deviceNumber', 0))) ? Math.trunc(Number(val(aplu, 'deviceNumber', 0))) : 0;
  specificNumbers.lotNumber = Number.isFinite(Number(val(aplu, 'lotNumber', 0))) ? Math.trunc(Number(val(aplu, 'lotNumber', 0))) : 0;
  specificNumbers.numerator = Number.isFinite(Number(val(aplu, 'numerator', 0))) ? Math.trunc(Number(val(aplu, 'numerator', 0))) : 0;
  specificNumbers.operatorNumber = Number.isFinite(Number(val(aplu, 'operatorNumber', 0))) ? Math.trunc(Number(val(aplu, 'operatorNumber', 0))) : 0;
  // pcsPerPackage is a string per Swagger
  specificNumbers.pcsPerPackage = String(val(aplu, 'pcsPerPackage', '') ?? '');
  specificNumbers.pieceTotal = Number.isFinite(Number(val(aplu, 'pieceTotal', 0))) ? Math.trunc(Number(val(aplu, 'pieceTotal', 0))) : 0;
  // pluNumber is a string per Swagger
  specificNumbers.pluNumber = String(this.selectedPLUNumber ?? '');
  specificNumbers.plusDays = Number.isFinite(Number(val(aplu, 'plusDays', 0))) ? Math.trunc(Number(val(aplu, 'plusDays', 0))) : 0;
  specificNumbers.wgNumber = Number.isFinite(Number(val(aplu, 'wgNumber', 0))) ? Math.trunc(Number(val(aplu, 'wgNumber', 0))) : 0;

  const priceFields: any = {};
  const sup = val(aplu, 'specialUnitPriceValue', '');
  const up = val(aplu, 'unitPriceValue', '');
  priceFields.specialUnitPrice = String(sup ?? '');
  priceFields.unitPrice = String(up ?? '');

    const simpleTexts: any = {};
    for (let i = 1; i <= 30; i++) {
      const st = val(aplu, `simpleText${i}`, '');
      const v = (st ?? '').toString();
      // Fail-safe: use '-' when a simple text is missing to satisfy preview API
      simpleTexts[`simpleText${i}`] = v.trim().length > 0 ? v : '-';
    }

    // Static texts (1..50) and General texts (1..20)
    const staticTexts: any = {};
    for (let i = 1; i <= 50; i++) {
      // Priority: fetched static texts -> PLU value -> '-'
      const fetched = fetchedStaticTexts?.[i];
      const st = (fetched != null && String(fetched).trim().length > 0)
        ? String(fetched)
        : val(aplu, `staticText${i}`, '');
      const v = (st ?? '').toString();
      staticTexts[`staticText${i}`] = v.trim().length > 0 ? v : '-';
    }
    const generalTexts: any = {};
    for (let i = 1; i <= 20; i++) {
      // Map PLU textFieldN.text into generalTextN per Swagger VarIdType (generalText01..20)
      const gt = val(aplu, `textField${i}.text`, '');
      generalTexts[`generalText${i}`] = gt ?? '';
    }
    // Fallbacks: if empty, try article fields or set '-'
    const fallbacks: Record<number, any> = {
      1: val(article, 'name', ''),
      2: val(article, 'number', ''),
      3: val(article, 'description', '') || val(article, 'commonText1', ''),
      4: val(article, 'additional1', ''),
      5: val(article, 'additional2', ''),
      6: val(article, 'commonText2', ''),
    };
    for (let i = 1; i <= 20; i++) {
      const key = `generalText${i}`;
      const current = String(generalTexts[key] ?? '');
      if (current.trim().length === 0) {
        const fb = fallbacks[i];
        const fbStr = fb != null ? String(fb) : '';
        generalTexts[key] = fbStr.trim().length > 0 ? fbStr : '-';
      }
    }

    const textFields: any = {
      articleText: val(article, 'name', '') || val(article, 'articleText', ''),
      simpleTexts,
      staticTexts,
      generalTexts
    };

    const payload: any = {
      labelProjectName: this.selectedProject,
      layoutNumber: this.selectedLayoutNumber,
      codeFields,
      dateFields,
      graphicFields,
      numberFields: { generalNumbers, specificNumbers },
      priceFields,
      textFields
    };
    return payload;
  }
}
