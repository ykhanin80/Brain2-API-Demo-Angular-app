import { Component, inject } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface JobRequest {
  jobType: string;
  parameters?: Record<string, any>;
}

interface JobSummary {
  id: string;
  jobType: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, JsonPipe],
  templateUrl: './actions.html',
  styleUrl: './actions.scss'
})
export class ActionsComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://usjpnt0000015:9997';

  // Form model
  newJob: JobRequest = { jobType: '', parameters: {} };
  parameterKey = '';
  parameterValue = '';

  // Data
  jobs: JobSummary[] = [];
  isLoadingJobs = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // Add a parameter pair to the job request
  addParameter(): void {
    if (!this.parameterKey.trim()) return;
    this.newJob.parameters = { ...(this.newJob.parameters || {}), [this.parameterKey.trim()]: this.parameterValue };
    this.parameterKey = '';
    this.parameterValue = '';
  }

  removeParameter(key: string): void {
    if (!this.newJob.parameters) return;
    const clone = { ...this.newJob.parameters };
    delete clone[key];
    this.newJob.parameters = clone;
  }

  // POST /api/v1/jobs
  submitJob(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.newJob.jobType.trim()) {
      this.errorMessage = 'Job type required';
      return;
    }
    this.isSubmitting = true;
    this.http.post(`${this.baseUrl}/api/v1/jobs`, this.newJob).subscribe({
      next: (resp: any) => {
        this.isSubmitting = false;
        this.successMessage = 'Job submitted';
        this.resetForm();
        this.loadJobs();
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  // GET /api/v1/jobs
  loadJobs(): void {
    this.isLoadingJobs = true;
    this.errorMessage = '';
    this.http.get<JobSummary[]>(`${this.baseUrl}/api/v1/jobs`).subscribe({
      next: resp => {
        this.jobs = resp || [];
        this.isLoadingJobs = false;
      },
      error: err => {
        this.isLoadingJobs = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  resetForm(): void {
    this.newJob = { jobType: '', parameters: {} };
    this.parameterKey = '';
    this.parameterValue = '';
  }

  refresh(): void { this.loadJobs(); }

  private getErrorMessage(error: any): string {
    if (error?.status === 0) return 'Cannot reach server';
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    return 'Unknown error';
  }
}
