import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  
  // Skip interceptor for auth endpoints to avoid infinite loops
  if (req.url.includes('/api/v1/token')) {
    return next(req);
  }
  
  const token = authService.getToken();
  
  // Clone the request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized responses
      if (error.status === 401) {
        // Force logout since this API doesn't support token refresh
        authService.forceLogout();
      }
      
      return throwError(() => error);
    })
  );
};
