import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService, Brain2Right } from './user.service';

/**
 * Mapping of page routes to required Brain2 rights
 */
const PAGE_TO_RIGHT_MAP: Record<string, Brain2Right> = {
  'capture': 'CaptureDisplay',
  'data-maintenance': 'MasterDataDisplay',
  'create-order': 'OrderEdit',
  'all-orders': 'OrderDisplay',
  'actions': 'SchedulerConfiguration',
  'admin': 'SystemConfigurationEdit',  // Admin page for configuring action buttons
  'package-record': 'OrderDisplay',
  'label-preview': 'LabelDesignerDisplay',
  'settings': 'SystemConfigurationDisplay'
};

/**
 * Local user auth guard to protect routes based on local user authentication
 */
export const userAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!userService.isAuthenticated()) {
    // Redirect to user login with return URL
    return router.createUrlTree(['/user-login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }

  return true;
};

/**
 * Permission-based guard - checks if user has specific Brain2 right
 */
export const userPermissionGuard = (page: string): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (!userService.isAuthenticated()) {
      return router.createUrlTree(['/user-login'], { 
        queryParams: { returnUrl: state.url } 
      });
    }

    // Map page to Brain2 right
    const requiredRight = PAGE_TO_RIGHT_MAP[page];
    
    if (!requiredRight || !userService.hasRight(requiredRight)) {
      // User doesn't have permission, redirect to dashboard (always accessible)
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  };
};
