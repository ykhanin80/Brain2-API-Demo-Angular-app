import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DEPRECATED: This component is no longer used.
 * User management is now handled entirely by Brain2's User Rights API.
 * This stub remains only to prevent compile errors from stale references.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">⚠️ Component Deprecated</h1>
      <p style="margin-top: 20px; font-size: 16px;">
        Local user management has been replaced by Brain2's User Rights API.
      </p>
      <p style="margin-top: 10px; color: #6b7280;">
        This page is no longer accessible. All user rights are now managed through Brain2.
      </p>
    </div>
  `,
  styles: []
})
export class AdminComponent {
  // Empty stub - all functionality removed
}
