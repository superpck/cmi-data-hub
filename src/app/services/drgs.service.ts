import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom } from 'rxjs';
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
    } catch (error: any) {
      // When responseType is 'blob', error.error is a Blob, need to read it as text
      if (error?.error instanceof Blob) {
        try {
          const text = await error.error.text();
          const errorObj = JSON.parse(text);
          throw new Error(errorObj.message || 'เกิดข้อผิดพลาด');
        } catch (parseError) {
          throw new Error(error?.message || 'เกิดข้อผิดพลาด');
        }
      }
      const errorMessage = error?.error?.message || error?.message || 'เกิดข้อผิดพลาด';
      throw new Error(errorMessage);
    }
  }

  async downloadZipFile(year: number, month: number, region: string | null = null, province: string | null = null): Promise<any> {
    try {
      const result = await lastValueFrom(
        this.http.post(`${this.url}/data-hub/zip-file`, { year, month, region, province }, { responseType: 'blob', observe: 'response' })
      );
      return result;
    } catch (error: any) {
      if (error?.error instanceof Blob) {
        try {
          const text = await error.error.text();
          throw new Error(JSON.parse(text));
        } catch (parseError) {
          throw new Error(error?.message || 'เกิดข้อผิดพลาด');
        }
      }
      const errorMessage = error?.error?.message || error?.message || 'เกิดข้อผิดพลาด';
      throw new Error(errorMessage);
    }
  }

  async getConsent(form: string): Promise<any> {
    try {
      // { status, result: { date, form }
      return await firstValueFrom(this.http.get(`${this.url}/data-hub/get-consent/${form}`));
    } catch (error) {
      return error;
    }
  }

  async saveConsent(form: string): Promise<any> {
    try {
      // { status, result: [id]
      return await firstValueFrom(this.http.put(`${this.url}/data-hub/save-consent/${form}`, {}));
    } catch (error) {
      return error;
    }
  }

  async saveIPD(data: any): Promise<any> {
    try {
      return await firstValueFrom(this.http.put(`${this.url}/data-hub/save-ipd`, { data }));
    } catch (error) {
      return error;
    }
  }
}
