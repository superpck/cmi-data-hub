import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import CONFIG from '../../configs/config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isDrgRequest = req.url.startsWith(CONFIG.apiEndpoint.drg_data);
  const tokenCMI = sessionStorage.getItem(CONFIG.tokenName);
  const tokenDRG = sessionStorage.getItem(CONFIG.drgTokenName);
  const token = isDrgRequest ? tokenDRG : tokenCMI;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (isDrgRequest) {
          sessionStorage.removeItem(CONFIG.drgTokenName);
        } else {
          sessionStorage.removeItem(CONFIG.tokenName);
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
