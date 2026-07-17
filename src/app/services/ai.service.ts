import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of, timeout, firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Config from '../configs/config';

@Injectable({
  providedIn: 'root',
})
export class AIService {
  private http = inject(HttpClient);
  private readonly url = Config.apiEndpoint.drg_data;

  createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': Config.apiKey
    });
  }

  async aiCompletions(messages: any): Promise<any> {
    try {
      if (!messages || !Array.isArray(messages) || messages.length < 2) {
        return Promise.reject('Messages must be a non-empty array');
      }

      const result: any = await firstValueFrom(
        this.http.post(`${this.url}/AI/completions`, { messages }).pipe(
          timeout(180000),
          catchError((error: HttpErrorResponse) => {
            // error.error คือ JSON Body ที่ Angular parser ให้แล้ว
            // ใช้ of() เพื่อส่งค่ากลับเข้าไปใน stream ในฐานะ "ค่าปกติ" (ไม่ใช่ error)
            return of(error.error);
          })
        )
      );

      // const result1: any = await firstValueFrom(this.http.post<any>(`${this.url}/AI/completions`, { messages }));
      return result;
    } catch (error: any) {
      console.error('Error in aiCompletions:', error.message || error);
      return error;
    }
  }
}
