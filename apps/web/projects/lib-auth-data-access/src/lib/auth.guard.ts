import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Permission } from './auth.permissions';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.getToken()) return true;
  return router.createUrlTree(['/auth/login']);
};

export const permissionGuard = (permission: Permission): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasPermission(permission)) return true;
    return router.createUrlTree(['/dashboard']);
  };
};

export const adminGuard: CanActivateFn = () => {
  return permissionGuard('VIEW_ADMIN_DASHBOARD')({} as any, {} as any);
};

export const userGuard: CanActivateFn = () => {
  return permissionGuard('TRACK_TRAINING')({} as any, {} as any);
};

