import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ApiConfigState {
  host: string;
  port: number;
  useHttps: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiConfig {
  private readonly STORAGE_KEY = 'api_config';
  private readonly defaults: ApiConfigState = { host: 'localhost', port: 9997, useHttps: false };
  private readonly state$ = new BehaviorSubject<ApiConfigState>(this.load());

  get state(): ApiConfigState { return this.state$.value; }
  get stateChanges() { return this.state$.asObservable(); }

  getBaseUrl(): string {
    const { host, port, useHttps } = this.state$.value;
    const protocol = useHttps ? 'https' : 'http';
    return `${protocol}://${host}:${port}`;
  }

  setConfig(partial: Partial<ApiConfigState>) {
    const next: ApiConfigState = { ...this.state$.value, ...partial };
    this.state$.next(next);
    this.save(next);
  }

  setAll(host: string, port: number, useHttps: boolean) {
    this.setConfig({ host, port, useHttps });
  }

  private load(): ApiConfigState {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.defaults;
      const parsed = JSON.parse(raw);
      return {
        host: parsed.host ?? this.defaults.host,
        port: Number(parsed.port ?? this.defaults.port),
        useHttps: Boolean(parsed.useHttps ?? this.defaults.useHttps)
      };
    } catch {
      return this.defaults;
    }
  }

  private save(state: ApiConfigState) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}
