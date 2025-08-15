import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface JobRequest {
  jobType: string;
  parameters?: Record<string, any>;
}

interface JobSummary {
  jobId: string;
  actionName: string;
  jobType: string;
  progress: number;
  state: string;
  error: string;
}

interface ApiResponse {
  response: any;
  isError: boolean;
}

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actions.html',
  styleUrl: './actions.scss'
})
export class ActionsComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:9997';

  // Form model
  newJob: JobRequest = { jobType: '', parameters: {} };
  parameterKey = '';
  parameterValue = '';
  
  // Data
  jobs: JobSummary[] = [];
  jobStatus: any = null;
  isLoadingJobs = false;
  isCheckingStatus = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  statusMessage = '';

  // API Response tracking
  postResponse: ApiResponse | null = null;
  postUrl = '';
  getResponse: ApiResponse | null = null;
  getUrl = '';
  extractedJobId = '';
  
  // Progress tracking
  jobProgress: number | null = null;
  pollingInterval: any = null;
  maxPollingAttempts = 300; // 5 minutes at 1-second intervals
  currentPollingAttempts = 0;

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
    this.postResponse = null;  // Clear previous responses
    this.getResponse = null;
    this.jobProgress = null;
    this.stopPolling(); // Stop any existing polling
    
    if (!this.newJob.jobType.trim()) {
      this.errorMessage = 'Job type required';
      return;
    }
    this.isSubmitting = true;
    
    // Build URL with actionName query parameter
    let url = `${this.baseUrl}/api/v1/jobs?actionName=${encodeURIComponent(this.newJob.jobType)}`;
    
    // Add other parameters as query string if they exist
    if (this.newJob.parameters && Object.keys(this.newJob.parameters).length > 0) {
      const paramEntries = Object.entries(this.newJob.parameters);
      for (const [key, value] of paramEntries) {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      }
    }
    
    this.postUrl = url;  // Store URL for display
    
    this.http.post(url, {}).subscribe({
      next: (resp: any) => {
        this.isSubmitting = false;
        this.successMessage = 'Job submitted successfully';
        this.postResponse = { response: resp, isError: false };
        console.log('POST success:', resp);
        
        // Extract jobId from response and automatically check status
        const jobId = this.extractJobId(resp);
        if (jobId) {
          this.extractedJobId = jobId;
          this.currentPollingAttempts = 0;
          console.log('Extracted jobId:', jobId, 'starting automatic status polling...');
          this.startJobStatusPolling(jobId);
        } else {
          console.warn('Could not extract jobId from POST response:', resp);
        }
        
        this.resetForm();
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage = 'POST Error: ' + this.getErrorMessage(err);
        this.postResponse = { response: err, isError: true };
        console.error('POST error:', err);
      }
    });
  }

  // Extract jobId from POST response
  private extractJobId(response: any): string | null {
    // Primary: Try the exact field name from API
    if (response?.jobId) return response.jobId;
    
    // Fallback: Try other common patterns
    if (response?.id) return response.id;
    if (response?.data?.jobId) return response.data.jobId;
    if (response?.data?.id) return response.data.id;
    
    // If response is a string, it might be the jobId itself
    if (typeof response === 'string') return response;
    
    return null;
  }

  // Start automatic job status polling
  private startJobStatusPolling(jobId: string): void {
    this.checkJobStatusById(jobId);
  }

  // Stop polling
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.currentPollingAttempts = 0;
  }

  // Extract progress from job status response
  private extractProgress(response: any): number {
    // Primary: Use the progress field directly from API
    if (typeof response?.progress === 'number') return response.progress;
    
    // Fallback: Try other common patterns
    if (typeof response?.percentage === 'number') return response.percentage;
    if (typeof response?.completed === 'number') return response.completed;
    if (typeof response?.data?.progress === 'number') return response.data.progress;
    if (typeof response?.data?.percentage === 'number') return response.data.percentage;
    
    // Try to parse from state strings (API uses 'state' not 'status')
    if (typeof response?.state === 'string') {
      const state = response.state.toLowerCase();
      if (state.includes('completed') || state.includes('finished') || state.includes('done')) return 100;
      if (state.includes('running') || state.includes('processing')) return 50;
      if (state.includes('starting') || state.includes('queued')) return 10;
      if (state.includes('failed') || state.includes('error')) return 100; // Complete but failed
    }
    
    // Fallback to old 'status' field for backward compatibility
    if (typeof response?.status === 'string') {
      const status = response.status.toLowerCase();
      if (status.includes('completed') || status.includes('finished') || status.includes('done')) return 100;
      if (status.includes('running') || status.includes('processing')) return 50;
      if (status.includes('starting') || status.includes('queued')) return 10;
      if (status.includes('failed') || status.includes('error')) return 100; // Complete but failed
    }
    
    return 0; // Default to 0 if no progress found
  }

  // GET /api/v1/jobs?jobId=<id> - automatic call after POST with polling
  private checkJobStatusById(jobId: string): void {
    if (this.currentPollingAttempts >= this.maxPollingAttempts) {
      console.warn('Max polling attempts reached, stopping polling');
      this.stopPolling();
      return;
    }

    this.isCheckingStatus = true;
    this.statusMessage = '';
    
    const url = `${this.baseUrl}/api/v1/jobs?jobId=${encodeURIComponent(jobId)}`;
    this.getUrl = url;  // Store URL for display
    console.log(`Checking job status (attempt ${this.currentPollingAttempts + 1}):`, url);
    
    this.http.get(url).subscribe({
      next: resp => {
        this.jobStatus = resp;
        this.isCheckingStatus = false;
        this.statusMessage = 'Status retrieved automatically';
        this.getResponse = { response: resp, isError: false };
        this.currentPollingAttempts++;
        
        // Extract and update progress
        const progress = this.extractProgress(resp);
        this.jobProgress = progress;
        
        console.log(`Status check success (attempt ${this.currentPollingAttempts}):`, resp, `Progress: ${progress}%`);
        
        // Continue polling if progress < 100 and not at max attempts
        if (progress < 100 && this.currentPollingAttempts < this.maxPollingAttempts) {
          console.log(`Progress ${progress}% < 100%, scheduling next poll in 1 second...`);
          this.pollingInterval = setTimeout(() => {
            this.checkJobStatusById(jobId);
          }, 1000);
        } else {
          console.log(`Job completed or max attempts reached. Progress: ${progress}%, Attempts: ${this.currentPollingAttempts}`);
          this.stopPolling();
        }
      },
      error: err => {
        this.isCheckingStatus = false;
        this.statusMessage = 'Status check error: ' + this.getErrorMessage(err);
        this.getResponse = { response: err, isError: true };
        this.currentPollingAttempts++;
        console.error(`Status check error (attempt ${this.currentPollingAttempts}):`, err);
        
        // Stop polling on error or continue with backoff
        if (err.status === 404 || this.currentPollingAttempts >= this.maxPollingAttempts) {
          this.stopPolling();
        } else {
          // Retry with exponential backoff for server errors
          const delay = err.status >= 500 ? 5000 : 1000;
          console.log(`Retrying in ${delay}ms...`);
          this.pollingInterval = setTimeout(() => {
            this.checkJobStatusById(jobId);
          }, delay);
        }
      }
    });
  }

  // GET /api/v1/jobs (if endpoint supports listing all jobs)
  loadJobs(): void {
    this.isLoadingJobs = true;
    this.errorMessage = '';
    this.http.get<JobSummary[]>(`${this.baseUrl}/api/v1/jobs`).subscribe({
      next: resp => {
        this.jobs = resp || [];
        this.isLoadingJobs = false;
        console.log('GET success:', resp);
      },
      error: err => {
        this.isLoadingJobs = false;
        // Don't show GET errors as prominently since the endpoint might not exist
        console.warn('GET /api/v1/jobs failed:', err);
        if (err.status === 404) {
          console.log('GET endpoint not implemented - this is normal for demo');
        } else {
          this.errorMessage = 'GET Error: ' + this.getErrorMessage(err);
        }
      }
    });
  }

  resetForm(): void {
    this.stopPolling();  // Stop any active polling
    this.newJob = { jobType: '', parameters: {} };
    this.parameterKey = '';
    this.parameterValue = '';
    this.jobProgress = null;
    this.extractedJobId = '';
    this.postResponse = null;
    this.getResponse = null;
    this.jobStatus = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.statusMessage = '';
  }

  refresh(): void { this.loadJobs(); }

  getObjectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }

  private getErrorMessage(error: any): string {
    if (error?.status === 0) return 'Cannot reach server';
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    return 'Unknown error';
  }
}
