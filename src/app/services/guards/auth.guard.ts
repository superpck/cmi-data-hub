import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import CONFIG from '../../configs/config';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = sessionStorage.getItem(CONFIG.tokenName);

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
