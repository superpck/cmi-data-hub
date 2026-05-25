import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import CONFIG from '../configs/config';
import { Observable } from 'rxjs';

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = parseJwt(token);
    if (!decoded?.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class MainService {
  private router = inject(Router);

  getToken(tokenName = CONFIG.tokenName): string {
    return sessionStorage.getItem(tokenName) || localStorage.getItem(tokenName) || '';
  }

  setToken(token: string, tokenName = CONFIG.tokenName): void {
    if (token) {
      sessionStorage.setItem(tokenName, token);
    }
  }

  /** Decode JWT and redirect to login if expired (main app token) */
  async decodeToken(token = ''): Promise<any> {
    if (!token) {
      token = this.getToken();
    }
    if (token && !isTokenExpired(token)) {
      return parseJwt(token);
    }
    this.router.navigate(['/login']);
    return null;
  }

  /** Decode JWT without redirecting (DRG-specific token) */
  async tokenDecode(token = '') {
    if (!token) {
      token = this.getToken();
    }
    if (token && !isTokenExpired(token)) {
      return await parseJwt(token);
    }
    return null;
  }
}
