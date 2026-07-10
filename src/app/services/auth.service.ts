import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import APP_CONFIG from '../configs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import dayjs from 'dayjs';

export interface ApiResponse {
  statusCode: number;
  url?: string;
  message?: string;
  success?: boolean;
  token?: boolean;
  rows?: any[];
  row?: any;
  data?: any;
  error?: any;

}@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = APP_CONFIG.tokenName;
  url = APP_CONFIG.apiEndpoint.user;
  myMophUrl = APP_CONFIG.apiEndpoint.apiMyMoph;

  constructor(private readonly http: HttpClient) { }

  /** Save token to sessionStorage so interceptors can pick it up later. */
  setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  /** Retrieve the raw token string or null if it does not exist. */
  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
  }

  /** Remove token from storage. */
  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
  }

  /** True when a non-expired token is present. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const payload = this.decodeToken(token);
    if (!payload) {
      return false;
    }

    const record = payload as Record<string, unknown>;
    const expValue = record['exp'];
    const exp = typeof expValue === 'number' ? expValue : Number(expValue);
    if (Number.isNaN(exp)) {
      return true; // Treat tokens without exp as valid until revoked.
    }

    const expiresAt = exp * 1000; // exp is in seconds per JWT spec.
    return Date.now() < expiresAt;
  }

  /** Decode a JWT payload without verifying its signature. */
  decodeToken<T = Record<string, unknown>>(token?: string): T | null {
    const raw = token ?? this.getToken();
    if (!raw) {
      return null;
    }

    const segments = raw.split('.');
    if (segments.length < 2) {
      return null;
    }

    try {
      const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = decodeURIComponent(
        atob(base64)
          .split('')
          .map((char) => `%${('00' + char.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      return JSON.parse(decoded) as T;
    } catch (error) {
      console.warn('Unable to decode JWT payload', error);
      return null;
    }
  }

  async providerIDSignin(code: string | null, state: string | null = null, lineId: string | null = null): Promise<ApiResponse> {
    if (!code) {
      throw new Error('Missing provider ID code');
    }

    try {
      const response: ApiResponse = await lastValueFrom(
        this.http.post<ApiResponse>(`${this.url}/admin/providerid/signin`, { code, state, lineId })
      );
      return response;
    } catch (error: any) {
      return error;
    }
  }

  async providerIDPortal(type: string | null = null, lineId: string | null = null): Promise<ApiResponse> {
    try {
      const kwd = dayjs().add(2, 'seconds').format('YYYYMMDDHHmmss');
      const response = await lastValueFrom(
        this.http.post<ApiResponse>(`${this.url}/admin/providerid/create-url`, { kwd, type, lineId })
      );
      return response;
    } catch (error: any) {
      return error;
    }
  }

  async getMyMophUrl(): Promise<any> {
    const url = `${this.myMophUrl}/api/my-moph/create-url`;
    try {
      const response = await firstValueFrom(
        this.http.get(url)
      );
      return response;
    } catch (error: any) {
      console.log('Fetch Error:', url, error.message);
      return error;
    }
  }
  async myMophSignin(code: string | null, state: string | null = null): Promise<ApiResponse> {
    if (!code) {
      throw new Error('Missing provider ID code');
    }

    try {
      const response: any = await lastValueFrom(
        this.http.get(`${this.myMophUrl}/signIn/?code=${code}&state=${state}`)
      );
      return response;
    } catch (error: any) {
      return error;
    }
  }

  async thaIDPortal(type: string = 'approve', lineId: string | null = null): Promise<unknown> {
    try {
      let sourceUrl: any = window.location.href.split('/')[2];
      const kwd = dayjs().add(2, 'seconds').format('YYYYMMDDHHmmss');
      return await lastValueFrom(
        this.http.get(`${this.url}/thaid/create-thaID-url/${kwd}/${type}/${sourceUrl}`)
      );
    } catch (error: any) {
      return error;
    }
  }
}
