import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import CONFIG from '../configs/config';

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

  getToken(tokenName : string | null = null): string {
    tokenName = tokenName || CONFIG.drgTokenName || CONFIG.tokenName || 'token';
    console.log(`Getting token with name: ${tokenName}`);
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

  /** Decode JWT without redirecting (DRG-specific token) */
  async tokenDecodeDrg() {
    const token = sessionStorage.getItem(CONFIG.drgTokenName);
    if (!token) {
      return null;
    }
    if (token && !isTokenExpired(token)) {
      let decoded: any = await parseJwt(token);
      console.log('Decoded DRG token:', decoded);
      decoded.canDownload = true; //['สำนักงานสาธารณสุขจังหวัด'].includes(decoded?.health_office_type) ||
      // ['IA0041130','IA0014165'].includes(decoded?.hcode9) ||
      //   decoded?.health_office_type?.startsWith('สำนักงานเขตสุขภาพที่') ||
      //   decoded?.last_monthly;
      return decoded;

    }
    return null;
  }
}
