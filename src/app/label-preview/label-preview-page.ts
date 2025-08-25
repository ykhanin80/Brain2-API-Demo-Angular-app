import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelPreviewTile } from './label-preview-tile';
import { Router } from '@angular/router';

@Component({
  selector: 'app-label-preview-page',
  standalone: true,
  imports: [CommonModule, LabelPreviewTile],
  templateUrl: './label-preview-page.html',
  styleUrl: './label-preview-page.scss'
})
export class LabelPreviewPage {
  private readonly router = inject(Router);

  // Debug storage similar to DataMaintenance (lightweight)
  activeDebugTab = signal<'projects'|'layouts'|'pluList'|'pluDetails'|'staticTexts'|'preview'>('projects');
  jsonCollapsed = signal(true);
  debugLogs = signal<Record<string, any>>({});

  goBackToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onDebugEvent(evt: any) {
    const key = evt?.category || 'preview';
    const current = this.debugLogs();
    this.debugLogs.set({ ...current, [key]: evt });
  }
}
