import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import CONFIG from '../configs/config';

@Injectable({ providedIn: 'root' })
export class DrgsService {
  private http = inject(HttpClient);
  private readonly url = CONFIG.apiEndpoint.drg_data;

  getToken(): string {
    return sessionStorage.getItem(CONFIG.drgTokenName) || '';
  }

  setToken(token: string): void {
    sessionStorage.setItem(CONFIG.drgTokenName, token);
  }

  clearToken(): void {
    sessionStorage.removeItem(CONFIG.drgTokenName);
    localStorage.removeItem(CONFIG.drgTokenName);
  }

  async login(username: string, password: string): Promise<any> {
    try {
      return await firstValueFrom(this.http.post(`${this.url}/login/hospital`, { username, password }));
    } catch (error: any) {
      return error;
    }
  }

  async loginByToken(token: string): Promise<any> {
    try {
      const result = await firstValueFrom(this.http.post(`${this.url}/login/login-by-nrefer`, { token }));
      return result;
    } catch (error: any) {
      return error;
    }
  }

  async getIPD(
    hospcode: string, year: any, month: any,
    searchType: string, searchValue: any,
    pageNo = 1, rowPerPage = 10
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post(`${this.url}/data`, { hospcode, year, month, searchType, searchValue, pageNo, rowPerPage })
      );
    } catch (error) {
      return error;
    }
  }

  async getIPDByAN(an: string, year: any): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/data/AN/${year}/${an}`));
    } catch (error) {
      return error;
    }
  }

  async drgSeeker(version = '6', data: any = null): Promise<any> {
    try {
      return await firstValueFrom(this.http.post(`${this.url}/drg/calculate`, { version, data }));
    } catch (error) {
      return error;
    }
  }

  async sendRows(year: number, month: any, data: any, deleteBefore = false): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post(`${this.url}/upload`, { year, month, data, reccount: data.length, deleteBefore })
      );
    } catch (error) {
      return error;
    }
  }

  async ipdResult(): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/libs/ipd-result`));
    } catch (error) {
      return error;
    }
  }

  async icd10(textSearch = ''): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/libs/icd10/${textSearch}`));
    } catch (error) {
      return error;
    }
  }

  async icdCM(textSearch = ''): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/libs/icd-cm/${textSearch}`));
    } catch (error) {
      return error;
    }
  }

  async drgName(textSearch = ''): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/libs/drg-name/${textSearch}`));
    } catch (error) {
      return error;
    }
  }

  async drgError(code: any = ''): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/libs/drg-error/${code}`));
    } catch (error) {
      return error;
    }
  }

  async drgWarning(code: any = ''): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.url}/libs/drg-warning/${code}`));
    } catch (error) {
      return error;
    }
  }

  // get จาก Data Hub
  async cmiDataHub(options: any): Promise<any> {
    try {
      if (options.format === 'CSV') {
        return await firstValueFrom(
          this.http.post(`${this.url}/data-hub`, options, { responseType: 'blob', observe: 'response' })
        );
      } else {
        return await firstValueFrom(
          this.http.post(`${this.url}/data-hub`, options)
        );
      }
    } catch (error) {
      throw error;
    }

  }

  async downloadZipFile(year: number, month: number, region: string | null= null): Promise<Blob> {
    try {
      return await firstValueFrom(
        this.http.post(`${this.url}/data-hub/zip-file`, { year, month, region }, { responseType: 'blob' })
      );
    } catch (error) {
      throw error;
    }
  }
}
