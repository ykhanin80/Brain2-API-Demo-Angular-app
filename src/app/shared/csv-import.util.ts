export interface CsvImportFieldDef {
  key: string;
  label: string;
  required?: boolean;
  synonyms: string[]; // normalized and compact versions should be included by caller if needed
}

export interface AutoMapOptions {
  extraMatcher?: (norm: string, normCompact: string, usedKeys: Set<string>) => string | undefined;
}

export function normalizeHeaderName(h: string): string {
  return (h || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function normalizeCompact(h: string): string {
  return normalizeHeaderName(h).replace(/[^a-z0-9]/g, '');
}

export function enforceUniqueMapping(mapping: { [csvHeader: string]: string }): { [csvHeader: string]: string } {
  const out: { [csvHeader: string]: string } = { ...mapping };
  const reverse: { [target: string]: string } = {};
  for (const [header, target] of Object.entries(out)) {
    if (!target) continue;
    if (reverse[target] && reverse[target] !== header) {
      // Drop the older header mapping to keep latest assignment unique
      delete out[reverse[target]];
    }
    reverse[target] = header;
  }
  return out;
}

export function autoMapHeaders(
  headers: string[],
  defs: CsvImportFieldDef[],
  existing: { [csvHeader: string]: string } = {},
  opts?: AutoMapOptions
): { [csvHeader: string]: string } {
  const mapping: { [csvHeader: string]: string } = { ...existing };
  const used = new Set(Object.values(mapping).filter(Boolean));
  for (const h of headers) {
    if (mapping[h]) continue; // already mapped
    const norm = normalizeHeaderName(h);
    const compact = normalizeCompact(h);

    // Custom hook first (domain-specific patterns)
    if (opts?.extraMatcher) {
      const k = opts.extraMatcher(norm, compact, used);
      if (k && !used.has(k)) { mapping[h] = k; used.add(k); continue; }
    }

    // Synonym-based matching
    const def = defs.find(d => !used.has(d.key) && (d.synonyms.includes(norm) || d.synonyms.includes(compact)));
    if (def) { mapping[h] = def.key; used.add(def.key); }
  }
  return enforceUniqueMapping(mapping);
}

export async function parseCsvFile(file: File, maxRows = 5000): Promise<{ rawRows: any[]; headers: string[] }>
{
  // Lazy import papaparse (supports both CJS/ESM)
  const mod = await import('papaparse');
  const Papa: any = (mod as any).default || mod;
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (results: any) => {
        const raw = (results.data || []).slice(0, maxRows);
        const headers: string[] = (results.meta?.fields || []).map((h: string) => h);
        resolve({ rawRows: raw, headers });
      },
      error: (err: any) => reject(err || new Error('CSV parse error'))
    });
  });
}

export interface QueueOptions<T> {
  concurrency: number;
  getCancelled?: () => boolean;
  onItemDone?: (item: T, index: number) => void;
  onDone?: () => void;
}

export async function runConcurrentQueue<T>(items: T[], worker: (item: T) => Promise<any>, opts: QueueOptions<T>): Promise<void> {
  let index = 0;
  let active = 0;
  return new Promise<void>((resolve) => {
    const pump = () => {
      if (opts.getCancelled?.()) {
        // Drain actives only; don't schedule new ones
        if (active === 0) { opts.onDone?.(); resolve(); }
        return;
      }
      if (index >= items.length) {
        if (active === 0) { opts.onDone?.(); resolve(); }
        return;
      }
      if (active >= opts.concurrency) return;
      const currentIndex = index++;
      const item = items[currentIndex];
      active++;
      worker(item).finally(() => {
        active--;
        opts.onItemDone?.(item, currentIndex);
        pump();
      });
      // Try to fill remaining slots quickly
      pump();
    };
    pump();
  });
}

export function downloadCsv(filename: string, headerLine: string, rows: string[]): void {
  const blob = new Blob([headerLine + rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Common helpers for parsing CSV cell values
export function trimValue(v: any): string {
  return (v === undefined || v === null) ? '' : String(v).trim();
}

export function parseNumberValue(v: any): number {
  const t = trimValue(v);
  if (!t) return 0;
  const m = t.match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',', '.')) : 0;
}

export function parseBoolValue(v: any): boolean {
  return /^true|1|yes$/i.test(trimValue(v));
}
