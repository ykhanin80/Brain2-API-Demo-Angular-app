import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService, PagePermission } from './user.service';

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
 * Permission-based guard - checks if user has specific page permission
 */
export const userPermissionGuard = (requiredPermission: PagePermission): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (!userService.isAuthenticated()) {
      return router.createUrlTree(['/user-login'], { 
        queryParams: { returnUrl: state.url } 
      });
    }

    if (!userService.hasPermission(requiredPermission)) {
      // User doesn't have permission, redirect to their first accessible page
      const pages = userService.getAccessiblePages();
      const redirectTo = pages.length > 0 ? `/${pages[0]}` : '/user-login';
      return router.createUrlTree([redirectTo]);
    }

    return true;
  };
};
