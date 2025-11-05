import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService, UserRole } from './user.service';

/**
 * Local user auth guard to protect routes based on local user roles
 * This is a layer on top of Brain2 authentication
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

  // Check if route requires specific role
  const requiredRole = route.data['role'] as UserRole | undefined;
  if (requiredRole) {
    if (!userService.hasMinimumRole(requiredRole)) {
      // User doesn't have required role, redirect to their default page
      const pages = userService.getAccessiblePages();
      const redirectTo = pages.length > 0 ? `/${pages[0]}` : '/user-login';
      return router.createUrlTree([redirectTo]);
    }
  }

  return true;
};

/**
 * Factory function for creating role-specific guards
 */
export const userRoleGuard = (minimumRole: UserRole): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (!userService.isAuthenticated()) {
      return router.createUrlTree(['/user-login'], { 
        queryParams: { returnUrl: state.url } 
      });
    }

    if (!userService.hasMinimumRole(minimumRole)) {
      // Redirect to their home page
      const pages = userService.getAccessiblePages();
      const redirectTo = pages.length > 0 ? `/${pages[0]}` : '/user-login';
      return router.createUrlTree([redirectTo]);
    }

    return true;
  };
};
