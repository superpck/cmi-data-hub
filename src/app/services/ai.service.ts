import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

  aiProcess(payload: any): Promise<any> {
    try {
      if (!payload || !payload.user) {
        return Promise.reject('Payload must have a user message');
      }
      const url = `${Config.apiEndpoint.ai.url}${Config.apiEndpoint.ai.message_endpoint}`;
      const headers = this.createHeaders();
      console.log('AI API URL:', url);
      const payloadData = {
        model: Config.aiModel,
        messages: [
          {
            role: "system",
            content: payload?.system || "คุณคือ AI ผู้เชี่ยวชาญด้านเวชระเบียนและรหัสโรค (Medical Coder) จงวิเคราะห์ข้อมูลผู้ป่วยและสรุปผลเป็นรูปแบบ JSON เท่านั้น โดยบังคับให้มีคีย์ต่อไปนี้: principal_diagnosis (โรคหลัก), icd_10_pdx (รหัสโรคหลัก), secondary_diagnosis (โรคร่วม/แทรกซ้อน ถ้าไม่มีให้ใส่ None), procedure (หัตถการ)"
          },
          { role: 'user', content: payload.user }
        ],
        max_tokens: payload.user.length + 2000,
        response_format: {
          type: "json_object"
        }
      };
      console.log('Payload to AI API:', payloadData);
      return firstValueFrom(
        this.http.post<any>(url, payloadData, { headers })
      );
    } catch (error: any) {
      console.error('Error in aiProcess:', error.message || error);
      return Promise.reject(error);
    }
  }
}
